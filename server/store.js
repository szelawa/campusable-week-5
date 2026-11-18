import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
const empty = () => ({reports: [], closures: []});
export class LocalStore {
  constructor(path) { this.path = path; this.queue = Promise.resolve(); }
  async read() { try {return JSON.parse(await readFile(this.path, 'utf8'));} catch(e) {if(e.code === 'ENOENT') return empty(); throw e;} }
  async change(fn) {
    const task = this.queue.then(async () => {
      const state = await this.read(); const result = fn(state);
      await mkdir(dirname(this.path), {recursive:true});
      await writeFile(this.path + '.tmp', JSON.stringify(state, null, 2));
      await rename(this.path + '.tmp', this.path); return result;
    });
    this.queue = task.catch(() => {}); return task;
  }
}
export class FirestoreStore {
  constructor(db) {this.ref = db.collection('campusable').doc('sprint2');}
  async read() {return (await this.ref.get()).data() || empty();}
  async change(fn) {
    return this.ref.firestore.runTransaction(async tx => {
      const state = (await tx.get(this.ref)).data() || empty();
      const result = fn(state); tx.set(this.ref, state); return result;
    });
  }
}
