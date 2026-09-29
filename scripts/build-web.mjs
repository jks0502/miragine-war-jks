import fs from 'node:fs';
import path from 'node:path';
import {root,localEnvironment} from './environment.mjs';

localEnvironment();
const out=path.join(root,'dist','web');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','manifest.webmanifest'])fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const directory of ['src','assets'])fs.cpSync(path.join(root,directory),path.join(out,directory),{recursive:true});
fs.copyFileSync(path.join(root,'desktop','icon.png'),path.join(out,'assets','app-icon-64.png'));

const files=[];
function collect(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())collect(full);
    else files.push('/'+path.relative(out,full).replaceAll('\\','/'));
  }
}
collect(out);
files.unshift('/');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const template=fs.readFileSync(path.join(root,'web','service-worker.template.js'),'utf8');
fs.writeFileSync(path.join(out,'sw.js'),template.replace('__VERSION__',version).replace('__PRECACHE__',JSON.stringify(files,null,2)));
console.log(`Web build: ${out} (${files.length} cached assets)`);
