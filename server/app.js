import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import { BUILDINGS } from '../src/app/campus-data.ts';
export function createApp({store, clientId='', admins=[], verifyToken, staticPath} = {}) {
  const app = express(); const google = new OAuth2Client(clientId);
  const allowed = new Set(admins.map(x=>x.trim().toLowerCase()).filter(Boolean));
  const verify = verifyToken || (async token => (await google.verifyIdToken({idToken:token,audience:clientId})).getPayload());
  app.disable('x-powered-by');
  app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cross-Origin-Opener-Policy':'same-origin-allow-popups'});next();});
  app.use('/api', (req,res,next)=>{res.set('Cache-Control','no-store');next();});
  app.use(express.json({limit:'16kb'}));
  async function admin(req,res,next) {
    if(!clientId) return res.status(503).json({error:'Admin sign-in is not configured.'});
    try {
      const bearer = req.get('Authorization') || '';
      if(!bearer.startsWith('Bearer ')) throw Error();
      const user = await verify(bearer.slice(7));
      if(!user?.sub || user.email_verified !== true || !user.email) throw Error();
      if(!allowed.has(user.email.toLowerCase())) return res.status(403).json({error:'This account is not an approved CampusAble admin.'});
      req.user = user; next();
    } catch {res.status(401).json({error:'Please sign in again with Google.'});}
  }
  function building(id) {return BUILDINGS.some(b=>b.id===Number(id));}
  function fail(status,message) {const e=new Error(message); e.status=status; throw e;}
  const attempts=new Map();
  app.get('/api/config',(req,res)=>res.json({clientId,demo:true}));
  app.get('/api/buildings',(req,res)=>res.json(BUILDINGS));
  app.get('/api/buildings/:id/closures',async(req,res)=>{
    if(!building(req.params.id)) return res.status(404).json({error:'Building not found.'});
    const state=await store.read(); res.json(state.closures.filter(c=>c.buildingId===Number(req.params.id)&&c.status==='active'));
  });
  app.post('/api/reports',async(req,res)=>{
    if(!req.is('application/json')) return res.status(415).json({error:'Send a JSON report.'});
    const {buildingId,description,category}=req.body || {};
    if(!building(buildingId)||!['Entrance','Elevator','Path','Other'].includes(category)||typeof description!=='string'||description.trim().length<10||description.length>1000) return res.status(400).json({error:'Choose a building and issue type, and enter 10–1,000 characters.'});
    const now=Date.now();
    for(const [key,value] of attempts) if(now-value.time>60000) attempts.delete(key);
    const limit=attempts.get(req.ip)||{time:now,count:0};
    if(limit.count>=10) return res.status(429).json({error:'Please wait a minute before sending another report.'});
    limit.count++;attempts.set(req.ip,limit);
    const report={id:randomUUID(),buildingId:Number(buildingId),category,description:description.trim(),status:'pending',createdAt:new Date().toISOString()};
    await store.change(s=>{if(s.reports.length>=500) fail(409,'The demo report limit has been reached.'); s.reports.push(report);});
    res.status(201).json({id:report.id,status:report.status});
  });
  app.get('/api/admin/me',admin,(req,res)=>res.json({name:req.user.name||'Admin'}));
  app.get('/api/reports',admin,async(req,res)=>res.json((await store.read()).reports));
  app.post('/api/closures',admin,async(req,res)=>{
    const {reportId}=req.body||{};
    const result=await store.change(s=>{
      const report=s.reports.find(r=>r.id===reportId);
      if(!report) fail(404,'Report not found.');
      if(report.status!=='pending') fail(409,'This report has already been reviewed.');
      const closure={id:randomUUID(),buildingId:report.buildingId,description:report.description,category:report.category,status:'active',demo:true,createdAt:new Date().toISOString()};
      s.closures.push(closure);report.status='published';return closure;
    });res.status(201).json(result);
  });
  app.patch('/api/reports/:id',admin,async(req,res)=>{
    if(req.body?.status!=='dismissed') return res.status(400).json({error:'Invalid report status.'});
    await store.change(s=>{const r=s.reports.find(r=>r.id===req.params.id);if(!r) fail(404,'Report not found.');if(r.status!=='pending') fail(409,'Report already reviewed.');r.status='dismissed';});res.json({ok:true});
  });
  app.patch('/api/closures/:id',admin,async(req,res)=>{
    if(req.body?.status!=='resolved') return res.status(400).json({error:'Invalid closure status.'});
    await store.change(s=>{const c=s.closures.find(c=>c.id===req.params.id);if(!c) fail(404,'Closure not found.');c.status='resolved';c.resolvedAt=new Date().toISOString();});res.json({ok:true});
  });
  app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));
  if(staticPath) app.use(express.static(staticPath));
  app.use((error,req,res,next)=>{if(res.headersSent)return next(error);const status=error.status||500;res.status(status).json({error:status<500?error.message:'The server could not complete the request. Please try again.'});});
  return app;
}
