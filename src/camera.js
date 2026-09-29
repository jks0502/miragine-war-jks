const ACTIVE_COMBAT_SECONDS=2.6;
const COMBAT_DEAD_ZONE=18;
const ADVANCE_DEAD_ZONE=6;
const COMBAT_CLUSTER_GAP=420;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function formationCenter(units){
  if(!units.length)return null;
  let left=Infinity,right=-Infinity;
  for(const unit of units){left=Math.min(left,unit.x);right=Math.max(right,unit.x);}
  return (left+right)/2;
}

function frontPosition(units,side){
  if(!units.length)return null;
  return side===0?Math.max(...units.map(unit=>unit.x)):Math.min(...units.map(unit=>unit.x));
}

function nearestCombatCluster(units,around){
  if(!units.length)return null;
  const sorted=[...units].sort((a,b)=>a.x-b.x),clusters=[];
  for(const unit of sorted){
    const last=clusters[clusters.length-1];
    if(!last||unit.x-last.right>COMBAT_CLUSTER_GAP)clusters.push({units:[unit],left:unit.x,right:unit.x});
    else{last.units.push(unit);last.right=unit.x;}
  }
  clusters.sort((a,b)=>Math.abs((a.left+a.right)/2-around)-Math.abs((b.left+b.right)/2-around));
  const chosen=clusters[0];
  return {center:formationCenter(chosen.units),participants:chosen.units};
}

export class BattleCamera {
  constructor(worldWidth,viewportWidth){
    this.worldWidth=worldWidth;
    this.viewportWidth=viewportWidth;
    this.maxPosition=Math.max(0,worldWidth-viewportWidth);
    this.position=this.maxPosition/2;
    this.anchor=this.position+viewportWidth/2;
    this.following=true;
    this.state='idle';
    this.survivorSide=null;
    this.participantIds=new Set();
    this.advanceSide=null;
    this.battle=null;
  }

  setFollowing(value){
    this.following=Boolean(value);
    if(!this.following){this.state='manual';this.survivorSide=null;this.targetCenter=null;}
  }

  setPosition(position){
    this.position=clamp(position,0,this.maxPosition);
    this.anchor=this.position+this.viewportWidth/2;
  }

  placeAt(center){
    this.anchor=center;
    this.position=clamp(center-this.viewportWidth/2,0,this.maxPosition);
  }

  observe(battle,{predict=false,around=this.anchor}={}){
    const living=(battle?.units||[]).filter(unit=>unit.hp>0);
    const sides=[living.filter(unit=>unit.side===0),living.filter(unit=>unit.side===1)];
    const byId=new Map(living.map(unit=>[unit.id,unit]));
    const resolveTarget=unit=>{
      const target=unit.cameraTarget;
      if(!target)return null;
      if(target.structure){
        const team=battle.teams?.[target.side];
        return (target.structure==='camp'?team?.camp:team)||target;
      }
      return byId.get(target.id);
    };

    if(living.length&&Number.isFinite(battle.time)){
      const active=living.filter(unit=>'cameraTarget' in unit
        ?resolveTarget(unit)?.hp>0
        :sides[1-unit.side].length>0&&Number.isFinite(unit.lastCombat)&&battle.time-unit.lastCombat<=ACTIVE_COMBAT_SECONDS);
      if(active.length){
        const participants=new Set(active);
        for(const unit of active){
          const target=resolveTarget(unit)||byId.get(unit.combatTarget);
          if(target?.hp>0)participants.add(target);
        }
        const cluster=nearestCombatCluster([...participants],around);
        return {state:'combat',side:null,center:cluster.center,participants:cluster.participants};
      }
    }

    const survivors=living.filter(unit=>this.participantIds.has(unit.id));
    const survivorSides=new Set(survivors.map(unit=>unit.side));
    let side=survivorSides.size===1?survivors[0].side:this.advanceSide;
    if(side===null||!sides[side]?.length){
      side=Boolean(sides[0].length)!==Boolean(sides[1].length)?(sides[0].length?0:1):null;
    }
    if(side===null&&battle.round===1&&living.length)side=sides[0].length?0:1;
    if(side!==null){
      return {state:'advance',side,center:frontPosition(sides[side],side)};
    }
    if(predict&&!living.length)return {state:'idle',side:null,center:this.worldWidth/2};
    return {state:'idle',side:null,center:null};
  }

  focus(battle){
    if(this.battle!==battle){this.participantIds.clear();this.advanceSide=null;this.battle=battle;}
    this.following=true;
    const view=this.observe(battle,{predict:true});
    this.state=view.state;
    this.survivorSide=view.side;
    this.targetCenter=view.center??null;
    this.remember(view);
    this.placeAt(view.center??this.anchor);
  }

  update(battle,dt){
    if(!this.following)return;
    if(this.battle!==battle){this.participantIds.clear();this.advanceSide=null;this.battle=battle;}
    const lockedAround=this.state==='combat'&&Number.isFinite(this.targetCenter)?this.targetCenter:this.anchor;
    const view=this.observe(battle,{around:lockedAround});

    if(view.state==='idle'){
      this.state='idle';
      this.survivorSide=null;
      this.targetCenter=null;
      return;
    }

    this.state=view.state;
    this.survivorSide=view.side;
    this.targetCenter=view.center;
    this.remember(view);

    const delta=view.center-this.anchor;
    const deadZone=view.state==='advance'?ADVANCE_DEAD_ZONE:COMBAT_DEAD_ZONE;
    if(Math.abs(delta)<=deadZone||!(dt>0))return;

    const response=view.state==='advance'?7:6;
    const maxSpeed=view.state==='advance'?560:300;
    const eased=Math.sign(delta)*(Math.abs(delta)-deadZone)*(1-Math.exp(-dt*response));
    this.anchor+=clamp(eased,-maxSpeed*dt,maxSpeed*dt);
    this.position=clamp(this.anchor-this.viewportWidth/2,0,this.maxPosition);
  }

  remember(view){
    if(view.state==='combat'){
      this.participantIds=new Set(view.participants.filter(unit=>Number.isInteger(unit.id)).map(unit=>unit.id));
      this.advanceSide=null;
    }else if(view.state==='advance')this.advanceSide=view.side;
  }
}
