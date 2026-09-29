import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Battle} from '../src/engine.js';
import {root} from './environment.mjs';
const b=new Battle({difficulty:'normal',seed:9});
let peak=0,peakLivingBySide=[0,0];
const start=performance.now();
for(let i=0;i<30000&&b.winner===null;i++){
  // Red uses the same visible-army strategy but only changes every income round.
  if(i%600===0)b.chooseAI(0);
  b.tick();
  const living=[0,1].map(side=>b.units.filter(u=>u.side===side&&u.hp>0).length);
  peak=Math.max(peak,living[0]+living[1]);
  peakLivingBySide=peakLivingBySide.map((value,side)=>Math.max(value,living[side]));
  assert.ok(b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)&&(u.hp>0||u.deadAt!==undefined)));
  assert.ok(b.teams.every(t=>t.gold>=0&&t.supply>=0&&t.income<=1200));
}
assert.notEqual(b.winner,null,'A complete simulated match must reach a natural castle victory');
const report={seconds:b.time,round:b.round,winner:b.winner,peakUnits:peak,peakLivingBySide,
  teams:b.teams.map(({hp,income,spawned,kills})=>({hp,income,spawned,kills})),
  cpuMs:Math.round(performance.now()-start),forcedCastleDamage:false};
fs.writeFileSync(path.join(root,'artifacts/playthrough.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
