import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,damageAgainst} from '../src/engine.js';
import {UNITS,UNIT_BY_ID,RULES,MYSTERY_COST,RANGED_TACTICS,FACTIONS} from '../src/units.js';
import {MAPS,MAP_BY_ID,WEATHER_BY_ID,WEATHER_CYCLE_SECONDS,weatherAt} from '../src/maps.js';
import {BattleCamera} from '../src/camera.js';

const unit=id=>UNIT_BY_ID[id];

test('camera prioritizes real combat then follows the local survivors foremost soldier',()=>{
  const camera=new BattleCamera(6000,1280);
  const a={id:1,side:0,x:2200,hp:100},b={id:2,side:1,x:2260,hp:100};
  a.cameraTarget=b;b.cameraTarget=a;
  const battle={time:20,round:2,units:[a,b,{id:3,side:1,x:5000,hp:100,cameraTarget:null},{id:4,side:0,x:700,hp:100,cameraTarget:null}]};
  camera.focus(battle);assert.equal(camera.targetCenter,2230);
  b.hp=0;camera.update(battle,1/60);
  assert.equal(camera.state,'advance');assert.equal(camera.targetCenter,2200);
  a.x=2300;camera.update(battle,1/60);assert.equal(camera.targetCenter,2300);
  b.hp=100;a.cameraTarget=b;camera.update(battle,1/60);assert.equal(camera.state,'combat');
});

test('camera focuses wall attacks with or without defenders and releases a destroyed wall',()=>{
  for(const defenders of [false,true]){
    const camera=new BattleCamera(6000,1280),wall={structure:'camp',side:1,x:3000,hp:100};
    const a={id:1,side:0,x:2900,hp:100,cameraTarget:wall};
    const battle={time:10,round:2,units:[a]};
    if(defenders)battle.units.push({id:2,side:1,x:5000,hp:100,cameraTarget:null});
    camera.focus(battle);assert.equal(camera.state,'combat');assert.equal(camera.targetCenter,2950);
    wall.hp=0;camera.update(battle,1/60);assert.equal(camera.state,'advance');assert.equal(camera.targetCenter,2900);
  }
});

test('first wave follows one side and smooth following is consistent at 30, 60 and 144 Hz',()=>{
  const positions=[];
  for(const hz of [30,60,144]){
    const camera=new BattleCamera(6000,1280);
    const battle={time:0,round:1,units:[{id:1,side:0,x:1500,hp:100,cameraTarget:null},{id:2,side:1,x:4500,hp:100,cameraTarget:null}]};
    camera.focus(battle);assert.equal(camera.targetCenter,1500);
    battle.units[0].x+=200;
    for(let frame=0;frame<hz*2;frame++){
      const before=camera.position;camera.update(battle,1/hz);
      assert.ok(camera.position>=before&&camera.position-before<=560/hz+.001);
    }
    positions.push(camera.position);
    assert.ok(Math.abs(camera.anchor-1700)<=7);
  }
  assert.ok(Math.max(...positions)-Math.min(...positions)<1);
});

test('V1.0 maps provide stable terrain identities and a safe default',()=>{
  assert.deepEqual(MAPS.map(map=>map.id),['grassland','swamp','icefield']);
  assert.equal(MAP_BY_ID.grassland.name,'米拉奇平原');
  assert.equal(new Battle({mapId:'icefield'}).mapId,'icefield');
  assert.equal(new Battle({mapId:'missing-map'}).mapId,'grassland');
});
test('V1.1 weather cycles deterministically per map without changing its identity',()=>{
  const first=weatherAt('grassland',0),second=weatherAt('grassland',WEATHER_CYCLE_SECONDS),later=weatherAt('grassland',WEATHER_CYCLE_SECONDS*2);
  assert.equal(first.id,'clear');
  assert.equal(second.id,'rain');
  assert.equal(later.id,'clear');
  assert.equal(weatherAt('swamp',WEATHER_CYCLE_SECONDS).id,'clear');
  assert.equal(WEATHER_BY_ID[first.id].name,'晴朗');
  assert.equal(weatherAt('missing-map',0).id,'clear');
});

test('camera follows the surviving formation smoothly without a view cut',()=>{
  const camera=new BattleCamera(RULES.width,1280);
  const battle={time:40,units:[
    {id:1,side:0,hp:100,x:1500,lastCombat:40},
    {id:2,side:0,hp:100,x:1660,lastCombat:40},
    {id:3,side:1,hp:100,x:1510,lastCombat:40}
  ]};
  camera.focus(battle);camera.setPosition(0);battle.units[2].hp=0;
  camera.update(battle,1/60);
  assert.equal(camera.state,'advance');
  assert.ok(camera.position>0&&camera.position<940);
  const before=camera.position;
  battle.units[0].x+=60;battle.units[1].x+=60;
  camera.update(battle,1/60);
  assert.ok(camera.position>before&&camera.position-before<=9.34);
});

test('camera keeps the current combat cluster when another fight is active elsewhere',()=>{
  const camera=new BattleCamera(RULES.width,1280);
  camera.setPosition(900);
  const battle={time:40,units:[
    {id:1,side:0,hp:100,x:1500,lastCombat:40,combatTarget:2},
    {id:2,side:1,hp:100,x:1560,lastCombat:40,combatTarget:1},
    {id:3,side:0,hp:100,x:3000,lastCombat:40,combatTarget:4},
    {id:4,side:1,hp:100,x:3060,lastCombat:40,combatTarget:3}
  ]};
  camera.focus(battle);assert.ok(camera.targetCenter>1400&&camera.targetCenter<1650);
  const before=camera.targetCenter;
  battle.time=40.2;battle.units[2].lastCombat=40.2;battle.units[3].lastCombat=40.2;
  camera.update(battle,1/60);
  assert.ok(Math.abs(camera.targetCenter-before)<1,'A distant new fight must not steal the camera immediately');
  battle.time=42.9;battle.units[0].lastCombat=40;battle.units[1].lastCombat=40;battle.units[2].lastCombat=40.5;battle.units[3].lastCombat=40.5;
  camera.update(battle,1/60);
  assert.ok(camera.targetCenter>2950&&camera.targetCenter<3100,'Camera may switch only after the current fight expires');
});

