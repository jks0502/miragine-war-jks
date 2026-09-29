import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Battle} from '../src/engine.js';
import {UNITS,RULES} from '../src/units.js';
import {root} from './environment.mjs';

const total=Number(process.argv.find(arg=>/^\d+$/.test(arg))||300);
const dt=.25;
const maxSeconds=900;
const decisionEvery=Math.max(1,Math.round(4/dt));
const failures=[];
const results=[];

for(let seed=1;seed<=total;seed++){
  const battle=new Battle({difficulty:'normal',seed});
  let campEvent=null,lateSpawned=false,invalid=null,maxLiving=[0,0];
  for(let tick=0;tick<maxSeconds/dt&&battle.winner===null;tick++){
    if(tick%decisionEvery===0){battle.chooseAI(0);battle.chooseAI(1);}
    battle.tick(dt);
    const living=[0,1].map(side=>battle.units.filter(u=>u.side===side&&u.hp>0).length);
    maxLiving=maxLiving.map((value,side)=>Math.max(value,living[side]));
    if(living.some(value=>value>RULES.unitCap)) invalid='unit-cap';
    if(!battle.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)&&Number.isFinite(u.hp))) invalid='non-finite-unit';
    if(!battle.teams.every(t=>Number.isFinite(t.gold)&&t.gold>=0&&t.supply>=0&&t.income<=RULES.maxIncome)) invalid='invalid-economy';
    if(battle.units.some(u=>UNITS[u.kind].stage==='后期')) lateSpawned=true;
    const event=battle.events.find(e=>e.type==='camp-destroyed');
    if(event&&!campEvent){
      campEvent={time:+battle.time.toFixed(2),round:battle.round,side:event.side,by:event.by,
        lateAlive:battle.units.some(u=>u.hp>0&&UNITS[u.kind].stage==='后期')};
      break;
    }
  }
  if(invalid) failures.push({seed,type:invalid});
  else if(!campEvent) failures.push({seed,type:battle.winner?'castle-before-camp':'camp-timeout'});
  else if(lateSpawned){
    failures.push({seed,type:'late-before-camp',campEvent});
  }
  results.push({seed,time:+battle.time.toFixed(2),campEvent,lateSpawned,maxLiving,winner:battle.winner});
}

const report={total,dt,maxSeconds,failures,errorRate:failures.length/total,
  campEvents:results.filter(result=>result.campEvent).length,
  lateBeforeCamp:failures.filter(failure=>failure.type==='late-before-camp').length,
  maxLivingBySide:[0,0].map((_,side)=>Math.max(...results.map(result=>result.maxLiving[side]))),
  medianCampSeconds:results.filter(result=>result.campEvent).map(result=>result.campEvent.time).sort((a,b)=>a-b)[Math.floor(results.filter(result=>result.campEvent).length/2)]};
const output=path.join(root,'artifacts','economy-stress.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
assert.ok(report.errorRate<.05,`economy stress error rate ${(report.errorRate*100).toFixed(2)}% exceeds 5%`);
