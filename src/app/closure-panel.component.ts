import {Component, Input, OnChanges, OnDestroy, signal, NgZone, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import type {Building} from './campus-data';
declare global {interface Window {google?: any;}}
type Notice={id:string;buildingId:number;category:string;description:string;status:string;createdAt:string};
@Component({selector:'app-closure-panel',standalone:true,imports:[FormsModule],template:`
<section class="updates-panel" aria-labelledby="updates-heading">
 <div class="updates-title"><div><span class="eyebrow">SPRINT 2 DEMO</span><h2 id="updates-heading">Building updates</h2></div><button class="outline-button" (click)="refresh()">Refresh updates</button></div>
 <p>Practice reports and notices for this student project. These are not official campus alerts. Updates refresh every 10 seconds.</p>
 @if(building) {
 <h3>{{building.name}}</h3>
 @if(loading()){<p>Loading updates…</p>}
 @if(loadError()){<p role="alert">{{loadError()}}</p>}
 @else if(!loading() && closures().length===0){<p>No active demo notices for this building.</p>}
 @for(c of closures();track c.id){<article class="closure-card"><strong>{{c.category}} · Demo notice</strong><p>{{c.description}}</p><small>Posted {{date(c.createdAt)}}</small>@if(adminName()){<button class="outline-button" [disabled]="busy()" (click)="resolve(c.id)">Clear notice</button>}</article>}
 <details><summary>Report an issue at {{building.name}}</summary>
 <form (ngSubmit)="submitReport()">
 <label for="issue-type">Issue type</label><select id="issue-type" name="category" [(ngModel)]="category"><option>Entrance</option><option>Elevator</option><option>Path</option><option>Other</option></select>
 <label for="issue-description">What needs attention?</label><textarea id="issue-description" name="description" [(ngModel)]="description" minlength="10" maxlength="1000" required rows="3" placeholder="Describe the location and issue. Do not include personal information."></textarea>
 <button class="primary-button" [disabled]="busy()">Send report for review</button>
 </form></details>
 }
 <details (toggle)="openAdmin($event)"><summary>Admin review</summary>
 @if(!adminName()) {<p>Sign in with an approved team account to review reports.</p><div id="google-admin-signin"></div>@if(authHint()){<p>{{authHint()}}</p>}}
 @else {<div class="updates-title"><p>Signed in as {{adminName()}}</p><button class="outline-button" (click)="signOut()">Sign out</button></div><h3>Pending reports</h3>
 @for(r of reports();track r.id){<article class="closure-card"><strong>{{buildingName(r.buildingId)}} · {{r.category}}</strong><p>{{r.description}}</p><div class="updates-title"><button class="primary-button" [disabled]="busy()" (click)="publish(r.id)">Publish demo notice</button><button class="outline-button" [disabled]="busy()" (click)="dismiss(r.id)">Dismiss report</button></div></article>}
 @if(reports().length===0){<p>No reports waiting for review.</p>}}
 </details>
 <p role="status" aria-live="polite">{{message()}}</p>
</section>`,styles:[`
:host{display:block;margin:24px 0}.updates-panel{background:white;border:1px solid #dce4d8;border-radius:14px;padding:24px}.updates-panel h2{font-size:24px;margin:6px 0}.updates-panel h3{margin:20px 0 10px}.updates-panel p{line-height:1.6;margin:12px 0}.updates-title{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.closure-card{padding:16px;background:#f3f6ef;border-left:4px solid #255e47;margin:12px 0}.closure-card small{display:block;margin-bottom:10px}details{border-top:1px solid #dce4d8;padding:18px 0}summary{cursor:pointer;font-weight:700}form{display:grid;gap:12px;margin-top:16px}select,textarea{font:inherit;padding:12px;border:1px solid #a8b5a7;border-radius:6px;width:100%;box-sizing:border-box}button:disabled{opacity:.6;cursor:wait}
`]})
export class ClosurePanelComponent implements OnChanges, OnDestroy {
 @Input() building?:Building;
 @Input() buildings:Building[]=[];
 readonly closures=signal<Notice[]>([]);readonly reports=signal<Notice[]>([]);
 readonly loading=signal(false);readonly loadError=signal('');readonly message=signal('');readonly authHint=signal('');readonly adminName=signal('');readonly busy=signal(false);
 category='Entrance';description='';private token='';private generation=0;private timer=setInterval(()=>void this.refresh(),10000);private zone=inject(NgZone);
 ngOnChanges(){this.description='';this.message.set('');void this.refresh();}
 ngOnDestroy(){clearInterval(this.timer);this.generation++;}
 date(value:string){return new Date(value).toLocaleString();}
 buildingName(id:number){return this.buildings.find(b=>b.id===id)?.name||`Building ${id}`;}
 private async api(path:string,method='GET',body?:unknown){
  const response=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',...(this.token?{Authorization:'Bearer '+this.token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok){if(response.status===401||response.status===403)this.signOut();throw Error(data.error||'Request failed.');}return data;
 }
 async refresh(){
  const run=++this.generation;const id=this.building?.id;
  this.loading.set(true);
  try{const notices=id?await this.api(`/buildings/${id}/closures`):[];if(run!==this.generation)return;this.closures.set(notices);this.loadError.set('');
   if(this.token){const reports=await this.api('/reports');if(run===this.generation)this.reports.set(reports.filter((r:Notice)=>r.status==='pending'));}
  }catch(e){if(run===this.generation)this.loadError.set((e as Error).message);}finally{if(run===this.generation)this.loading.set(false);}
 }
 private async action(work:()=>Promise<void>){if(this.busy())return;this.busy.set(true);this.message.set('');try{await work();await this.refresh();}catch(e){this.message.set((e as Error).message);}finally{this.busy.set(false);}}
 submitReport(){const id=this.building?.id;void this.action(async()=>{await this.api('/reports','POST',{buildingId:id,category:this.category,description:this.description});this.description='';this.message.set('Report sent. An admin will review it before it becomes a public demo notice.');});}
 publish(id:string){void this.action(async()=>{await this.api('/closures','POST',{reportId:id});this.message.set('Demo notice published.');});}
 dismiss(id:string){void this.action(async()=>{await this.api('/reports/'+id,'PATCH',{status:'dismissed'});this.message.set('Report dismissed.');});}
 resolve(id:string){void this.action(async()=>{await this.api('/closures/'+id,'PATCH',{status:'resolved'});this.message.set('Demo notice cleared.');});}
 async openAdmin(event:Event){if(!(event.target as HTMLDetailsElement).open||this.adminName())return;await this.renderLogin();}
 private async renderLogin(){
  try{const config=await this.api('/config');if(!config.clientId){this.authHint.set('Admin sign-in needs a Google client ID configured on the server.');return;}
   if(!window.google?.accounts?.id){this.authHint.set('Google sign-in is still loading. Close and reopen Admin review to retry.');return;}
   this.authHint.set('');window.google.accounts.id.initialize({client_id:config.clientId,callback:(response:{credential:string})=>this.zone.run(()=>void this.login(response.credential))});
   window.google.accounts.id.renderButton(document.getElementById('google-admin-signin'),{theme:'outline',size:'large'});
  }catch(e){this.authHint.set((e as Error).message);}
 }
 private async login(credential:string){this.token=credential;try{const user=await this.api('/admin/me');this.adminName.set(user.name);this.message.set('Admin sign-in successful.');await this.refresh();}catch(e){this.token='';this.message.set((e as Error).message);}}
 signOut(){this.token='';this.adminName.set('');this.reports.set([]);window.google?.accounts?.id?.disableAutoSelect();setTimeout(()=>void this.renderLogin(),0);}
}