test('camera holds between fights and manual viewing disables automatic movement',()=>{
  const camera=new BattleCamera(RULES.width,1280);
  const battle={time:20,units:[{id:1,side:0,hp:100,x:900},{id:2,side:1,hp:100,x:1300}]};
  camera.focus(battle);
  const held=camera.position;
  battle.units[0].x+=300;battle.units[1].x+=300;
  camera.update(battle,1);
  assert.equal(camera.position,held);
  camera.setFollowing(false);camera.setPosition(250);
  battle.units[0].lastCombat=20;battle.units[1].lastCombat=20;
  camera.update(battle,1);
  assert.equal(camera.position,250);
});

function advance(b,seconds){for(let n=0;n<Math.ceil(seconds/RULES.step);n++)b.tick();}
test('factions attach their own colors and distinct stronghold themes',()=>{
  const b=new Battle({mode:'local',faction0:'blackstone',faction1:'mistsea'});
  assert.deepEqual(b.teams.map(t=>t.faction),['blackstone','mistsea']);
  assert.equal(FACTIONS.find(f=>f.id==='blackstone').baseName,'熔岩锻炉');
  assert.notEqual(FACTIONS.find(f=>f.id==='blackstone').accent,FACTIONS.find(f=>f.id==='mistsea').accent);
  assert.equal(b.teams[0].camp.structure,'camp');assert.equal(b.teams[1].camp.structure,'camp');
});
test('recruitment spends money and supply exactly once and adds living-army income',()=>{
  const b=new Battle({mode:'local',seed:1}),t=b.teams[0];
  const u=b.recruit(0);assert.ok(u);assert.equal(t.gold,380);assert.equal(t.supply,29);assert.equal(t.income,204);
  t.gold=19;assert.equal(b.recruit(0),false);assert.equal(t.supply,29);
  t.gold=400;t.supply=0;assert.equal(b.recruit(0),false);
  t.supply=RULES.roundSupply;t.auto=false;assert.equal(b.recruit(0),false);
  assert.ok(b.recruit(0,{manual:true}),'Manual recruitment should work while automatic spawning is paused');
});
test('20-second settlement credits income and refills rather than accumulates supply',()=>{
  const b=new Battle({mode:'local'});for(const t of b.teams)t.auto=false;
  b.teams[0].supply=7;advance(b,19);assert.equal(b.round,1);assert.equal(b.teams[0].gold,400);
  advance(b,1.1);assert.equal(b.round,2);assert.equal(b.teams[0].baseIncome,250);
  assert.equal(b.teams[0].gold,650);assert.equal(b.teams[0].supply,RULES.roundSupply);
});
test('the first wave waits eight seconds before either side can spawn',()=>{
  const b=new Battle({mode:'local',seed:2});
  for(const t of b.teams){t.selected=unit('newbie').index;t.auto=true;}
  advance(b,7.9);assert.equal(b.units.length,0);
  advance(b,.2);assert.ok(b.units.length>0);
});
test('only living troops add income while castle income guarantees recovery',()=>{
  const b=new Battle({mode:'local'}),t=b.teams[0],u=b.recruit(0);
  assert.equal(t.baseIncome,200);assert.equal(t.armyIncome,4);assert.equal(t.income,204);
  u.hp=0;t.auto=false;b.teams[1].auto=false;b.tick();
  assert.equal(t.baseIncome,200);assert.equal(t.armyIncome,0);assert.equal(t.income,200);
  assert.equal(t.supply,29);advance(b,RULES.corpseSeconds+.1);assert.equal(b.units.length,0);
});
test('living-army income is capped at half of castle income and total income at 4000',()=>{
  const b=new Battle({mode:'local'}),t=b.teams[0];t.baseIncome=RULES.baseIncomeCap;t.gold=1e6;t.supply=1e6;t.selected=unit('high').index;
  for(let i=0;i<RULES.unitCap;i++)assert.ok(b.recruit(0));
  assert.equal(t.armyIncome,30*unit('high').supply*RULES.incomePerSupply);assert.equal(t.income,RULES.maxIncome);
  assert.equal(b.availableSupply(0),0,'Available supply must include the living-unit cap');
  assert.equal(b.recruit(0),false,'A full field must report no available recruitment supply');
});
test('recruitment uses one visible supply value for both wave budget and field population',()=>{
  const b=new Battle({mode:'local'}),t=b.teams[0];
  t.selected=unit('newbie').index;t.gold=10000;t.supply=RULES.roundSupply;
  for(let i=0;i<RULES.unitCap-1;i++)assert.ok(b.recruit(0));
  assert.equal(b.availableSupply(0),1);
  assert.ok(b.recruit(0),'Recruitment must continue while displayed supply and gold cover the selected unit');
  assert.equal(b.availableSupply(0),0);
  assert.equal(b.recruit(0),false);
});
test('late-game income can buy several elite units but supply limits each wave',()=>{
  for(const id of ['strange','dread','high']){
    const d=unit(id);
    assert.ok(RULES.startGold+RULES.maxIncome*2>=d.cost,`${d.name} should remain affordable after saving for two income cycles`);
    assert.ok(Math.floor(RULES.roundSupply/d.supply)<=5,`${d.name} should be limited to at most five per wave by supply`);
  }
});
test('the economy reaches a readable 20-to-30 soldier peak without exceeding the cap',()=>{
  const b=new Battle({difficulty:'normal',seed:21}),peak=[0,0];
  for(let i=0;i<5400&&b.winner===null;i++){
    b.tick();
    for(let side=0;side<2;side++)peak[side]=Math.max(peak[side],b.units.filter(u=>u.side===side&&u.hp>0).length);
  }
  assert.ok(peak.every(value=>value>=20&&value<=RULES.unitCap),`unexpected three-minute peaks: ${peak.join(', ')}`);
});
test('dead soldiers remain as fallen bodies for two seconds then disappear',()=>{
  const b=tacticalBattle(),u=soldier(b,0,'zombie',900);u.hp=0;const x=u.x,y=u.y;
  b.tick();assert.equal(b.units.length,1);assert.equal(b.units[0].deadAt!==undefined,true);assert.equal(b.units[0].x,x);assert.equal(b.units[0].y,y);
  advance(b,1.7);assert.equal(b.units.length,1);advance(b,.4);assert.equal(b.units.length,0);
});
test('armor counters change matchup damage, not just price',()=>{
  assert.ok(damageAgainst(unit('swordsman'),unit('newbie'))>damageAgainst(unit('swordsman'),unit('zombie')));
  assert.ok(damageAgainst(unit('ninja'),unit('newbie'))>damageAgainst(unit('ninja'),unit('zombie')));
  assert.ok(damageAgainst(unit('newbie'),unit('high'))>=1);
});
test('pause freezes economy, movement and combat',()=>{
  const b=new Battle({seed:7});advance(b,1);b.paused=true;
  const snapshot=JSON.stringify([b.time,b.units,b.teams,b.remaining]);advance(b,20);
  assert.equal(JSON.stringify([b.time,b.units,b.teams,b.remaining]),snapshot);
});
test('units reach contact and both sides take casualties in a real simulation',()=>{
  const b=new Battle({mode:'local',seed:123});b.teams[0].selected=3;b.teams[1].selected=0;
  advance(b,100);assert.ok(b.teams[0].kills>0);assert.ok(b.teams[1].kills>0);
  assert.ok(b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));
  assert.ok(b.units.some(u=>u.side===0&&u.hp>0));assert.ok(b.units.some(u=>u.side===1&&u.hp>0));
});
test('destroying a castle ends the match and prevents later state changes',()=>{
  const b=new Battle({mode:'local',seed:1});
  const u=b.recruit(0);u.x=b.teams[1].x-35;u.y=b.teams[1].y;u.cooldown=0;
  b.teams[1].hp=1;b.teams[1].shot=10;
  for(const t of b.teams)t.auto=false;
  b.tick();assert.equal(b.winner,0);
  const time=b.time;b.tick();assert.equal(b.time,time);assert.equal(b.recruit(0),false);
});
test('equal seed and input produce identical results',()=>{
  const a=new Battle({seed:101}),b=new Battle({seed:101});advance(a,25);advance(b,25);
  assert.deepEqual(a.units,b.units);assert.deepEqual(a.teams,b.teams);
});
test('all units can spawn and execute combat without invalid state',()=>{
  const b=new Battle({mode:'local',seed:3});
  for(const t of b.teams){t.gold=100000;t.supply=500;}
  for(let i=0;i<UNITS.length;i++)for(let side=0;side<2;side++){
    b.select(side,i);const u=b.recruit(side);assert.ok(u);u.x=side?1450:1350;u.y=100+i*20;
  }
  for(const t of b.teams)t.auto=false;
  advance(b,15);assert.ok(b.teams.some(t=>t.kills>0));assert.ok(b.units.every(u=>Number.isFinite(u.hp)));
});
test('AI never needs hidden player selection or extra resources',()=>{
  const a=new Battle({seed:5}),b=new Battle({seed:5});a.select(0,0);b.select(0,15);
  a.chooseAI();b.chooseAI();assert.equal(a.teams[1].selected,b.teams[1].selected);
  assert.equal(a.teams[1].gold,b.teams[1].gold);
});

