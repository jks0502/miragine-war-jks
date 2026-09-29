import fs from 'node:fs';
import {Battle} from '../src/engine.js';
import {UNITS,RULES} from '../src/units.js';
const get=id=>UNITS.find(d=>d.id===id);
const cases=[['samurai','swordsman',600],['zombie','swordsman',600],['monk','heavy',600],['monk','vampire',600],['ninja','cavalry',1500],['dread','high',3000],['mage','heavy',1500,true],['strange','high',3000,true],['ninja','mage',1500,true]];
const results=[];
for(const [a,b,budget,screen] of cases){
 const runs=[];
 for(let seed=1;seed<=2;seed++)for(let swap=0;swap<2;swap++){
  const battle=new Battle({mode:'local',seed});
  for(let side=0;side<2;side++){
   const t=battle.teams[side],id=(side^swap)?b:a;
   t.gold=1e6;t.supply=1e6;
   const ids=Array(Math.floor((budget-(screen?get('samurai').cost*10:0))/get(id).cost)).fill(id);
   if(screen)ids.unshift(...Array(10).fill('samurai'));
   ids.forEach((id,i)=>{t.selected=get(id).index;const u=battle.recruit(side);if(!u)throw new Error(`Unable to recruit ${id} in balance case`);u.x=RULES.width/2+(side?1:-1)*(100+Math.floor(i/8)*40+(get(id).range>30?110:0));u.y=95+(i%8)*45;});
   t.auto=false;
  }
  const n0=battle.units.filter(u=>u.side===swap).length,n1=battle.units.filter(u=>u.side!==swap).length;
  const initialSpent=[swap,1-swap].map(side=>battle.teams[side].spent);
  let boundaryReached=false;
  for(let tick=0;tick<2700;tick++){if(battle.units.some(u=>battle.structures().some(s=>s.side!==u.side&&Math.hypot(u.x-s.x,u.y-s.y)<Math.max(RULES.castleRange,UNITS[u.kind].range+100)))){boundaryReached=true;break;}battle.tick();if(!battle.units.some(u=>u.side===0)||!battle.units.some(u=>u.side===1))break;}
  const remaining=[swap,1-swap].map(side=>battle.units.filter(u=>u.side===side).reduce((s,u)=>s+get(UNITS[u.kind].id).cost*u.hp/u.maxHp,0));
  runs.push({seed,swap,initial:[n0,n1],initialSpent,boundaryReached,seconds:+battle.time.toFixed(1),remaining:remaining.map(Math.round)});
 }
 results.push({a,b,budget,commonScreen:screen?'10 samurai each, included in budget':'none',runs});
}
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../artifacts/balance-identities.json',import.meta.url),JSON.stringify(results,null,2));
for(const c of results)console.log(c.a,c.b,c.runs.map(r=>({remaining:r.remaining,boundaryReached:r.boundaryReached})));

