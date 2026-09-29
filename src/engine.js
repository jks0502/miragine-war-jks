import {UNITS,RULES,DIFFICULTIES,RANGED_TACTICS as RT,FACTION_BY_ID} from './units.js';
import {MAP_BY_ID,weatherAt} from './maps.js';

export function randomSource(seed=1) {
  let n=seed>>>0;
  return ()=>{ n=(Math.imul(n,1664525)+1013904223)>>>0; return n/4294967296; };
}
export function damageAgainst(attacker, defender) {
  return Math.max(1,(defender.armored?attacker.heavyDamage:attacker.lightDamage)-defender.armor);
}
function bombardDamage(target) {
  const def=UNITS[target.kind];
  if(def.stage==='前期') return target.maxHp+def.armor+1;
  if(['中期','中前期','中后期'].includes(def.stage)) return Math.max(1,Math.ceil(target.maxHp*.84));
  return Math.max(1,Math.ceil(target.maxHp*.24));
}
const isUnit = value => Number.isInteger(value?.kind);
const isStructure = value => value?.structure === 'castle' || value?.structure === 'camp';
const bodyRadius = def => def.id==='cavalry'?24:['heavy','dread','high'].includes(def.id)?19:15;
const engagementOffsets=[0,.48,-.48,.88,-.88,1.2,-1.2];

function engagementPoint(u,def,target,slot,reach) {
  if(!isUnit(target)||def.range>30) return target;
  const direction=u.side===0?1:-1;
  const layer=Math.floor(slot/engagementOffsets.length);
  const angle=(direction>0?Math.PI:0)+engagementOffsets[slot%engagementOffsets.length];
  const radius=Math.max(8,reach-3+layer*6);
  return {x:target.x+Math.cos(angle)*radius,y:target.y+Math.sin(angle)*radius};
}

function rangedOrder(u,target,distance,reach,frontlineX,homeX) {
  if(!target) return {x:u.x,y:u.y,move:false,fire:false,state:'idle'};
  const direction=u.side===0?1:-1;
  // Once enemy soldiers are gone, structures become the real objective. A
  // ranged unit must close to the wall or castle and keep firing at point
  // blank range; the normal anti-melee kite band does not apply to sieges.
  if(isStructure(target)){
    const holdDistance=Math.max(12,reach-3);
    if(distance<=reach)return {x:u.x,y:u.y,move:false,fire:true,state:'siege'};
    return {x:target.x-direction*holdDistance,y:u.y,move:true,fire:false,state:'siege'};
  }
  // A wide hold band prevents tiny target and collision movements from making
  // ranged units alternate between advancing and retreating every frame.
  const safeDistance=Math.max(55,reach*RT.safeRatio);
  const preferredDistance=Math.max(safeDistance+8,reach*RT.preferredRatio);
  const homeBand=Math.max(120,reach*.72);
  const atHome=Number.isFinite(homeX)&&Math.abs(u.x-homeX)<=homeBand;
  // When a push reaches the wall, the ranged line becomes the emergency
  // defense. It fires immediately from its current position instead of
  // waiting for a friendly melee screen to rebuild in front of it.
  if(atHome&&distance<=reach){
    return {x:u.x,y:u.y,move:false,fire:true,state:'wall-fire'};
  }
  const finishingKite=u.tactic==='kite'&&distance<preferredDistance;
  let order;
  if(distance>=safeDistance&&distance<=reach&&!finishingKite) {
    order={x:u.x,y:u.y,move:false,fire:true,state:'fire'};
  }else{
    // Walls span the full lane, so only horizontal separation matters for them.
    const targetY=target.structure==='camp'?u.y:target.y;
    let dx=u.x-target.x,dy=(u.y-targetY)*1.25;
    let length=Math.hypot(dx,dy);
    if(length<.001){dx=u.side===0?-1:1;dy=0;length=1;}
    order={
      x:target.x+dx/length*preferredDistance,
      y:targetY+(dy/length*preferredDistance)/1.25,
      move:true,
      // A ranged unit can keep shooting while backing away from a close enemy.
      fire:distance<=reach,
      state:distance<safeDistance||finishingKite?'kite':'approach'
    };
  }

  // A living friendly melee line is a hard advance limit. Ranged units may
  // fight alone when no melee survives, but must not use their higher speed to
  // run past an existing front line.
  if(Number.isFinite(frontlineX)&&(target.x-u.x)*direction>=-10){
    const limit=frontlineX-direction*RT.frontlineGap;
    const unitBeyond=(u.x-limit)*direction>RT.positionTolerance;
    const orderBeyond=(order.x-limit)*direction>0;
    if(unitBeyond||orderBeyond){
      order.x=limit;order.y=u.y;order.move=true;order.state='formation';
    }
  }
  return order;
}