function tacticalBattle(){
  const b=new Battle({mode:'local',seed:21});
  for(const t of b.teams){t.auto=false;t.shot=Infinity;}
  return b;
}
function soldier(b,side,id,x,y=250){
  const t=b.teams[side],def=unit(id);t.gold=10000;t.supply=60;t.selected=def.index;t.auto=true;
  const u=b.recruit(side);t.auto=false;Object.assign(u,{x,y,cooldown:0});return u;
}
test('walls block both armies at every lane, take siege damage, and open on destruction',()=>{
  for(const side of [0,1])for(const y of [70,250,450]){
    const b=tacticalBattle(),wall=b.teams[1-side].camp,dir=side? -1:1;
    wall.shot=Infinity;wall.hp=wall.maxHp=100000;
    const u=soldier(b,side,'high',wall.x-dir*65,y);
    advance(b,2);
    assert.ok((wall.x-u.x)*dir>=51);
    assert.ok(wall.hp<wall.maxHp,'Attackers can strike any part of the wall');
    wall.hp=0;advance(b,2);
    assert.ok((u.x-wall.x)*dir>0,'The fallen wall opens the route');
  }
});
test('forward reinforcements emerge from their own gate',()=>{
  const b=new Battle({mode:'local'});
  for(const side of [0,1]){
    const u=b.recruit(side),wall=b.teams[side].camp;
    assert.equal(Math.abs(u.x-wall.x),38);assert.ok(Math.abs(u.y-wall.y)<=20);
  }
});
for(const side of [0,1])for(const id of ['samurai','mage','strange']){
  const x=value=>side?RULES.width-value:value;
  test(`ranged ${id}, side ${side}: closes distance and attacks while heavy can catch it`,()=>{
    const b=tacticalBattle(),ranged=soldier(b,side,id,x(900));
    const enemy=soldier(b,1-side,'heavy',x(1240));
    enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
    const shots=[];let previousCombat=ranged.lastCombat;
    for(let i=0;i<300;i++){
      b.tick();
      if(ranged.lastCombat!==previousCombat){shots.push(b.time);previousCombat=ranged.lastCombat;}
      assert.equal(ranged.heading,side?-1:1,'Ranged unit must keep facing its target');
    }
    const reach=unit(id).range+19+15;
    const distance=Math.hypot(ranged.x-enemy.x,(ranged.y-enemy.y)*1.25);
    assert.ok(shots.length>=4,`${id} should land repeated attacks`);
    for(let i=1;i<shots.length;i++)assert.ok(shots[i]-shots[i-1]<=unit(id).interval+RULES.step*2,'No attack interval should be skipped');
    assert.ok(distance<=reach+6,'Ranged unit should stay close enough to keep attacking');
  });
}
test('ranged units kite a close enemy without interrupting their attacks',()=>{
  for(const id of ['samurai','mage','strange']){
    const b=tacticalBattle(),ranged=soldier(b,0,id,900),enemy=soldier(b,1,'heavy',940);
    enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
    const startDistance=enemy.x-ranged.x;let shots=0,previousCombat=ranged.lastCombat;
    for(let i=0;i<150;i++){
      b.tick();
      if(ranged.lastCombat!==previousCombat){shots++;previousCombat=ranged.lastCombat;}
      assert.equal(ranged.heading,1);
    }
    const distance=Math.hypot(ranged.x-enemy.x,(ranged.y-enemy.y)*1.25);
    assert.ok(distance>startDistance+20,`${id} should create distance from a close enemy`);
    assert.ok(shots>=3,`${id} should keep attacking while kiting`);
  }
});
test('ranged units counterattack from the wall without waiting for melee support',()=>{
  const b=tacticalBattle(),wall=b.teams[0].camp;
  const ranged=soldier(b,0,'mage',wall.x-40),enemy=soldier(b,1,'heavy',wall.x+105);
  for(const t of b.teams){t.camp.shot=Infinity;t.shot=Infinity;}
  enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
  const hp=enemy.hp;advance(b,.1);
  assert.equal(ranged.tactic,'wall-fire');
  assert.ok(ranged.lastCombat!==undefined,'The ranged unit should fire as soon as it reaches the wall');
  assert.ok(enemy.hp<hp,'The wall defense must damage the pushing enemy immediately');
});
test('ranged units siege the enemy wall after the battlefield is cleared',()=>{
  const b=tacticalBattle(),wall=b.teams[1].camp;
  const ranged=soldier(b,0,'mage',wall.x-180);
  ranged.x=wall.x-180;
  for(const t of b.teams){t.camp.shot=Infinity;t.shot=Infinity;}
  const hp=wall.hp;
  advance(b,2);
  assert.equal(ranged.tactic,'siege');
  assert.ok(wall.hp<hp,'A ranged unit must keep attacking the structure without a melee screen');
});
test('ninjas prioritize archers and blink into melee range',()=>{
  assert.equal(unit('ninja').cost,100);
  const b=tacticalBattle(),ninja=soldier(b,0,'ninja',1800),archer=soldier(b,1,'samurai',2100);
  advance(b,.1);
  assert.ok(ninja.blinkCooldown>4,'Ninja should spend its blink cooldown when an archer is in range');
  assert.ok(Math.abs(ninja.x-(archer.x-38))<8,'Ninja should appear just behind the archer line');
  assert.ok(b.effects.some(e=>e.type==='ninja-blink'),'Blink should create a visible effect');
  const x=ninja.x;advance(b,.4);assert.ok(Math.abs(ninja.x-x)<20,'Blink cooldown should prevent repeated teleporting');
});
test('small target movement inside the firing band does not cause ranged direction flicker',()=>{
  const b=tacticalBattle(),ranged=soldier(b,0,'mage',900),enemy=soldier(b,1,'heavy',1080);
  enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
  let shots=0,previousCombat=ranged.lastCombat;
  for(let i=0;i<240;i++){
    enemy.x=1080+(i%2?3:-3);enemy.y=250+(i%3-1)*2;
    b.tick();
    if(ranged.lastCombat!==previousCombat){shots++;previousCombat=ranged.lastCombat;}
    assert.equal(ranged.heading,1);
    assert.equal(ranged.tactic,'fire');
  }
  assert.ok(shots>=5,'Target jitter must not suppress repeated attacks');
});
for(const side of [0,1])for(const id of ['samurai','mage','strange']){
  const x=value=>side?RULES.width-value:value,dir=side?-1:1;
  test(`ranged ${id}, side ${side}: never overtakes its slower melee line`,()=>{
    const b=tacticalBattle(),ranged=soldier(b,side,id,x(4000)),melee=soldier(b,side,'zombie',x(4090));
    const wall=b.teams[1-side].camp;wall.hp=wall.maxHp=100000;wall.shot=Infinity;
    for(let i=0;i<300;i++){
      b.tick();
      const rearGap=(melee.x-ranged.x)*dir;
      assert.ok(rearGap>=RANGED_TACTICS.frontlineGap-7,`${id} moved ahead of its melee line by ${-rearGap}`);
    }
  });
}
test('a ranged unit attacks the enemy wall after the melee line is gone',()=>{
  const b=tacticalBattle(),melee=soldier(b,0,'zombie',4300),ranged=soldier(b,0,'mage',4400);
  const wall=b.teams[1].camp;wall.hp=wall.maxHp=100000;wall.shot=Infinity;
  const x=ranged.x,hp=wall.hp;b.tick();
  assert.equal(ranged.tactic,'siege');
  assert.ok(ranged.x<=x,'Ranged unit should close toward the enemy structure');
  assert.ok(wall.hp<hp,'Siege mode must keep firing while no enemy soldiers remain');
});
test('AI replenishes a missing melee screen rather than recruiting unsupported ranged units',()=>{
  const b=new Battle({difficulty:'abyss',seed:8});soldier(b,1,'mage',1000);
  b.teams[1].gold=10000;b.chooseAI(1);assert.ok(UNITS[b.teams[1].selected].range<=30);
});
test('AI gives a direct counter priority when a counter is affordable',()=>{
  const b=new Battle({difficulty:'abyss',seed:8});
  soldier(b,0,'heavy',2600);soldier(b,1,'swordsman',3400);b.teams[1].gold=10000;b.teams[1].supply=RULES.roundSupply;
  b.chooseAI(1);assert.ok(['mage','samurai','strange'].includes(UNITS[b.teams[1].selected].id));
  b.units=[];soldier(b,0,'samurai',2600);soldier(b,1,'swordsman',3400);b.teams[1].gold=10000;b.teams[1].supply=RULES.roundSupply;
  b.chooseAI(1);assert.ok(['ninja','cavalry'].includes(UNITS[b.teams[1].selected].id));
});
test('AI reserves late heroes until the enemy wall is down',()=>{
  const b=new Battle({difficulty:'abyss',seed:4});
  b.teams[1].gold=10000;b.teams[1].supply=RULES.roundSupply;b.chooseAI(1);
  assert.notEqual(UNITS[b.teams[1].selected].stage,'后期');
});




