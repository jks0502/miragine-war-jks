// One-time migration of npm entries produced by this task before the D-drive requirement.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root} from './environment.mjs';
const require=createRequire(import.meta.url);
const cacache=require('C:/Program Files/nodejs/node_modules/npm/node_modules/cacache');
const oldRoot=path.resolve('C:/Users/27108/AppData/Local/npm-cache');
const source=path.join(oldRoot,'_cacache'),destination=path.join(root,'.cache/npm/_cacache');
function inside(base,p){const r=path.relative(base,path.resolve(p));if(r.startsWith('..')||path.isAbsolute(r))throw new Error('Path outside expected cache');}
inside(oldRoot,source);inside(root,destination);
const lock=JSON.parse(await fs.readFile(path.join(root,'package-lock.json'),'utf8'));
const allowed=new Set();
for(const [key,pkg] of Object.entries(lock.packages)){
  if(!key)continue;
  if(pkg.resolved)allowed.add(pkg.resolved);
  const name=key.slice(key.lastIndexOf('node_modules/')+13);
  allowed.add('https://registry.npmjs.org/'+name);
}
const from=Date.parse('2026-09-20T03:02:50Z'),until=Date.parse('2026-09-20T03:13:00Z');
const entries=await cacache.ls(source);let moved=0,bytes=0;
for(const entry of Object.values(entries)){
  const url=decodeURIComponent(entry.key.replace(/^make-fetch-happen:request-cache:/,''));
  if(entry.time<from||entry.time>until||!allowed.has(url))continue;
  const {data}=await cacache.get(source,entry.key);
  await cacache.put(destination,entry.key,data,{metadata:entry.metadata});
  const copied=await cacache.get(destination,entry.key);
  if(!copied.data.equals(data))throw new Error('Cache copy verification failed');
  await cacache.rm.entry(source,entry.key,{removeFully:true});
  const remaining=await cacache.ls(source);
  if(!Object.values(remaining).some(other=>other.integrity===entry.integrity))await cacache.rm.content(source,entry.integrity);
  moved++;bytes+=data.length;
}
const logDestination=path.join(root,'.cache/npm/_logs');await fs.mkdir(logDestination,{recursive:true});
let logs=0;
for(const name of await fs.readdir(path.join(oldRoot,'_logs'))){
  const p=path.join(oldRoot,'_logs',name);inside(oldRoot,p);
  const contents=await fs.readFile(p,'utf8');
  if(!contents.includes('verbose cwd D:\\milaqi'))continue;
  const dest=path.join(logDestination,name);inside(root,dest);
  await fs.copyFile(p,dest);
  if(await fs.readFile(dest,'utf8')!==contents)throw new Error('Log copy verification failed');
  await fs.unlink(p);logs++;
}
const report={movedEntries:moved,movedBytes:bytes,movedLogs:logs,source,destination};
await fs.writeFile(path.join(root,'artifacts/cache-migration.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