class Grid {
  constructor(units) {
    this.cells=new Map();
    for(const u of units) {
      if(u.hp<=0) continue;
      const k=`${Math.floor(u.x/64)},${Math.floor(u.y/64)}`;
      if(!this.cells.has(k)) this.cells.set(k,[]);
      this.cells.get(k).push(u);
    }
  }
  near(x,y,r) {
    const result=[];
    for(let ix=Math.floor((x-r)/64);ix<=Math.floor((x+r)/64);ix++)
      for(let iy=Math.floor((y-r)/64);iy<=Math.floor((y+r)/64);iy++) {
        const cell=this.cells.get(`${ix},${iy}`);
        if(cell) result.push(...cell);
      }
    return result;
  }
}

export class Battle {
  constructor({mode='single',difficulty='normal',seed=Date.now(),faction0='roland',faction1='azure',mapId='grassland'}={}) {
    this.mode=mode;
    this.mapId=MAP_BY_ID[mapId]?mapId:'grassland';
    this.weather=weatherAt(this.mapId,0);
    this.difficulty=DIFFICULTIES.find(d=>d.id===difficulty)||DIFFICULTIES[1];
    this.random=randomSource(seed);
    this.time=0; this.round=1; this.remaining=RULES.roundSeconds;
    this.units=[]; this.effects=[]; this.events=[]; this.pendingBombards=[]; this.pendingCampBarrages=[]; this.pendingNukes=[]; this.contaminatedZones=[]; this.nextId=1;this.nextNukeId=1;
    this.winner=null; this.paused=false; this.aiClock=0;
    this.teams=[0,1].map(side=>{
      const x=side?RULES.width-105:105,y=RULES.height/2;
      const line=RULES.width-210;
      const campX=side?RULES.width-105-line*.25:105+line*.25;
      const selectedFaction=side===0?faction0:faction1;
      const faction=FACTION_BY_ID[selectedFaction]?selectedFaction:(side?'azure':'roland');
      return {structure:'castle',side,faction,gold:RULES.startGold,baseIncome:RULES.startIncome,armyIncome:0,income:RULES.startIncome,supply:RULES.roundSupply,
        selected:0,auto:true,hp:RULES.castleHP,maxHp:RULES.castleHP,armor:RULES.castleArmor,
        shot:0,spawnClock:8,spawned:0,kills:0,spent:0,bombardCooldown:0,nukesUsed:0,x,y,radius:52,
        camp:{structure:'camp',side,x:campX,y,hp:RULES.campHP,maxHp:RULES.campHP,armor:RULES.campArmor,
          radius:32,shot:0,barrageCooldown:0},campDestroyed:false};
    });
  }
  select(side,index) {
    if(!UNITS[index]||!this.teams[side]||this.winner!==null) return false;
    this.teams[side].selected=index;
    return true;
  }
  refreshIncome(side) {
    const t=this.teams[side];
    const livingSupply=this.units.reduce((sum,u)=>sum+(u.side===side&&u.hp>0?(u.supplyCost??UNITS[u.kind].supply):0),0);
    t.livingSupply=livingSupply;
    t.armyIncome=Math.min(Math.floor(t.baseIncome*RULES.armyIncomeRatio),livingSupply*RULES.incomePerSupply);
    t.income=Math.min(RULES.maxIncome,t.baseIncome+t.armyIncome);
    return t.income;
  }
  availableSupply(side) {
    const t=this.teams[side];
    if(!t) return 0;
    const living=this.units.reduce((count,u)=>count+(u.side===side&&u.hp>0?1:0),0);
    return living>=RULES.unitCap?0:t.supply;
  }
  recruit(side,{manual=false}={}) {
    const t=this.teams[side], selected=UNITS[t.selected];
    if(this.winner!==null || (!manual&&!t.auto) || !selected || t.gold<selected.cost || this.availableSupply(side)<selected.supply) return false;
    // Mystery is a recruitment contract: pay its fixed price, then roll one
    // concrete unit. Excluding itself avoids recursive mystery rolls.
    const pool=selected.id==='mystery'?UNITS.filter(d=>d.id!=='mystery'):null;
    const def=pool?pool[Math.floor(this.random()*pool.length)]:selected;
    t.gold-=selected.cost; t.supply-=selected.supply;
    t.spent+=selected.cost;
    const source=this.spawnSource(side)==='camp'?t.camp:t;
    const direction=side? -1:1, rank=Math.floor((t.spawned%60)/10), row=t.spawned%10;
    const u={id:this.nextId++,side,kind:def.index,hp:def.hp,maxHp:def.hp,
      selectedKind:selected.id,randomized:selected.id==='mystery',supplyCost:selected.supply,
      spawnSource:source.structure,
      x:source.structure==='camp'?source.x+direction*38:source.x+direction*(110-rank*17),
      y:source.structure==='camp'?source.y+(row%3-1)*20:100+row*32+(this.random()-.5)*6,
      cooldown:this.random()*.25,blinkCooldown:0,attack:0,flash:0,walk:0,moving:false,heading:side?-1:1};
    t.spawned++; this.units.push(u);this.refreshIncome(side);this.events.push({type:'spawn',side,source:source.structure});
    return u;
  }
  spawnSource(side) {
    const t=this.teams[side];
    return this.round%2===1&&t.camp.hp>0?'camp':'castle';
  }
  engagementArea() {
    const alive=this.units.filter(u=>u.hp>0);
    const engaged=alive.filter(u=>u.engaged&&u.combatTarget!==null);
    const pool=engaged.length?engaged:alive;
    if(!pool.length) return null;
    if(!engaged.length) {
      let pair=null,best=Infinity;
      for(const u of alive) for(const v of alive) {
        if(u.side===v.side||v.hp<=0) continue;
        const distance=Math.hypot(u.x-v.x,(u.y-v.y)*1.25);
        if(distance<best){best=distance;pair=[u,v];}
      }
      if(!pair||best>700) return null;
      return {x:(pair[0].x+pair[1].x)/2,y:(pair[0].y+pair[1].y)/2};
    }
    return {x:pool.reduce((sum,u)=>sum+u.x,0)/pool.length,y:pool.reduce((sum,u)=>sum+u.y,0)/pool.length};
  }
  bombard(side) {
    const t=this.teams[side];
    if(!t||this.paused||this.winner!==null||t.bombardCooldown>0||t.gold<RULES.bombardCost) return false;
    const area=this.engagementArea();
    if(!area) return false;
    t.gold-=RULES.bombardCost;
    t.bombardCooldown=RULES.bombardCooldown;
    this.pendingBombards.push({side,x:area.x,y:RULES.height/2,elapsed:0,damageCount:0,notified:false});
    this.effects.push({type:'bombard',x:area.x,y:RULES.height/2,side,radius:RULES.bombardWidth/2,width:RULES.bombardWidth,height:RULES.bombardHeight,missiles:RULES.bombardMissiles,flight:RULES.bombardFlight,stagger:RULES.bombardStagger,life:RULES.bombardEffectDuration,max:RULES.bombardEffectDuration});
    return true;
  }
  launchNuke(side) {
    const t=this.teams[side],cost=t&&RULES.nukeCosts[t.nukesUsed];
    if(!t||this.paused||this.winner!==null||t.nukesUsed>=RULES.nukeMaxUses||cost===undefined||t.gold<cost) return false;
    const area=this.engagementArea()||{x:RULES.width/2};
    const id=this.nextNukeId++;
    t.gold-=cost;t.nukesUsed++;t.spent+=cost;
    this.pendingNukes.push({id,side,x:area.x,elapsed:0});
    this.effects.push({type:'nuke-fall',nukeId:id,x:area.x,y:0,impactY:RULES.height*.5,side,
      flight:RULES.nukeFlight,life:RULES.nukeFlight,max:RULES.nukeFlight});
    return true;
  }
  detonateNuke(nuke) {
    const fall=this.effects.find(e=>e.type==='nuke-fall'&&e.nukeId===nuke.id);
    if(fall)fall.life=0;
    const zone={id:nuke.id,x:nuke.x,y:RULES.height*.5,radiusX:RULES.nukePollutionRadiusX,
      radiusY:RULES.nukePollutionRadiusY,createdRound:this.round,expiresAtRound:this.round+RULES.nukePollutionRounds};
    this.contaminatedZones.push(zone);
    let enemyDeaths=0;
    for(const u of this.units) {
      if(u.hp<=0)continue;
      if(u.side!==nuke.side)enemyDeaths++;
      u.hp=0;u.deadAt=this.time;u.flash=.5;
      this.effects.push({type:'death',x:u.x,y:u.y,kind:u.kind,side:u.side,life:.8,max:.8});
    }
    this.teams[nuke.side].kills+=enemyDeaths;
    this.effects.push({type:'nuke-explosion',x:nuke.x,y:zone.y,side:nuke.side,
      radiusX:zone.radiusX,radiusY:zone.radiusY,life:RULES.nukeBlastDuration,max:RULES.nukeBlastDuration});
    this.events.push({type:'nuke-detonated',side:nuke.side,x:nuke.x,zoneId:zone.id,expiresAtRound:zone.expiresAtRound});
  }
  startCampBarrage(side,nearbyCount=0) {
    const camp=this.teams[side]?.camp;
    if(!camp||camp.hp<=0||camp.barrageCooldown>0||this.pendingCampBarrages.some(b=>b.side===side)) return false;
    camp.barrageCooldown=RULES.campBarrageCooldown;
    // The first volley lands immediately; the remaining two are staggered.
    this.pendingCampBarrages.push({side,elapsed:RULES.campBarrageInterval,damageCount:0});
    this.effects.push({type:'camp-barrage',x:camp.x,y:camp.y,side,range:RULES.campBarrageRange,width:RULES.campBarrageRange,height:RULES.height,
      waves:RULES.campBarrageWaves,interval:RULES.campBarrageInterval,
      life:RULES.campBarrageEffectDuration,max:RULES.campBarrageEffectDuration});
    this.events.push({type:'camp-barrage',side,count:nearbyCount});
    return true;
  }
  rebuildCamp(side) {
    const t=this.teams[side];
    if(t.camp.hp>0 || !t.campDestroyed) return false;
    t.camp={structure:'camp',side,x:t.x+(side?-1:1)*(RULES.width-210)*.25,y:t.y,
      hp:RULES.campHP,maxHp:RULES.campHP,armor:RULES.campArmor,radius:32,shot:0,barrageCooldown:0};
    this.events.push({type:'camp-rebuilt',side});
    t.campDestroyed=false;
    return true;
  }
  structures() {
    return this.teams.flatMap(t=>[t,t.camp]).filter(s=>s&&s.hp>0);
  }
  separateUnits() {
    // Resolve visual body overlap after movement. Multiple passes converge fast,
    // and deterministic fallback directions also split units at identical points.
    const before=new Map(this.units.map(u=>[u.id,u.x]));
    for(let pass=0;pass<5;pass++) {
      const grid=new Grid(this.units);
      for(const u of this.units) {
        if(u.hp<=0) continue;
        const radius=bodyRadius(UNITS[u.kind]);
        for(const other of grid.near(u.x,u.y,55)) {
          if(other.hp<=0||other.id<=u.id) continue;
          const otherRadius=bodyRadius(UNITS[other.kind]);
          let dx=u.x-other.x,dy=(u.y-other.y)*.72;
          const minimum=radius+otherRadius;
          // A compressed friendly column needs a sideways escape route; pure
          // vertical repulsion would keep tall sprites layered on one line.
          if(u.side===other.side&&Math.abs(dx)<minimum*.25&&Math.abs(dy)<minimum) {
            dx=((u.id+other.id)%2?1:-1)*minimum*.58;
          }
          let length=Math.hypot(dx,dy);
          if(length>=minimum) continue;
          if(length<.001) {
            const angle=((u.id*37+other.id*17)%360)*Math.PI/180;
            dx=Math.cos(angle);dy=Math.sin(angle);length=1;
          }
          const nx=dx/length,ny=dy/length/.72;
          const uBlocked=(u.x<=75.01&&nx<0)||(u.x>=RULES.width-75.01&&nx>0)||(u.y<=65.01&&ny<0)||(u.y>=RULES.height-40.01&&ny>0);
          const otherBlocked=(other.x<=75.01&&nx>0)||(other.x>=RULES.width-75.01&&nx<0)||(other.y<=65.01&&ny>0)||(other.y>=RULES.height-40.01&&ny<0);
          const correction=(minimum-length)*1.01;
          const uShare=uBlocked?0:otherBlocked?1:.5,otherShare=otherBlocked?0:uBlocked?1:.5;
          u.x=Math.max(75,Math.min(RULES.width-75,u.x+nx*correction*uShare));
          u.y=Math.max(65,Math.min(RULES.height-40,u.y+ny*correction*uShare));
          other.x=Math.max(75,Math.min(RULES.width-75,other.x-nx*correction*otherShare));
          other.y=Math.max(65,Math.min(RULES.height-40,other.y-ny*correction*otherShare));
        }
      }
    }
    // Collision resolution must not undo a ranged unit's retreat or formation correction.
    for(const u of this.units) if(u.tactic==='kite'||u.tactic==='formation') {
      const x=before.get(u.id);
      u.x=u.kiteDirection<0?Math.min(u.x,x):Math.max(u.x,x);
    }
  }
  chooseAI(side=1) {
    const t=this.teams[side];
    const counts=new Array(UNITS.length).fill(0);
    for(const u of this.units) if(u.side!==side&&u.hp>0) counts[u.kind]+=UNITS[u.kind].cost;
    let dominant=counts.indexOf(Math.max(...counts));
    // Only deployed units are visible to AI; it never reads the player's selection.
    const enemy=UNITS[dominant];
    const danger=this.units.some(u=>u.side!==side&&Math.abs(u.x-t.x)<450);
    const hasScreen=this.units.some(u=>u.side===side&&u.hp>0&&UNITS[u.kind].range<=30);
    const lateLocked=this.teams[1-side].camp.hp>0;
    const candidates=UNITS.filter(d=>d.cost<=Math.max(t.gold,t.income/3)&&d.supply<=this.availableSupply(side)&&(d.range<=30||hasScreen)&&(!lateLocked||d.stage!=='后期'&&d.id!=='mystery'));
    if(!candidates.length) return;
    if(this.random()>this.difficulty.skill) {
      t.selected=candidates[Math.floor(this.random()*Math.min(candidates.length,8))].index;
      return;
    }
    let best=-Infinity, choice=0;
    for(const d of candidates) {
      const outgoing=damageAgainst(d,enemy)/d.interval;
      const incoming=damageAgainst(enemy,d)/enemy.interval;
      const combat=Math.sqrt(outgoing*d.hp/incoming)/Math.pow(d.cost,.62);
      const economy=(d.income/d.cost)*2.5;
      // A clear counter must outweigh a small economy advantage. Without this
      // term both sides can settle into an all-heavy stalemate even while a
      // suitable ranged or fast counter is affordable.
      const matchup=d.counters?.includes(enemy.id)?1.4:d.counteredBy?.includes(enemy.id)?-.45:0;
      const score=combat+(danger?.12:.8)*economy+matchup+(this.random()*.045);
      if(score>best) { best=score; choice=d.index; }
    }
    t.selected=choice;
  }
  tick(dt=RULES.step) {
    if(this.paused||this.winner!==null) return;
    this.time+=dt; this.remaining-=dt; this.events=[];
    const nextWeather=weatherAt(this.mapId,this.time);
    if(nextWeather.id!==this.weather.id){
      this.weather=nextWeather;
      this.events.push({type:'weather',weather:nextWeather.id});
    }
    if(this.remaining<=0) {
      this.remaining+=RULES.roundSeconds; this.round++;
      this.contaminatedZones=this.contaminatedZones.filter(zone=>this.round<zone.expiresAtRound);
      for(const t of this.teams) {
        t.baseIncome=Math.min(RULES.baseIncomeCap,t.baseIncome+RULES.baseIncomeGrowth);
        t.gold+=this.refreshIncome(t.side);t.supply=RULES.roundSupply;
      }
      this.events.push({type:'round',round:this.round,sources:this.teams.map(t=>({side:t.side,source:this.spawnSource(t.side)}))});
      this.aiClock=0;
    }
    if(this.mode==='single') {
      this.aiClock-=dt;
      if(this.aiClock<=0) {this.chooseAI();this.aiClock=this.difficulty.reaction;}
    }
    for(const u of this.units) if(u.hp<=0&&u.deadAt===undefined)u.deadAt=this.time;
    for(const t of this.teams) {
      t.bombardCooldown=Math.max(0,t.bombardCooldown-dt);
      t.camp.barrageCooldown=Math.max(0,(t.camp.barrageCooldown??0)-dt);
      t.spawnClock-=dt;
      if(t.spawnClock<=0) {this.recruit(t.side);t.spawnClock=RULES.spawnInterval;}
    }
    const activeNukes=[];
    for(const nuke of this.pendingNukes) {
      nuke.elapsed+=dt;
      if(nuke.elapsed>=RULES.nukeFlight)this.detonateNuke(nuke);
      else activeNukes.push(nuke);
    }
    this.pendingNukes=activeNukes;
    const previousX=new Map(this.units.map(u=>[u.id,u.x]));
    const grid=new Grid(this.units), hits=[],attackers=new Map();
    for(const t of this.teams) {
      const camp=t.camp;
      if(camp.hp<=0||camp.barrageCooldown>0||this.pendingCampBarrages.some(b=>b.side===t.side)) continue;
      const enemies=this.units.filter(u=>u.side!==t.side&&u.hp>0&&
        (u.x-camp.x)*(t.side? -1:1)>=0&&Math.abs(u.x-camp.x)<=RULES.campBarrageRange);
      const pressure=enemies.length>=RULES.campBarrageMinTargets||
        (enemies.length>=2&&camp.hp/camp.maxHp<=RULES.campBarrageCriticalHpRatio);
      if(pressure) this.startCampBarrage(t.side,enemies.length);
    }
    const activeBombards=[];
    for(const bomb of this.pendingBombards) {
      bomb.elapsed+=dt;
      if(!bomb.notified){this.events.push({type:'bombard',side:bomb.side,x:bomb.x,y:bomb.y});bomb.notified=true;}
      const waves=Math.min(RULES.bombardDamageWaves,Math.floor(bomb.elapsed/RULES.bombardDamageInterval));
      const halfWidth=RULES.bombardWidth/2;
      while(bomb.damageCount<waves){
        bomb.damageCount++;
        for(const target of grid.near(bomb.x,bomb.y,halfWidth)) {
          if(target.hp<=0||Math.abs(target.x-bomb.x)>halfWidth) continue;
          const total=target.side===bomb.side
            ?target.maxHp*RULES.bombardFriendlyFire
            :bombardDamage(target);
          hits.push({target,amount:total/RULES.bombardDamageWaves,side:bomb.side,source:null});
        }
      }
      if(bomb.elapsed<RULES.bombardEffectDuration||bomb.damageCount<RULES.bombardDamageWaves)activeBombards.push(bomb);
    }
    this.pendingBombards=activeBombards;
    const activeCampBarrages=[];
    for(const barrage of this.pendingCampBarrages) {
      barrage.elapsed+=dt;
      const waves=Math.min(RULES.campBarrageWaves,Math.floor(barrage.elapsed/RULES.campBarrageInterval));
      const camp=this.teams[barrage.side].camp;
      while(barrage.damageCount<waves) {
        barrage.damageCount++;
        for(const target of this.units) {
          if(target.hp<=0||target.side===barrage.side||(target.x-camp.x)*(barrage.side? -1:1)<0||Math.abs(target.x-camp.x)>RULES.campBarrageRange) continue;
          const amount=Math.max(1,RULES.campBarrageDamage-UNITS[target.kind].armor);
          hits.push({target,amount,side:barrage.side,source:camp});
        }
      }
      if(barrage.damageCount<RULES.campBarrageWaves) activeCampBarrages.push(barrage);
    }
    this.pendingCampBarrages=activeCampBarrages;
    const meleeFront=[0,1].map(side=>{
      const melee=this.units.filter(u=>u.side===side&&u.hp>0&&UNITS[u.kind].range<=30);
      if(!melee.length)return NaN;
      return side?Math.min(...melee.map(u=>u.x)):Math.max(...melee.map(u=>u.x));
    });
    for(const u of this.units) {
      if(u.hp<=0) continue;
      const def=UNITS[u.kind];
      u.cooldown-=dt;u.blinkCooldown=Math.max(0,(u.blinkCooldown??0)-dt);u.attack=Math.max(0,u.attack-dt);u.flash=Math.max(0,u.flash-dt);
      let unitTarget=null, unitDistance=Infinity, unitScore=Infinity;
      let lockedTarget=null, lockedDistance=Infinity;
      let priorityTarget=null, priorityDistance=Infinity;
      for(const e of grid.near(u.x,u.y,560)) {
        if(e.side===u.side||e.hp<=0) continue;
        const d=Math.hypot(e.x-u.x,(e.y-u.y)*1.25);
        if(e.id===u.combatTarget){lockedTarget=e;lockedDistance=d;}
        if(def.id==='ninja'&&UNITS[e.kind].id==='samurai'&&d<priorityDistance){priorityTarget=e;priorityDistance=d;}
        // Prefer nearby enemies, but distribute a dense wave across the front
        // instead of allowing every soldier to pile onto the same target.
        const score=d+(attackers.get(e.id)||0)*34-(def.id==='ninja'&&UNITS[e.kind].id==='samurai'?240:0);
        if(score<unitScore) {unitScore=score;unitDistance=d;unitTarget=e;}
      }
      // Keep attacking the same living target while it remains nearby. This
      // avoids visible left/right flicker when two enemies have similar scores.
      if(lockedTarget&&!(def.id==='ninja'&&priorityTarget&&UNITS[lockedTarget.kind].id!=='samurai')){unitTarget=lockedTarget;unitDistance=lockedDistance;}
      if(def.id==='ninja'&&priorityTarget){unitTarget=priorityTarget;unitDistance=priorityDistance;}
      let structureTarget=null, structureDistance=Infinity;
      for(const structure of this.structures()) {
        if(structure.side===u.side||structure.hp<=0) continue;
        const d=structure.structure==='camp'?Math.abs(structure.x-u.x):Math.hypot(structure.x-u.x,(structure.y-u.y)*1.25);
        if(d<structureDistance) {structureDistance=d;structureTarget=structure;}
      }
      // Keep nearby opposing soldiers as the active front, but let a wave
      // advance on a camp or castle once no enemy is close enough to contest it.
      const wall=this.teams[1-u.side].camp,direction=u.side===0?1:-1;
      const wallBlocks=wall.hp>0&&(wall.x-u.x)*direction>=0&&unitTarget&&(unitTarget.x-wall.x)*direction>0;
      const target=wallBlocks?wall:unitTarget&&unitDistance<=520?unitTarget:structureTarget||unitTarget;
      let distance=target===wall?Math.abs(wall.x-u.x):target===unitTarget?unitDistance:structureDistance;
      const targetIsUnit=isUnit(target), targetIsStructure=isStructure(target);
      const targetRadius=targetIsUnit?bodyRadius(UNITS[target.kind]):targetIsStructure?target.radius:38;
      const reach=def.range+targetRadius+bodyRadius(def);
      const slot=targetIsUnit?(attackers.get(target.id)||0):0;
      if(targetIsUnit) attackers.set(target.id,slot+1);
      u.combatTarget=targetIsUnit?target.id:null;
      u.engaged=targetIsUnit&&distance<=520;
      // Adjacent melee ranks can strike through the front row. This keeps the
      // whole contact line fighting while collision spacing remains visible.
      const strikeReach=reach+(targetIsUnit&&def.range<=30?bodyRadius(def)*2:0);
      let blinked=false;
      if(def.id==='ninja'&&targetIsUnit&&UNITS[target.kind].id==='samurai'&&distance>strikeReach+5&&distance<=def.blinkRange&&u.blinkCooldown<=0){
        const direction=u.side===0?1:-1,fromX=u.x,fromY=u.y;
        u.x=target.x-direction*(bodyRadius(UNITS[target.kind])+bodyRadius(def)+8);
        u.y=target.y;
        u.x=Math.max(75,Math.min(RULES.width-75,u.x));u.y=Math.max(65,Math.min(RULES.height-40,u.y));
        distance=Math.hypot(target.x-u.x,(target.y-u.y)*1.25);u.blinkCooldown=def.blinkCooldown;u.tactic='blink';u.moving=false;u.heading=target.x>u.x?1:-1;blinked=true;
        this.effects.push({type:'ninja-blink',x:fromX,y:fromY-25,tx:u.x,ty:u.y-25,side:u.side,life:.62,max:.62});
      }
      let destination=blinked?{x:u.x,y:u.y}:engagementPoint(u,def,target,slot,reach),canFire=distance<=strikeReach;
      if(target?.structure==='camp')destination={x:target.x,y:u.y};
      if(def.range>30){
        const home=this.teams[u.side].camp.hp>0?this.teams[u.side].camp:this.teams[u.side];
        const order=rangedOrder(u,target,distance,reach,meleeFront[u.side],home.x);
        destination=order;canFire=order.fire;u.tactic=order.state;
        u.moving=order.move&&Math.hypot(order.x-u.x,order.y-u.y)>RT.positionTolerance;
        u.kiteDirection=order.state==='kite'||order.state==='formation'
          ?Math.sign(order.x-u.x)||(u.side===0?-1:1):0;
      }else{u.moving=!blinked&&distance>strikeReach;}
      // Camera observes actual in-range engagements, including structures.
      u.cameraTarget=canFire?{id:target.id,structure:target.structure,side:target.side}:null;
      if(u.moving) {
        const dx=destination.x-u.x,dy=destination.y-u.y;
        const length=Math.hypot(dx,dy)||1;
        const step=Math.min(length,def.speed*RULES.speedScale*dt);
        u.x+=dx/length*step;
        u.y+=dy/length*step;
        u.walk+=dt*def.speed*3;
        if(def.range<=30&&Math.abs(dx)>2) u.heading=dx>0?1:-1;
      }
      // Ranged units always face their target, including while kiting. Their
      // shot cadence is independent from movement, so backing away cannot
      // starve the attack state.
      if(def.range>30&&target)u.heading=target.x>u.x?1:-1;
      if(canFire&&u.cooldown<=0) {
        u.cooldown=def.interval; u.attack=.25;
        u.lastCombat=this.time;
        u.heading=target.x>u.x?1:-1;
        const amount=targetIsStructure?Math.max(1,def.heavyDamage-target.armor):damageAgainst(def,UNITS[target.kind]);
        hits.push({target,amount,side:u.side,source:u});
        if(def.splashRadius&&targetIsUnit){
          for(const other of grid.near(target.x,target.y,def.splashRadius)){
            if(other===target||other.side===u.side||other.hp<=0||Math.hypot(other.x-target.x,other.y-target.y)>def.splashRadius)continue;
            hits.push({target:other,amount:Math.max(1,Math.round(damageAgainst(def,UNITS[other.kind])*def.splashFactor)),side:u.side,source:u});
          }
          this.effects.push({type:'splash',x:target.x,y:target.y,side:u.side,radius:def.splashRadius,life:.3,max:.3});
        }
        const effectType=def.id==='newbie'?'militia-strike':def.id==='zombie'?'bandage':def.id==='strange'?'strange':def.id==='mage'?'frost':def.id==='samurai'?'arrow':def.id==='cavalry'?'charge':def.id==='vampire'?'drain':def.id==='dread'?'sweep':def.id==='high'?'high-strike':def.id==='monk'?'monk-strike':def.id==='ninja'?'ninja-arc':def.id==='swordsman'?'sword-guard':def.id==='heavy'?'spear-guard':def.range>30?'bolt':'slash';
        if(def.id==='swordsman')u.guardStrikeCount=(u.guardStrikeCount||0)+1;
        if(def.id==='heavy')u.spearStrikeCount=(u.spearStrikeCount||0)+1;
        if(def.id==='monk')u.monkStrikeCount=(u.monkStrikeCount||0)+1;
        if(def.id==='vampire')u.vampireStrikeCount=(u.vampireStrikeCount||0)+1;
        if(def.id==='mage')u.mageStrikeCount=(u.mageStrikeCount||0)+1;
        const effectVariant=['swordsman','heavy','monk','vampire'].includes(def.id)
          ?((def.id==='heavy'?u.spearStrikeCount:def.id==='monk'?u.monkStrikeCount:def.id==='vampire'?u.vampireStrikeCount:u.guardStrikeCount)-1)%3
          :['strange','samurai','dread'].includes(def.id)?Math.floor(this.random()*(def.id==='strange'?4:3)):def.id==='mage'?(u.mageStrikeCount-1)%3:0;
        if(['monk','vampire','mage','strange','dread'].includes(def.id))u.attackVariant=effectVariant;
        const effectDuration=def.id==='strange'?(effectVariant===3?1.65:1.05):def.id==='dread'?(effectVariant===2?1.45:.68):def.id==='vampire'?(effectVariant===2?1.05:.52):def.id==='mage'?(effectVariant===2?1.28:.88):['heavy','monk','cavalry'].includes(def.id) ? .62 : def.id==='swordsman' ? .56 : def.range>30 ? .3 : .18;
        this.effects.push({type:effectType,variant:effectVariant,x:u.x,y:u.y-30,tx:target.x,ty:target.structure==='camp'?u.y-30:target.y-30,
          side:u.side,life:effectDuration,max:effectDuration});
      }
      u.x=Math.max(75,Math.min(RULES.width-75,u.x));
      u.y=Math.max(65,Math.min(RULES.height-40,u.y));
    }
    this.separateUnits();
    for(const u of this.units){
      const wall=this.teams[1-u.side].camp;
      if(wall.hp>0&&(wall.x-previousX.get(u.id))*(u.side===0?1:-1)>=0){const gap=32+bodyRadius(UNITS[u.kind]);u.x=u.side===0?Math.min(u.x,wall.x-gap):Math.max(u.x,wall.x+gap);}
    }
    for(const structure of this.structures()) {
      const isCastle=structure.structure==='castle';
      const range=isCastle?RULES.castleRange:RULES.campRange;
      structure.shot-=dt;
      if(structure.shot>0) continue;
      let target=null, nearest=range;
      for(const u of grid.near(structure.x,structure.y,range)) {
        if(u.side===structure.side||u.hp<=0) continue;
        const d=Math.hypot(u.x-structure.x,u.y-structure.y);
        if(d<nearest) {target=u;nearest=d;}
      }
      if(target) {
        hits.push({target,amount:isCastle?RULES.castleDamage:RULES.campDamage,side:structure.side,source:structure});
        structure.shot=isCastle?RULES.castleInterval:RULES.campInterval;
        this.effects.push({type:'beam',x:structure.x,y:structure.y-(isCastle?95:48),tx:target.x,ty:target.y-10,side:structure.side,life:.28,max:.28});
      }
    }
    for(const {target,amount,side,source} of hits) {
      if(target.hp<=0) continue;
      const actualDamage=Math.min(target.hp,amount);
      target.hp=Math.max(0,target.hp-amount);target.flash=.12;
      target.lastCombat=this.time;
      if(isUnit(source)&&isUnit(target)&&UNITS[source.kind].lifesteal){
        source.hp=Math.min(source.maxHp,source.hp+actualDamage*UNITS[source.kind].lifesteal);
        this.effects.push({type:'heal',x:source.x,y:source.y,life:.35,max:.35});
      }
      if(isUnit(target)&&target.hp===0) {
        target.deadAt=this.time;
        this.teams[side].kills++;
        this.effects.push({type:'death',x:target.x,y:target.y,kind:target.kind,side:target.side,life:.6,max:.6});
      } else if(target.structure==='camp'&&target.hp===0) {
        this.teams[target.side].campDestroyed=true;
        this.events.push({type:'camp-destroyed',side:target.side,by:side});
        this.effects.push({type:'structure-destroyed',x:target.x,y:target.y,structure:'camp',side:target.side,life:.8,max:.8});
        // A lost forward camp returns only after that side counter-attacks and
        // destroys the enemy's camp. This makes the forward position valuable
        // without allowing an immediate free replacement.
        if(Number.isInteger(side) && this.teams[side].campDestroyed) this.rebuildCamp(side);
      }
    }
    for(const u of this.units) {
      u.polluted=false;
      if(u.hp<=0)continue;
      const zone=this.contaminatedZones.find(z=>((u.x-z.x)/z.radiusX)**2+((u.y-z.y)/z.radiusY)**2<=1);
      if(!zone)continue;
      u.polluted=true;
      u.hp=Math.max(0,u.hp-RULES.nukePollutionDps*dt);
      if(u.hp===0) {
        u.deadAt=this.time;
        this.effects.push({type:'death',x:u.x,y:u.y,kind:u.kind,side:u.side,life:.8,max:.8});
      }
    }
    this.units=this.units.filter(u=>u.hp>0||u.deadAt===undefined||this.time-u.deadAt<RULES.corpseSeconds);
    for(const t of this.teams)this.refreshIncome(t.side);
    for(const u of this.units){
      if(u.hp<=0)continue;
      const regen=UNITS[u.kind].regen;
      if(regen&&this.time-(u.lastCombat??0)>=3)u.hp=Math.min(u.maxHp,u.hp+regen*dt);
    }
    for(const e of this.effects) e.life-=dt;
    this.effects=this.effects.filter(e=>e.life>0).slice(-350);
    const dead=this.teams.map(t=>t.hp<=0);
    if(dead[0]||dead[1]) {this.winner=dead[0]&&dead[1]?'draw':dead[0]?1:0;this.events.push({type:'end',winner:this.winner});}
  }
}
