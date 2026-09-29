import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {root,localEnvironment} from './environment.mjs';
const env=localEnvironment();
const require=createRequire(import.meta.url);
const electron=require('electron');
const child=spawn(electron,[root],{cwd:root,env,stdio:'inherit',windowsHide:true});
child.on('exit',code=>process.exit(code??1));
child.on('error',e=>{console.error(e);process.exit(1);});