test('castles and forward camps have distinct objectives and starting positions',()=>{
  const b=new Battle({mode:'local',seed:9});
  assert.equal(b.teams[0].structure,'castle');
  assert.equal(b.teams[0].hp,RULES.castleHP);
  assert.equal(b.teams[0].armor,RULES.castleArmor);
  assert.equal(b.teams[0].camp.hp,RULES.campHP);
  assert.ok(Math.abs(b.teams[0].camp.x-(105+(RULES.width-210)*.25))<1);
  assert.ok(Math.abs(b.teams[1].camp.x-(RULES.width-105-(RULES.width-210)*.25))<1);
  assert.ok(RULES.castleDamage>RULES.campDamage);
  assert.ok(RULES.castleArmor>RULES.campArmor);
});
test('militia rename, late ranged unit, and fixed-price mystery unit are exposed',()=>{
  assert.equal(unit('newbie').name,'民兵');
  assert.equal(unit('newbie').hp,65);
  assert.equal(damageAgainst(unit('newbie'),unit('zombie')),8);
  assert.equal(unit('newbie').supply,1);
  assert.equal(unit('samurai').name,'弓箭手');
  assert.equal(unit('samurai').combatClass,'远程');
  assert.equal(unit('samurai').range,135);
  assert.equal(unit('samurai').cost,100);
  assert.equal(unit('samurai').supply,3);
  assert.equal(unit('samurai').hp,70);
  assert.equal(unit('samurai').lightDamage,18);
  assert.equal(unit('samurai').heavyDamage,34);
  assert.equal(unit('samurai').interval,1.9);
  assert.equal(unit('samurai').speed,1.4);
  assert.equal(unit('strange').stage,'后期');
  assert.equal(unit('strange').hp,360);
  assert.ok(unit('strange').range>unit('mage').range);
  assert.ok(unit('strange').range>30);
  assert.equal(unit('strange').heavyDamage,260);
  assert.ok(unit('strange').interval<2);
  assert.equal(MYSTERY_COST,1000);
  assert.equal(unit('mystery').cost,MYSTERY_COST);
  assert.equal(unit('ninja').cost,100);
  for(const id of ['ninja','heavy','monk']) assert.equal(unit(id).stage,'中前期');
  for(const id of ['vampire','cavalry','mage']) assert.equal(unit(id).stage,'中后期');
  assert.equal(unit('mystery').stage,'特殊');
  assert.deepEqual(['ninja','heavy','monk'].map(id=>[unit(id).cost,unit(id).supply]),[[100,2],[450,5],[400,4]]);
  assert.deepEqual(['vampire','cavalry','mage'].map(id=>[unit(id).cost,unit(id).supply]),[[600,5],[650,6],[800,6]]);
});
test('Mage cycles three distinct spell presentations at its unchanged damage and cadence',()=>{
  const def=unit('mage');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [800,6,150,0,22,55,1.8,1.45,170]);
  for(const side of [0,1]){
    const x=value=>side?RULES.width-value:value,b=tacticalBattle(),mage=soldier(b,side,'mage',x(900)),target=soldier(b,1-side,'heavy',x(1080));
    target.hp=target.maxHp=100000;target.cooldown=Infinity;
    const variants=[],damages=[],times=[];
    for(let attack=0;attack<3;attack++){
      const hpBefore=target.hp;
      for(let i=0;i<150&&(mage.mageStrikeCount||0)<=attack;i++)b.tick();
      assert.equal(mage.mageStrikeCount,attack+1,'Mage should keep firing without skipping an attack');
      const effect=b.effects.filter(e=>e.type==='frost').at(-1);assert.ok(effect);
      variants.push(effect.variant);damages.push(hpBefore-target.hp);times.push(mage.lastCombat);
    }
    assert.deepEqual(variants,[0,1,2]);
    assert.deepEqual(damages,[49,49,49],'Spell visuals must not change the single-hit damage');
    for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-def.interval)<=RULES.step*2,'Spell selection must preserve attack cadence');
  }
});
test('Doctor Strange keeps four faction-ready attacks at unchanged stats, damage, and cadence',()=>{
  const def=unit('strange');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [1500,6,360,1,52,260,1.9,1.5,240]);
  for(const side of [0,1]){
    const x=value=>side?RULES.width-value:value,b=tacticalBattle(),strange=soldier(b,side,'strange',x(800)),guard=soldier(b,side,'heavy',x(500)),enemy=soldier(b,1-side,'heavy',x(1000));
    enemy.hp=enemy.maxHp=100000;guard.hp=0;enemy.cooldown=Infinity;
    const styles=new Set(),damages=[],durations=[],times=[];
    for(const expected of [0,1,2,3]){
      b.random=()=>((expected+.1)/4);b.effects=[];const hpBefore=enemy.hp;
      for(let i=0;i<90&&!b.effects.some(e=>e.type==='strange');i++)b.tick();
      const effect=b.effects.find(e=>e.type==='strange');assert.ok(effect);styles.add(effect.variant);
      assert.equal(strange.attackVariant,effect.variant);damages.push(hpBefore-enemy.hp);durations.push(effect.max);times.push(strange.lastCombat);
    }
    assert.deepEqual([...styles].sort((a,z)=>a-z),[0,1,2,3]);
    assert.deepEqual(damages,[254,254,254,254],'All spell presentations keep the original single-hit damage');
    for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-def.interval)<=RULES.step*2,'Spell selection must preserve the attack cadence');
    assert.ok(durations[3]>durations[0],'The signature attack gets a longer visual wind-up and aftermath');
  }
});
test('Crimson Arbiter cycles three faction-ready saber strikes at unchanged damage and cadence',()=>{
  const def=unit('dread');
  assert.deepEqual([def.name,def.en],['猩红裁决者','Crimson Arbiter']);
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [1500,6,860,5,80,40,1.3,2.05,18]);
  for(const side of [0,1]){
    const x=value=>side?RULES.width-value:value,b=tacticalBattle(),dread=soldier(b,side,'dread',x(900)),enemy=soldier(b,1-side,'heavy',x(1100));
    enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
    const styles=[],damages=[],durations=[],times=[];
    for(const expected of [0,1,2]){
      b.random=()=>((expected+.1)/3);b.effects=[];const hpBefore=enemy.hp;
      for(let i=0;i<180&&!b.effects.some(e=>e.type==='sweep'&&e.side===side);i++)b.tick();
      const effect=b.effects.find(e=>e.type==='sweep'&&e.side===side);assert.ok(effect,'Crimson Arbiter should deliver each selected saber strike');
      styles.push(effect.variant);assert.equal(dread.attackVariant,effect.variant);
      damages.push(hpBefore-enemy.hp);durations.push(effect.max);times.push(dread.lastCombat);
    }
    assert.deepEqual(styles,[0,1,2]);
    assert.deepEqual(damages,[34,34,34],'Alternate strike visuals must preserve the armored-target hit');
    for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-def.interval)<=RULES.step*2,'Saber presentation must not change attack cadence');
    assert.ok(durations[2]>durations[0],'Crimson Eclipse receives its deliberate wind-up and aftermath');
  }
});
test('archer randomly selects one of three equal-damage attack styles',()=>{
  const b=tacticalBattle(),archer=soldier(b,0,'samurai',800),guard=soldier(b,0,'heavy',950),enemy=soldier(b,1,'heavy',1000);
  enemy.hp=enemy.maxHp=100000;guard.hp=guard.maxHp=100000;
  const styles=new Set();
  for(const expected of [0,1,2]){
    b.random=()=>((expected+.1)/3);archer.cooldown=0;b.effects=[];
    for(let i=0;i<90&&!b.effects.some(e=>e.type==='arrow');i++)b.tick();
    const effect=b.effects.find(e=>e.type==='arrow');assert.ok(effect);styles.add(effect.variant);
  }
  assert.deepEqual([...styles].sort((a,z)=>a-z),[0,1,2]);
});
test('swordsman cycles through three visual attacks without changing its combat stats',()=>{
  const def=unit('swordsman');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [40,2,160,3,16,9,1.4,2,18]);
  const b=tacticalBattle(),swordsman=soldier(b,0,'swordsman',800),guard=soldier(b,0,'heavy',950),enemy=soldier(b,1,'heavy',1000);
  enemy.hp=enemy.maxHp=100000;guard.hp=guard.maxHp=100000;
  const styles=[];
  for(let attack=0;attack<3;attack++){
    swordsman.cooldown=0;b.effects=[];
    for(let i=0;i<120&&!b.effects.some(e=>e.type==='sword-guard');i++)b.tick();
    const effect=b.effects.find(e=>e.type==='sword-guard');assert.ok(effect,'Sword Man should produce a visible strike effect');
    styles.push(effect.variant);
  }
  assert.deepEqual(styles,[0,1,2]);
});
test('heavy spearman cycles through three visual attacks without changing its combat stats',()=>{
  const def=unit('heavy');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [450,5,400,6,25,12,1.6,1.65,18]);
  const b=tacticalBattle(),spearman=soldier(b,0,'heavy',800),guard=soldier(b,0,'swordsman',950),enemy=soldier(b,1,'heavy',1000);
  enemy.hp=enemy.maxHp=100000;guard.hp=guard.maxHp=100000;
  const styles=[];
  for(let attack=0;attack<3;attack++){
    spearman.spearStrikeCount=attack;spearman.cooldown=0;b.effects=[];
    for(let i=0;i<120&&!b.effects.some(e=>e.type==='spear-guard'&&e.side===0);i++)b.tick();
    const effect=b.effects.find(e=>e.type==='spear-guard'&&e.side===0);assert.ok(effect,'Heavy Spearman should produce a visible strike effect');
    styles.push(effect.variant);
  }
  assert.deepEqual(styles,[0,1,2]);
});
test('monk cycles through three visual staff techniques without changing its combat stats',()=>{
  const def=unit('monk');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [400,4,320,3,26,7,1.2,3,18]);
  const b=tacticalBattle(),monk=soldier(b,0,'monk',800),guard=soldier(b,0,'swordsman',950),enemy=soldier(b,1,'heavy',1000);
  enemy.hp=enemy.maxHp=100000;guard.hp=guard.maxHp=100000;
  const styles=[];
  for(let attack=0;attack<3;attack++){
    monk.monkStrikeCount=attack;monk.cooldown=0;b.effects=[];
    for(let i=0;i<120&&!b.effects.some(e=>e.type==='monk-strike'&&e.side===0);i++)b.tick();
    const effect=b.effects.find(e=>e.type==='monk-strike'&&e.side===0);assert.ok(effect,'Monk should produce a visible staff technique');
    assert.equal(monk.attackVariant,effect.variant);
    styles.push(effect.variant);
  }
  assert.deepEqual(styles,[0,1,2]);
});
test('vampire drains blood through three claw techniques without changing its combat stats',()=>{
  const def=unit('vampire');
  assert.deepEqual([def.cost,def.supply,def.hp,def.armor,def.lightDamage,def.heavyDamage,def.interval,def.speed,def.range],
    [600,5,280,2,36,14,1.1,1.8,18]);
  const b=tacticalBattle(),vampire=soldier(b,0,'vampire',800),guard=soldier(b,0,'swordsman',950),enemy=soldier(b,1,'heavy',1000);
  enemy.hp=enemy.maxHp=100000;guard.hp=guard.maxHp=100000;
  const styles=[];
  for(let attack=0;attack<3;attack++){
    vampire.vampireStrikeCount=attack;vampire.cooldown=0;b.effects=[];
    for(let i=0;i<120&&!b.effects.some(e=>e.type==='drain'&&e.side===0);i++)b.tick();
    const effect=b.effects.find(e=>e.type==='drain'&&e.side===0);assert.ok(effect,'Vampire should produce a visible blood technique');
    assert.equal(vampire.attackVariant,effect.variant);
    styles.push(effect.variant);
  }
  assert.deepEqual(styles,[0,1,2]);
});
test('mystery recruitment charges its own contract and rolls a concrete unit',()=>{
  const b=new Battle({mode:'local',seed:17}),t=b.teams[0];
  t.selected=unit('mystery').index;t.gold=1000;t.supply=RULES.roundSupply;t.auto=true;
  const u=b.recruit(0);
  assert.ok(u);
  assert.equal(u.randomized,true);
  assert.equal(u.selectedKind,'mystery');
  assert.notEqual(UNITS[u.kind].id,'mystery');
  assert.equal(t.gold,1000-MYSTERY_COST);
  assert.equal(t.supply,RULES.roundSupply-unit('mystery').supply);
  assert.equal(t.income,RULES.startIncome+unit('mystery').income);
});
test('area artillery skill bombards the engagement area without damaging structures',()=>{
  const b=tacticalBattle();
  const guard=soldier(b,0,'heavy',2580,250);guard.hp=guard.maxHp=10000;
  const early=soldier(b,1,'newbie',2700,250);
  const middle=soldier(b,1,'ninja',2720,275);
  const middleLate=soldier(b,1,'mage',2740,290);
  const late=soldier(b,1,'high',2760,230);
  const castleHp=b.teams[1].hp,campHp=b.teams[1].camp.hp;
  b.tick();
  b.teams[0].gold=2000;
  assert.equal(b.bombard(0),true,'The button should queue a skill strike when combat is active');
  assert.equal(b.teams[0].gold,2000-RULES.bombardCost);
  for(const u of b.units){u.cooldown=Infinity;u.moving=false;}
  advance(b,1.05);
  assert.ok(early.hp>0&&early.hp<early.maxHp,'The first wave should remove only one fifth of the total damage');
  const middleAfterFirst=middle.hp;advance(b,1.05);
  assert.ok(middle.hp<middleAfterFirst,'The second wave should be a separate damage event');
  advance(b,3.1);
  assert.equal(early.hp,0,'A full-health early unit should be killed by the shell');
  assert.ok(middle.hp>0&&middle.hp<middle.maxHp*.25,'A mid-early unit should be left at low health');
  assert.ok(middleLate.hp>0&&middleLate.hp<middleLate.maxHp*.25,'A mid-late unit should be left at low health');
  assert.ok(late.hp<late.maxHp&&late.hp>late.maxHp*.7,'A late-stage unit should be pressured without being deleted');
  assert.ok(guard.hp<guard.maxHp&&guard.hp>guard.maxHp*.8,'Units in the blast radius take limited friendly fire');
  assert.equal(b.teams[1].hp,castleHp,'The skill must never damage a castle');
  assert.equal(b.teams[1].camp.hp,campHp,'The skill must never damage a forward camp');
  assert.equal(b.teams[0].bombardCooldown>74,true,'The cooldown is independent of recruitment rounds');
  assert.equal(b.bombard(0),false,'A second strike is blocked during cooldown');
  const bombard=b.effects.find(e=>e.type==='bombard');
  assert.ok(bombard&&bombard.max>=5);
  assert.ok(bombard.missiles>=20&&bombard.flight>=1.5&&bombard.stagger<.3,'The visual barrage should be dense and visibly accelerating');
});
test('area artillery uses a fixed full-height and wide horizontal strip',()=>{
  const b=tacticalBattle();
  const top=soldier(b,0,'heavy',2800,70),bottom=soldier(b,1,'heavy',3000,430),outside=soldier(b,1,'heavy',3900,250);
  for(const u of [top,bottom,outside]){u.cooldown=Infinity;u.hp=u.maxHp=10000;}
  b.tick();
  b.teams[0].gold=RULES.bombardCost;
  assert.equal(b.bombard(0),true);
  const before=[top.hp,bottom.hp,outside.hp];advance(b,1.05);
  assert.ok(top.hp<before[0]&&bottom.hp<before[1],'The fixed strip must reach both battlefield edges');
  assert.equal(outside.hp,before[2],'Units beyond the fixed horizontal width stay safe');
  assert.equal(b.teams[0].hp,RULES.castleHP);assert.equal(b.teams[1].camp.hp,RULES.campHP);
});
test('nuclear launches escalate in price and each side has exactly three charges',()=>{
  const b=tacticalBattle(),t=b.teams[0];
  assert.deepEqual(RULES.nukeCosts,[500,18888,28888]);
  for(let i=0;i<RULES.nukeMaxUses;i++){
    t.gold=RULES.nukeCosts[i];
    assert.equal(b.launchNuke(0),true);
    assert.equal(t.gold,0);
    assert.equal(t.nukesUsed,i+1);
  }
  t.gold=100000;
  assert.equal(b.launchNuke(0),false,'The fourth launch must be unavailable even with ample gold');
  assert.equal(b.teams[1].nukesUsed,0,'Charges are tracked separately for each side');
});
test('nuclear impact kills every field unit, spares structures, and leaves five-round light pollution',()=>{
  const b=tacticalBattle(),ally=soldier(b,0,'newbie',2990),enemy=soldier(b,1,'heavy',3020);
  for(const u of [ally,enemy]){u.hp=u.maxHp=1000;u.cooldown=Infinity;u.moving=false;}
  const structures=b.teams.map(t=>[t.hp,t.camp.hp]);
  b.teams[0].gold=500;
  assert.equal(b.launchNuke(0),true);
  assert.ok(ally.hp>0&&enemy.hp>0,'The five-second flight gives a clear warning before impact');
  assert.equal(b.pendingNukes.length,1);
  for(let i=0;i<Math.ceil(RULES.nukeFlight/RULES.step)+2&&!b.contaminatedZones.length;i++)b.tick();
  assert.equal(ally.hp,0);assert.equal(enemy.hp,0);
  assert.deepEqual(b.teams.map(t=>[t.hp,t.camp.hp]),structures,'The nuke only damages battlefield units');
  assert.equal(b.contaminatedZones.length,1);
  const zone=b.contaminatedZones[0];assert.equal(zone.expiresAtRound,b.round+RULES.nukePollutionRounds);
  assert.ok(b.events.some(event=>event.type==='nuke-detonated'));
  assert.ok(b.effects.some(effect=>effect.type==='nuke-explosion'));

  const t=b.teams[0];t.auto=false;t.gold=500;t.supply=RULES.roundSupply;t.selected=unit('newbie').index;
  const survivor=b.recruit(0,{manual:true});Object.assign(survivor,{x:zone.x,y:zone.y,cooldown:Infinity,moving:false});
  const before=survivor.hp;advance(b,1);
  assert.ok(survivor.polluted&&survivor.hp<before&&survivor.hp>before-1,'A unit in the zone takes slow, visible attrition');
  b.round=zone.expiresAtRound-1;b.remaining=.001;b.tick();
  assert.equal(b.contaminatedZones.length,0,'The contamination clears after five round boundaries');
});
test('forward walls automatically fire three full-height arrow volleys under pressure',()=>{
  const b=tacticalBattle(),wall=b.teams[0].camp;
  wall.shot=Infinity;b.teams[1].camp.shot=Infinity;
  const enemies=[soldier(b,1,'newbie',wall.x+220,35),soldier(b,1,'newbie',wall.x+220,465)];
  for(let i=0;i<3;i++)enemies.push(soldier(b,1,'newbie',wall.x+150,210+i*38));
  for(const enemy of enemies){enemy.cooldown=Infinity;enemy.hp=enemy.maxHp=1000;enemy.moving=false;}
  const before=enemies.map(enemy=>enemy.hp);
  b.tick();
  assert.equal(wall.barrageCooldown,RULES.campBarrageCooldown);
  assert.ok(b.events.some(event=>event.type==='camp-barrage'));
  assert.ok(b.effects.some(effect=>effect.type==='camp-barrage'));
  advance(b,1.05);
  const damage=enemies.map((enemy,i)=>before[i]-enemy.hp);
  assert.ok(damage.every(value=>value>0),'Every enemy in the barrage range should be hit');
  assert.equal(damage[0],RULES.campBarrageDamage*RULES.campBarrageWaves);
  assert.ok(damage[0]<50,'The full three-volley damage should stay modest');
  wall.barrageCooldown=1;
  b.tick();
  assert.equal(b.events.some(event=>event.type==='camp-barrage'),false,'Cooldown blocks an immediate second barrage');
});
test('the armor, ranged, and speed triangle is explicit in unit data',()=>{
  const heavy=UNITS.filter(d=>d.combatClass==='重甲');
  const ranged=UNITS.filter(d=>d.combatClass==='远程');
  const light=UNITS.filter(d=>d.combatClass==='轻甲');
  assert.ok(heavy.length&&ranged.length&&light.length);
  assert.ok(Math.max(...ranged.map(d=>d.speed))<Math.min(...heavy.map(d=>d.speed)));
  assert.ok(Math.max(...ranged.map(d=>d.speed))<Math.min(...light.map(d=>d.speed)));
  assert.ok(unit('mage').heavyDamage>unit('mage').lightDamage);
  assert.ok(unit('strange').heavyDamage>unit('strange').lightDamage);
  assert.ok(unit('swordsman').lightDamage>unit('swordsman').heavyDamage);
  assert.ok(unit('ninja').lightDamage>unit('ninja').heavyDamage);
  for(const d of light) assert.ok(d.lightDamage>d.heavyDamage);
  for(const d of heavy) assert.ok(d.lightDamage>d.heavyDamage);
});

