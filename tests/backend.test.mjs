import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/app.js';
import {LocalStore} from '../server/store.js';

test('report review, admin authorization, cross-client visibility and persistence',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'campusable-test-'));
 const path=join(dir,'records.json');const store=new LocalStore(path);
 const app=createApp({store,clientId:'test-client',admins:['admin@example.com'],verifyToken:async token=>{
  if(token==='admin')return {sub:'123',email_verified:true,email:'admin@example.com',name:'Test admin'};
  if(token==='student')return {sub:'456',email_verified:true,email:'student@example.com'};
  throw Error('Invalid token');
 }});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});});
 const url=`http://127.0.0.1:${server.address().port}`;
 const request=async(path,method='GET',body,token)=>{const r=await fetch(url+'/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
 assert.equal((await request('/reports')).status,401);
 assert.equal((await request('/reports','GET',undefined,'student')).status,403);
 assert.equal((await request('/reports','GET',undefined,'invalid')).status,401);
 assert.equal((await request('/buildings/999/closures')).status,404);
 assert.equal((await request('/reports','POST',{buildingId:1,category:'Elevator',description:'tiny'})).status,400);
 const report=await request('/reports','POST',{buildingId:1,category:'Elevator',description:'Demo elevator issue at the first floor.'});assert.equal(report.status,201);
 assert.deepEqual((await request('/buildings/1/closures')).data,[]);
 assert.equal((await request('/reports','GET',undefined,'admin')).data.length,1);
 assert.equal((await request('/closures','POST',{reportId:report.data.id})).status,401);
 const published=await request('/closures','POST',{reportId:report.data.id},'admin');assert.equal(published.status,201);
 assert.equal((await request('/closures','POST',{reportId:report.data.id},'admin')).status,409);
 assert.equal((await request('/buildings/1/closures')).data.length,1);
 assert.equal((await new LocalStore(path).read()).closures.length,1);
 assert.equal((await request('/closures/'+published.data.id,'PATCH',{status:'resolved'},'student')).status,403);
 assert.equal((await request('/closures/'+published.data.id,'PATCH',{status:'resolved'},'admin')).status,200);
 assert.deepEqual((await request('/buildings/1/closures')).data,[]);
 const second=await request('/reports','POST',{buildingId:2,category:'Path',description:'Another example for dismissing a report.'});
 assert.equal((await request('/reports/'+second.data.id,'PATCH',{status:'dismissed'},'admin')).status,200);
 assert.equal((await request('/closures','POST',{reportId:second.data.id},'admin')).status,409);
});
test('simultaneous local writes do not drop reports',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'campusable-store-'));try{const store=new LocalStore(join(dir,'data.json'));await Promise.all(Array.from({length:20},(_,id)=>store.change(s=>s.reports.push({id}))));assert.equal((await store.read()).reports.length,20);}finally{await rm(dir,{recursive:true,force:true});}
});
