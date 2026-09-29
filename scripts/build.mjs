import fs from 'node:fs';
import path from 'node:path';
import {root,localEnvironment} from './environment.mjs';
localEnvironment();
await import('./icon.mjs');
const {packager}=await import('@electron/packager');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const sideBySide=process.argv.includes('--side-by-side');
const buildName=sideBySide?`MiragineWar-v${version}`:'MiragineWar';
// Preserve portable preferences when replacing the existing executable folder.
const oldData=path.join(root,'dist','MiragineWar-win32-x64','userdata');
const savedData=fs.existsSync(oldData)?fs.mkdtempSync(path.join(root,'.tmp','saved-userdata-')):null;
if(savedData)fs.cpSync(oldData,path.join(savedData,'userdata'),{recursive:true});
const result=await packager({dir:root,out:path.join(root,'dist',sideBySide?`v${version}`:''),name:buildName,
  executableName:'MiragineWar',platform:'win32',arch:'x64',electronVersion:'44.4.3',
  icon:path.join(root,'desktop','icon.ico'),overwrite:true,asar:true,
  appCopyright:'Independent classic gameplay remake. Original game belongs to MIRAGINE.',
  win32metadata:{CompanyName:'Local Game Project',ProductName:'米拉奇战记 · 经典重制',FileDescription:'米拉奇战记经典玩法源码重制'},
  ignore:[/^\/(?:artifacts|tests|scripts|docs|\.cache|\.tmp|userdata|dist)(?:\/|$)/,/^\/\.(?:git|npmrc|gitignore)/],
  tmpdir:path.join(root,'.tmp'),download:{cacheRoot:path.join(root,'.cache','electron')}
});
for(const output of result){
  fs.copyFileSync(path.join(root,'README.md'),path.join(output,'使用说明.md'));
  fs.copyFileSync(path.join(root,'docs','FIDELITY.md'),path.join(output,'还原范围.md'));
  if(savedData)fs.cpSync(path.join(savedData,'userdata'),path.join(output,'userdata'),{recursive:true});
}
console.log('Windows build:',result.join('\n'));