test('the extended battle line gives a normal opening wave time before camp contact',()=>{
  const b=new Battle({mode:'local',seed:1});
  for(const t of b.teams){t.selected=unit('newbie').index;t.auto=true;}
  assert.ok(b.teams[0].camp.x-b.teams[0].x>1400);
  advance(b,20);
  assert.ok(b.teams.every(t=>t.camp.hp===RULES.campHP),'A normal first wave should not erase a camp in one round');
});

test('recruitment alternates between camp and castle, falling back to castle when camp is lost',()=>{
  const b=new Battle({mode:'local',seed:10}),t=b.teams[0];
  t.auto=true;t.gold=10000;t.supply=100;t.selected=unit('newbie').index;
  b.round=1;assert.equal(b.recruit(0).spawnSource,'camp');
  b.round=2;assert.equal(b.recruit(0).spawnSource,'castle');
  t.camp.hp=0;t.campDestroyed=true;b.round=3;assert.equal(b.recruit(0).spawnSource,'castle');
});
test('each round records the next spawn source for both sides',()=>{
  const b=new Battle({mode:'local',seed:12});
  for(const t of b.teams)t.auto=false;
  b.round=2;b.remaining=.01;b.teams[1].camp.hp=0;b.teams[1].campDestroyed=true;
  b.tick();
  const notice=b.events.find(event=>event.type==='round');
  assert.deepEqual(notice.sources,[{side:0,source:'camp'},{side:1,source:'castle'}]);
});

