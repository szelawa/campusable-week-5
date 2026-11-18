import {createApp} from './app.js';
import {LocalStore,FirestoreStore} from './store.js';
import {fileURLToPath} from 'node:url';
let store;
if(process.env.STORAGE==='firestore') {
 const {Firestore}=await import('@google-cloud/firestore');store=new FirestoreStore(new Firestore());
} else {
 if(process.env.GAE_ENV||process.env.K_SERVICE) throw Error('Set STORAGE=firestore for cloud deployment.');
 store=new LocalStore(fileURLToPath(new URL('../.data/records.json',import.meta.url)));
}
const app=createApp({store,clientId:process.env.GOOGLE_CLIENT_ID,admins:(process.env.ADMIN_EMAILS||'').split(','),staticPath:fileURLToPath(new URL('../dist/',import.meta.url))});
app.listen(Number(process.env.PORT||8082),()=>console.log(`CampusAble: http://localhost:${process.env.PORT||8082}`));