test('a destroyed camp waits for a counter-attack before rebuilding',()=>{
  const b=new Battle({mode:'local',seed:11});
  for(const t of b.teams){t.auto=false;t.shot=Infinity;}
  const raider=soldier(b,1,'high',b.teams[0].camp.x+35,b.teams[0].camp.y);b.teams[0].camp.hp=1;
  b.tick();
  assert.equal(b.teams[0].camp.hp,0);
  assert.equal(b.teams[0].campDestroyed,true);
  assert.equal(b.teams[0].camp.hp,0);
  raider.hp=0;
  const counter=soldier(b,0,'high',b.teams[1].camp.x-35,b.teams[1].camp.y);b.teams[1].camp.hp=1;
  b.tick();
  assert.equal(b.teams[1].camp.hp,0);
  assert.equal(b.teams[0].camp.hp,RULES.campHP);
  assert.equal(b.teams[0].campDestroyed,false);
});

test('dense melee lines separate visible bodies instead of stacking',()=>{
  const b=tacticalBattle(),units=[];
  for(const side of [0,1])for(let i=0;i<12;i++){
    const u=soldier(b,side,'swordsman',side?2035:1965,170+(i%6)*28);
    u.hp=u.maxHp=10000;units.push(u);
  }
  advance(b,1);
  let closest=Infinity;
  for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
    closest=Math.min(closest,Math.hypot(units[i].x-units[j].x,(units[i].y-units[j].y)*.72));
  }
  assert.ok(closest>=24,'Visible bodies should keep a clear 24px center gap in dense combat');
});

test('every melee unit inside the engagement area actively joins combat',()=>{
  const b=tacticalBattle(),units=[];
  for(const side of [0,1])for(let i=0;i<14;i++){
    const u=soldier(b,side,'swordsman',side?2050:1950,145+(i%7)*31);
    u.hp=u.maxHp=10000;units.push(u);
  }
  advance(b,5);
  const engaged=units.filter(u=>u.engaged);
  assert.equal(engaged.length,units.length);
  assert.ok(engaged.every(u=>b.time-(u.lastCombat??-99)<2),'Every front-line melee unit must land attacks');
  assert.ok(new Set(engaged.map(u=>u.combatTarget)).size>=8,'The front should distribute attackers across enemies');
});
