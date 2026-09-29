import {Battle} from './engine.js';
import {UNITS,RULES,DIFFICULTIES,ROSTER_COLUMNS,FACTIONS,FACTION_BY_ID,FACTION_RELATIONS} from './units.js';
import {MAPS,MAP_BY_ID,WEATHER_BY_ID} from './maps.js';
import {Renderer} from './render.js';
import {drawNationalFlag} from './faction-art.js';
import {portrait,VISUALS} from './sprites.js';
import {Sound} from './audio.js';

const $=id=>document.getElementById(id);
const renderer=new Renderer($('battle'),$('minimap')),sound=new Sound();
let battle=null,screen='menu',lastOptions={mode:'single',difficulty:'normal',mapId:'grassland',faction0:'roland',faction1:'azure'},speed=1;
let factionChoice={mode:'single',difficulty:'normal',faction0:'roland',faction1:'azure'};
let mapChoice={mode:'single',difficulty:'normal',mapId:'grassland'};
let accumulator=0,lastTime=performance.now(),hudClock=0,waveUntil=0,inspect=0,helpReturn=null;
let lastGold=[null,null],lastIncome=[null,null],lastCastleHp=[null,null],lastSpawnSource=[null,null];
const byId=id=>UNITS.find(d=>d.id===id);
const factionSkin=faction=>({main:faction.banner,hi:faction.accent,dark:faction.shadow,glow:faction.glow,style:faction.id});
try{const settings=JSON.parse(localStorage.getItem('miragine-settings')||'{}');sound.enabled=settings.sound!==false;}catch{}
function save(){try{localStorage.setItem('miragine-settings',JSON.stringify({sound:sound.enabled}));}catch{}}
function toggle(id,show){$(id).classList.toggle('hidden',!show);}
function clickSound(){sound.unlock();sound.click();}
function pulseElement(element,className='resource-pulse'){
  if(!element)return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(()=>element.classList.remove(className),700);
}
function floatResource(side,text,kind){
  const host=$(`gold${side}`)?.parentElement;
  if(!host||!text)return;
  const item=document.createElement('span');item.className=`resource-float ${kind||''}`;item.textContent=text;host.append(item);
  window.setTimeout(()=>item.remove(),900);
}
function showCastleDamage(side,oldHp,newHp){
  const track=$(`health${side}`)?.parentElement,ghost=$(`health-ghost${side}`);
  if(!track||!ghost||oldHp===null||newHp>=oldHp)return;
  const oldWidth=Math.max(0,oldHp/RULES.castleHP*100),newWidth=Math.max(0,newHp/RULES.castleHP*100);
  ghost.style.width=`${oldWidth}%`;track.classList.remove('castle-hit');void track.offsetWidth;track.classList.add('castle-hit');
  requestAnimationFrame(()=>{ghost.style.width=`${newWidth}%`;});
  window.setTimeout(()=>track.classList.remove('castle-hit'),520);
}
function burstUnitCard(side,index){
  const card=document.querySelector(`#roster${side} .unit-card[data-unit="${index}"]`);
  if(!card)return;
  card.classList.remove('selection-burst');
  void card.offsetWidth;
  card.classList.add('selection-burst');
  window.setTimeout(()=>card.classList.remove('selection-burst'),520);
}
function makeDemo(){
  const demo=new Battle({mode:'local',seed:714,mapId:'grassland',faction0:'roland',faction1:'azure'});
  for(const t of demo.teams){t.gold=5000;t.selected=byId(t.side?'swordsman':'samurai').index;}
  for(let i=0;i<42;i++)for(const t of demo.teams){
    const id=i%8===0?'dread':i%3===0?'zombie':t.side?'swordsman':'samurai';
    t.selected=byId(id).index;
    const u=demo.recruit(t.side);if(u){u.x=t.side?1570+(i%6)*30:1230-(i%6)*30;u.y=120+Math.floor(i/6)*38;}
  }
  for(const t of demo.teams)t.auto=false;
  return demo;
}
let demo=makeDemo();

for(let side=0;side<2;side++){
  for(const d of UNITS){
    const button=document.createElement('button');button.className='unit-card';
    button.dataset.unit=d.index;button.dataset.side=side;
    button.dataset.unitId=d.id;
    button.title=d.trait||d.description;
    button.setAttribute('aria-label',`${side?'右方':'左方'} ${d.name}，${d.role}，${d.cost} 金币，${d.supply} 补给`);
    button.innerHTML=`<canvas width="120" height="108"></canvas><span class="unit-name">${d.name}</span><span class="price">${d.cost}</span>`;
    portrait(button.querySelector('canvas').getContext('2d'),d.visual,side,factionSkin(FACTIONS[side]));
    button.addEventListener('click',()=>{
      if(!battle||screen!=='battle'||(side===1&&battle.mode!=='local'))return;
      clickSound();battle.select(side,d.index);
      if(!battle.teams[side].auto)battle.recruit(side,{manual:true});
      inspect=d.index;burstUnitCard(side,d.index);updateHUD();
    });
    button.addEventListener('mouseenter',()=>{inspect=d.index;detail();});
    button.addEventListener('focus',()=>{inspect=d.index;detail();});
    $('roster'+side).append(button);
  }
}
for(const d of DIFFICULTIES){
  const button=document.createElement('button');button.dataset.difficulty=d.id;
  button.innerHTML=`<strong>${d.name}</strong><small>${d.subtitle}</small>`;
  button.onclick=()=>{clickSound();showMapPicker({mode:'single',difficulty:d.id});};$('difficulties').append(button);
}
function renderMapChoices(){
  const grid=$('map-grid');if(!grid)return;
  grid.replaceChildren();
  for(const map of MAPS){
    const button=document.createElement('button');button.className='map-option';button.dataset.mapId=map.id;button.setAttribute('aria-pressed',String(mapChoice.mapId===map.id));
    const weatherNames=map.weather.map(id=>WEATHER_BY_ID[id]?.name||id).join(' · ');
    button.innerHTML=`<span class="map-card-preview map-${map.id}"></span><strong>${map.name}</strong><small>${map.description}</small><em>天气：${weatherNames}</em>`;
    button.classList.toggle('selected',mapChoice.mapId===map.id);button.onclick=()=>{clickSound();mapChoice.mapId=map.id;renderMapChoices();};grid.append(button);
  }
}
function showMapPicker(options){
  mapChoice={mode:options.mode,difficulty:options.difficulty||'normal',mapId:MAP_BY_ID[options.mapId]?options.mapId:'grassland'};
  toggle('main-options',false);toggle('difficulty-options',false);toggle('map-options',true);toggle('faction-options',false);
  $('menu-card').classList.remove('faction-mode');$('menu-card').classList.add('map-mode');$('menu-overlay').classList.remove('faction-screen');$('menu-overlay').classList.add('map-screen');renderMapChoices();
}
function updateFactionFeature(side,selected,animate=false){
  const feature=$('faction-feature'+side),portraitEl=$('faction-flag'+side),leaderEl=$('faction-leader'+side);
  const apply=()=>{
    drawNationalFlag(portraitEl,selected);
    leaderEl.src=selected.leaderPortrait;leaderEl.alt=`${selected.ruler}画像`;
    $('faction-feature-name'+side).textContent=selected.name;$('faction-feature-ruler'+side).textContent=`领袖：${selected.ruler}`;$('faction-feature-base'+side).textContent=`大本营：${selected.baseName}`;$('faction-feature-description'+side).textContent=selected.description;
    feature.dataset.factionId=selected.id;feature.classList.remove('faction-feature-exit');feature.classList.add('faction-feature-enter');
    window.clearTimeout(feature._factionEnterTimer);feature._factionEnterTimer=window.setTimeout(()=>feature.classList.remove('faction-feature-enter'),380);
  };
  if(!animate){apply();return;}
  window.clearTimeout(feature._factionSwapTimer);window.clearTimeout(feature._factionEnterTimer);
  feature.classList.remove('faction-feature-enter');feature.classList.add('faction-feature-exit');
  feature._factionSwapTimer=window.setTimeout(apply,130);
}
function renderFactionChoices(){
  for(const side of [0,1]){
    const selected=FACTION_BY_ID[factionChoice[`faction${side}`]]||FACTIONS[side];
    const feature=$('faction-feature'+side),previous=feature.dataset.factionId;
    feature.style.setProperty('--faction-color',selected.accent);feature.style.setProperty('--faction-glow',selected.glow);
    updateFactionFeature(side,selected,Boolean(previous&&previous!==selected.id));
    const grid=$('faction-grid'+side);grid.replaceChildren();
    for(const faction of FACTIONS){
      const button=document.createElement('button');
      button.className='faction-option';button.dataset.factionId=faction.id;button.dataset.side=side;
      button.style.setProperty('--faction-color',faction.accent);button.style.setProperty('--faction-glow',faction.glow);
      button.setAttribute('aria-pressed',String(factionChoice[`faction${side}`]===faction.id));
      button.title=`${faction.ruler} · ${faction.emblem}`;
      button.innerHTML=`<canvas class="faction-card-flag" width="150" height="100"></canvas><b>${faction.name}</b>`;
      drawNationalFlag(button.querySelector('canvas'),faction);
      button.classList.toggle('selected',factionChoice[`faction${side}`]===faction.id);
      button.onclick=()=>{clickSound();factionChoice[`faction${side}`]=faction.id;renderFactionChoices();};
      grid.append(button);
    }
  }
  const red=FACTION_BY_ID[factionChoice.faction0],blue=FACTION_BY_ID[factionChoice.faction1];
  const relation=FACTION_RELATIONS[[red.id,blue.id].sort().join('|')];
  const summary=$('faction-summary');
  summary.innerHTML=relation?`<div class="relation-heading"><strong>${red.name} × ${blue.name}</strong><span>${relation.title}</span></div><p>${relation.story}</p>`:'';
  summary.classList.toggle('hidden',!relation);
  for(const side of [0,1]){
    const faction=FACTION_BY_ID[factionChoice[`faction${side}`]]||FACTIONS[side];
    document.querySelectorAll(`#roster${side} .unit-card canvas`).forEach((canvas,index)=>portrait(canvas.getContext('2d'),UNITS[index].visual,side,factionSkin(faction)));
  }
}
function bindFactionDepth(){
  document.querySelectorAll('.faction-feature').forEach(feature=>{
    if(feature.dataset.depthBound)return;
    feature.dataset.depthBound='1';
    const reset=()=>{
      feature.style.setProperty('--portrait-x','0px');feature.style.setProperty('--portrait-y','0px');
      feature.style.setProperty('--mist-x','0px');feature.style.setProperty('--mist-y','0px');
      feature.style.setProperty('--copy-x','0px');feature.style.setProperty('--copy-y','0px');
    };
    feature.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const rect=feature.getBoundingClientRect();
      const x=(event.clientX-rect.left)/Math.max(1,rect.width)-.5;
      const y=(event.clientY-rect.top)/Math.max(1,rect.height)-.5;
      feature.style.setProperty('--portrait-x',`${(x*7).toFixed(2)}px`);feature.style.setProperty('--portrait-y',`${(y*4).toFixed(2)}px`);
      feature.style.setProperty('--mist-x',`${(x*3).toFixed(2)}px`);feature.style.setProperty('--mist-y',`${(y*2).toFixed(2)}px`);
      feature.style.setProperty('--copy-x',`${(-x*1.8).toFixed(2)}px`);feature.style.setProperty('--copy-y',`${(-y*1.2).toFixed(2)}px`);
    });
    feature.addEventListener('pointerleave',reset);reset();
  });
}
bindFactionDepth();
function showFactionPicker(options){
  factionChoice={mode:options.mode,difficulty:options.difficulty||'normal',mapId:MAP_BY_ID[options.mapId]?options.mapId:(mapChoice.mapId||'grassland'),faction0:options.faction0||'roland',faction1:options.faction1||'azure'};
  toggle('main-options',false);toggle('difficulty-options',false);toggle('map-options',false);toggle('faction-options',true);$('menu-card').classList.remove('map-mode');$('menu-card').classList.add('faction-mode');$('menu-overlay').classList.remove('map-screen');$('menu-overlay').classList.add('faction-screen');
  $('faction-side1-label').textContent=options.mode==='local'?'玩家 02':'电脑';renderFactionChoices();
}
function detail(){
  const d=UNITS[inspect]||UNITS[0];
  const behavior=d.id==='mystery'?'随机召唤 · 每次出兵抽取一个实际兵种':d.range>30?`${d.role} · 位于近战线后 · 移动中持续攻击`:`${d.role} · 移速 ${d.speed}`;
  const combat=d.id==='mystery'?'<span>战斗属性 <b>随机抽取</b></span><span>抽取范围 <b>其他 13 种</b></span>':`<span>生命 <b>${d.hp}</b></span><span>护甲 <b>${d.armor}</b></span><span>对轻甲 <b>${d.lightDamage}</b></span><span>对重甲 <b>${d.heavyDamage}</b></span>`;
  const matchup=d.id==='mystery'?'抽取结果决定克制关系':`克制：${d.strength}<br>弱点：${d.weakness}`;
  $('unit-detail').innerHTML=`<div class="detail-title"><strong>${d.name}</strong><small>${d.stage} · ${d.combatClass}</small></div><p>${behavior}</p><p class="detail-matchup">${matchup}</p><div class="detail-stats">${combat}<span>攻击间隔 <b>${d.id==='mystery'?'随机':d.interval+'s'}</b></span><span>存活收益 <b>+${d.income}</b></span></div><div class="detail-foot">${d.cost} 金币 / ${d.en} · ${d.supply} 补给</div>`;
}
function start(options){
  lastOptions={...options};battle=new Battle(lastOptions);screen='battle';accumulator=0;inspect=0;
  sound.setScene('battle');
  lastGold=[null,null];lastIncome=[null,null];lastCastleHp=[null,null];lastSpawnSource=[null,null];
  for(const id of ['menu','pause','help','result'])toggle(id+'-overlay',false);
  $('menu-card').classList.remove('faction-mode','map-mode');$('menu-overlay').classList.remove('faction-screen','map-screen');toggle('map-options',false);toggle('faction-options',false);
  renderer.focus(battle);renderer.draw(battle);updateHUD();wave('战役开始\n首轮出兵准备中');
  // Keyboard control always belongs to the battlefield after starting a match.
  document.activeElement?.blur();
}
function menu(){
  screen='menu';if(battle)battle.paused=true;
  sound.setScene('menu');
  for(const id of ['pause','help','result'])toggle(id+'-overlay',false);
  toggle('menu-overlay',true);toggle('main-options',true);toggle('difficulty-options',false);toggle('map-options',false);toggle('faction-options',false);$('menu-card').classList.remove('faction-mode','map-mode');$('menu-overlay').classList.remove('faction-screen','map-screen');
  renderer.follow=true;demo=makeDemo();renderer.focus(demo);
}
function pause(){
  if(screen!=='battle'||!battle||battle.winner!==null)return;
  battle.paused=true;screen='pause';toggle('pause-overlay',true);updateHUD();
}
function resume(){
  if(!battle||battle.winner!==null)return;
  battle.paused=false;screen='battle';toggle('pause-overlay',false);accumulator=0;updateHUD();
}
function help(){
  helpReturn={screen,paused:battle?.paused};
  if(battle)battle.paused=true;
  screen='help';toggle('help-overlay',true);
}
function closeHelp(){
  toggle('help-overlay',false);screen=helpReturn?.screen||'menu';
  if(battle)battle.paused=helpReturn?.paused??false;
  helpReturn=null;accumulator=0;
}
function result(){
  screen='result';toggle('result-overlay',true);
  const winnerFaction=battle.winner==='draw'?null:FACTION_BY_ID[battle.teams[battle.winner]?.faction];
  const name=battle.winner==='draw'?'双方平局':`${winnerFaction?.name||'胜方'}获胜`;
  $('result-title').textContent=name;
  $('result-subtitle').textContent=`${formatTime(battle.time)} 的鏖战 · 第 ${battle.round} 回合`;
  const [r,b]=battle.teams;
  const rf=FACTION_BY_ID[r.faction],bf=FACTION_BY_ID[b.faction];
  $('result-stats').innerHTML=`<table><thead><tr><th>战役记录</th><th>${rf.name}</th><th>${bf.name}</th></tr></thead><tbody><tr><th>招募士兵</th><td>${r.spawned}</td><td>${b.spawned}</td></tr><tr><th>击败敌军</th><td>${r.kills}</td><td>${b.kills}</td></tr><tr><th>最终收入</th><td>${r.income}</td><td>${b.income}</td></tr><tr><th>大本营余量</th><td>${r.hp}</td><td>${b.hp}</td></tr></tbody></table>`;
  sound.end(battle.winner===0||battle.mode==='local');updateHUD();
}
function wave(message,kind='notice'){$('wave-message').textContent=message;$('wave-message').classList.toggle('countdown-message',kind==='countdown');waveUntil=performance.now()+2400;$('wave-message').classList.add('show');}
function sourceName(source){return source==='camp'?'前置城墙':'大本营';}
function sourceForRound(b,side,round){const t=b.teams[side];return round%2===1&&t.camp.hp>0?'camp':'castle';}
function spawnWarning(b){
  const opening=b.round===1&&b.time<8;
  const seconds=opening?Math.max(...b.teams.map(t=>t.spawnClock)):b.remaining;
  const active=screen==='battle'&&seconds>0&&seconds<=5;
  const round=opening?b.round:b.round+1;
  return {active,seconds:Math.ceil(seconds),round,sources:b.teams.map(t=>sourceForRound(b,t.side,round))};
}
function roundSourceNotice(b,round=b.round,sources=b.teams.map(t=>({side:t.side,source:b.spawnSource(t.side)}))){
  const bySide=Object.fromEntries(sources.map(item=>[item.side,item.source]));
  return `第 ${round} 回合出兵\n${FACTION_BY_ID[b.teams[0].faction].name}：${sourceName(bySide[0])}　${FACTION_BY_ID[b.teams[1].faction].name}：${sourceName(bySide[1])}`;
}
function focusCombat(){if(screen==='battle'&&battle){renderer.focus(battle);wave('镜头已锁定交战区域');updateHUD();}}
function formatTime(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
function updateHUD(){
  const b=screen==='menu'||(screen==='help'&&helpReturn?.screen==='menu')?demo:battle||demo;
  const warning=spawnWarning(b);
  for(const t of b.teams){
    const s=t.side;
    const faction=FACTION_BY_ID[t.faction]||FACTION_BY_ID.roland;
    const teamLabel=s===0?'PLAYER 01':(b.mode==='local'?'PLAYER 02':'COMPUTER');
    const role=$(`${s?'blue':'red'}-role`);role.textContent=`${faction.name} · ${teamLabel}`;role.style.color=faction.accent;
    $(`${s?'blue':'red'}-faction-name`).textContent=faction.name;
    $(`${s?'blue':'red'}-roster-name`).textContent=`${faction.name}军团`;
    const heading=role.parentElement;heading.style.setProperty('--team-accent',faction.accent);heading.style.setProperty('--team-glow',faction.glow);
    const hud=role.closest('.team-hud');hud.style.setProperty('--team-accent',faction.accent);hud.style.setProperty('--team-glow',faction.glow);
    const rosterPanel=$('roster'+s).closest('.roster-panel');rosterPanel.style.setProperty('--team-accent',faction.accent);rosterPanel.style.setProperty('--team-glow',faction.glow);
    const previousHp=lastCastleHp[s];
    $('hp'+s).textContent=`${Math.ceil(t.hp)} / ${RULES.castleHP}`;
    $('health'+s).style.width=`${Math.max(0,t.hp/RULES.castleHP*100)}%`;
    showCastleDamage(s,previousHp,t.hp);
    lastCastleHp[s]=t.hp;
    const fieldSource=$('field-source'+s);
    const nextSource=warning.active?warning.sources[s]:b.spawnSource(s),barrageCooldown=Math.ceil(t.camp.barrageCooldown||0);
    const barrageText=t.camp.hp<=0?'万箭：城墙失守':barrageCooldown>0?`万箭：${barrageCooldown}s`:'万箭：待命';
    const sourceText=`${faction.name}下次出兵：${sourceName(nextSource)} · ${barrageText}`;
    if(lastSpawnSource[s]!==null&&lastSpawnSource[s]!==nextSource)pulseElement(fieldSource,'source-update');
    fieldSource.textContent=sourceText;lastSpawnSource[s]=nextSource;
    fieldSource.style.color=faction.accent;fieldSource.style.setProperty('--team-accent',faction.accent);fieldSource.style.setProperty('--team-glow',faction.glow);
    fieldSource.classList.toggle('lost',nextSource==='camp'&&t.camp.hp<=0);
    fieldSource.classList.toggle('spawn-warning',warning.active);
    const alertSource=$('spawn-alert-source'+s);alertSource.textContent=sourceName(warning.sources[s]);alertSource.style.setProperty('--team-accent',faction.accent);alertSource.style.setProperty('--team-glow',faction.glow);
    const previousGold=lastGold[s],currentGold=Math.floor(t.gold),goldDelta=previousGold===null?0:currentGold-previousGold;
    const previousIncome=lastIncome[s],currentIncome=Math.floor(t.income);
    const availableSupply=b.availableSupply(s);
    $(`gold${s}`).textContent=currentGold;$(`income${s}`).textContent=currentIncome;$(`supply${s}`).textContent=availableSupply;
    if(previousGold!==null&&goldDelta!==0){pulseElement($(`gold${s}`));floatResource(s,`${goldDelta>0?'+':''}${goldDelta}`,goldDelta>0?'gain':'loss');}
    if(previousIncome!==null&&currentIncome!==previousIncome)pulseElement($(`income${s}`),'income-pulse');
    lastGold[s]=currentGold;lastIncome[s]=currentIncome;
    $('income-breakdown'+s).textContent=`(${Math.floor(t.baseIncome)}+${Math.floor(t.armyIncome)})`;
    $('income-breakdown'+s).title=`大本营 ${Math.floor(t.baseIncome)} + 存活部队 ${Math.floor(t.armyIncome)}`;
    $('supply-cap'+s).textContent=`/${RULES.roundSupply}`;
    $(`supply${s}`).title=`当前可招募补给：${availableSupply}；已包含每轮补给和${RULES.unitCap}名存活单位上限`;
    $('auto'+s).textContent=t.auto?'暂停出兵':'继续出兵';$('auto'+s).classList.toggle('off',!t.auto);
    $('auto'+s).disabled=s===1&&b.mode==='single';
    const bombard=$('bombard'+s),cooldown=Math.ceil(t.bombardCooldown||0);
    bombard.style.setProperty('--cooldown-progress',`${Math.max(0,Math.min(100,(cooldown/(RULES.bombardCooldown||80))*100))}%`);
    bombard.textContent=cooldown>0?`区域火炮 · ${cooldown}s`:`区域火炮 · ${RULES.bombardCost}`;
    bombard.disabled=(s===1&&b.mode==='single')||cooldown>0||t.gold<RULES.bombardCost||screen!=='battle';
    bombard.classList.toggle('ready',cooldown<=0&&t.gold>=RULES.bombardCost&&screen==='battle');
    const nuke=$('nuke'+s),nukeCost=RULES.nukeCosts[t.nukesUsed];
    nuke.textContent=nukeCost===undefined?'核弹 · 已用完':`核弹 ${t.nukesUsed+1}/${RULES.nukeMaxUses} · ${nukeCost}`;
    nuke.title=nukeCost===undefined?'核弹次数已用完':`第 ${t.nukesUsed+1} 次核弹：${nukeCost} 金币；引爆时消灭全场单位，污染区持续五回合`;
    nuke.disabled=(s===1&&b.mode==='single')||nukeCost===undefined||t.gold<nukeCost||screen!=='battle';
    nuke.classList.toggle('ready',nukeCost!==undefined&&t.gold>=nukeCost&&screen==='battle');
    $('roster'+s).querySelectorAll('button').forEach((button,i)=>{
      button.classList.toggle('selected',t.selected===i);
      button.classList.toggle('enemy-selected',s===1&&t.selected===i);
      button.style.setProperty('--faction-color',faction.accent);
      button.classList.toggle('unaffordable',t.gold<UNITS[i].cost||availableSupply<UNITS[i].supply);
      button.disabled=s===1&&b.mode==='single';
      button.setAttribute('aria-pressed',String(t.selected===i));
    });
  }
  $('countdown').textContent=Math.ceil(b.remaining);$('countdown').classList.toggle('warning',warning.active);$('round').textContent=`第 ${b.round} 回合`;
  $('spawn-alert-count').textContent=warning.seconds;$('spawn-alert').classList.toggle('show',warning.active);
  $('mode-label').textContent=b.mode==='local'?'本地双人':`${b.difficulty.name}难度`;
  $('blue-keys').textContent=b.mode==='local'?'↑ ← ↓ → 选兵':'AI 指挥中';
  $('army-count').textContent=`${FACTION_BY_ID[b.teams[0].faction].name} ${b.units.filter(u=>u.side===0&&u.hp>0).length}/${RULES.unitCap}　·　${FACTION_BY_ID[b.teams[1].faction].name} ${b.units.filter(u=>u.side===1&&u.hp>0).length}/${RULES.unitCap}`;
  $('elapsed').textContent=formatTime(b.time);
  $('center-btn').textContent=renderer.follow?'◎ 跟随战线 [F]':'◎ 返回交战区 [F]';
  const mapName=MAP_BY_ID[b.mapId]?.name||MAP_BY_ID.grassland.name;
  const weatherName=b.weather?.name||'晴朗';
  $('field-status').textContent=renderer.follow?`${mapName} · ${weatherName} · 跟随交战`:`自由观察 · ${mapName} · ${weatherName}`;
  $('sound-btn').textContent=sound.enabled?'声音 · 开':'声音 · 关';
  $('speed-btn').textContent=speed+'×';detail();
}

function showMainOptions(){toggle('main-options',true);toggle('difficulty-options',false);toggle('map-options',false);toggle('faction-options',false);$('menu-card').classList.remove('faction-mode','map-mode');$('menu-overlay').classList.remove('faction-screen','map-screen');}
$('single-btn').onclick=()=>{clickSound();toggle('main-options',false);toggle('difficulty-options',true);toggle('map-options',false);toggle('faction-options',false);};
$('difficulty-back').onclick=()=>{clickSound();showMainOptions();};
$('multi-btn').onclick=()=>{clickSound();showMapPicker({mode:'local',difficulty:'normal'});};
$('map-continue').onclick=()=>{clickSound();showFactionPicker({mode:mapChoice.mode,difficulty:mapChoice.difficulty,mapId:mapChoice.mapId});};
$('map-back').onclick=()=>{clickSound();if(mapChoice.mode==='single'){showMainOptions();toggle('difficulty-options',true);toggle('main-options',false);}else showMainOptions();};
$('faction-start').onclick=()=>{clickSound();start(factionChoice);};
$('faction-back').onclick=()=>{clickSound();showMapPicker({mode:factionChoice.mode,difficulty:factionChoice.difficulty,mapId:factionChoice.mapId});};
$('pause-btn').onclick=pause;$('resume-btn').onclick=resume;
$('restart-btn').onclick=()=>start(lastOptions);$('again-btn').onclick=()=>start(lastOptions);
for(const id of ['pause-menu-btn','result-menu-btn'])$(id).onclick=menu;
$('menu-btn').onclick=menu;
for(const id of ['help-btn','menu-help-btn'])$(id).onclick=help;
$('help-close').onclick=closeHelp;
$('center-btn').onclick=focusCombat;
$('speed-btn').onclick=()=>{speed=speed===3?1:speed+1;updateHUD();};
$('sound-btn').onclick=()=>{sound.unlock();sound.setEnabled(!sound.enabled);save();updateHUD();};
$('fullscreen-btn').onclick=()=>{if(window.desktop)window.desktop.fullscreen();else if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();};
$('quit-btn').onclick=()=>{if(window.desktop)window.desktop.quit();else window.close();};
if(!window.desktop){
  document.body.classList.add('web-app');
  $('quit-btn').classList.add('hidden');
  if(!document.fullscreenEnabled)$('fullscreen-btn').classList.add('hidden');
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))
    navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('离线缓存注册失败',error));
}
for(let side=0;side<2;side++)$('auto'+side).onclick=()=>{
  if(!battle||screen!=='battle'||(side===1&&battle.mode!=='local'))return;
  battle.teams[side].auto=!battle.teams[side].auto;clickSound();updateHUD();
};
for(let side=0;side<2;side++)$('bombard'+side).onclick=()=>{
  if(!battle||screen!=='battle'||(side===1&&battle.mode!=='local'))return;
  if(battle.bombard(side)){clickSound();wave(`${FACTION_BY_ID[battle.teams[side].faction].name}区域火炮轰炸交战区`);updateHUD();}else clickSound();
};
for(let side=0;side<2;side++)$('nuke'+side).onclick=()=>{
  if(!battle||screen!=='battle'||(side===1&&battle.mode!=='local'))return;
  if(battle.launchNuke(side)){clickSound();wave(`${FACTION_BY_ID[battle.teams[side].faction].name}发射核弹 · 预计五秒后引爆`);updateHUD();}else clickSound();
};

let drag=null;
$('battle').addEventListener('pointerdown',e=>{
  if(screen!=='battle'||e.button!==0)return;
  drag={x:e.clientX,camera:renderer.camera};renderer.follow=false;$('battle').setPointerCapture(e.pointerId);updateHUD();
});
$('battle').addEventListener('pointermove',e=>{if(drag)renderer.setCamera(drag.camera-(e.clientX-drag.x)*$('battle').width/$('battle').clientWidth);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('battle').addEventListener(name,()=>{drag=null;});
let mapDragging=false;
function mapMove(e){const bounds=$('minimap').getBoundingClientRect();renderer.follow=false;renderer.setCamera((e.clientX-bounds.left)/bounds.width*RULES.width-$('battle').width/2);updateHUD();}
$('minimap').addEventListener('pointerdown',e=>{if(screen!=='battle'||e.button!==0)return;mapDragging=true;$('minimap').setPointerCapture(e.pointerId);mapMove(e);});
$('minimap').addEventListener('pointermove',e=>{if(mapDragging)mapMove(e);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('minimap').addEventListener(name,()=>{mapDragging=false;});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.altKey||e.metaKey)return;
  const key=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
  if(key==='escape'){
    if(screen==='help')closeHelp();else if(screen==='pause')resume();else if(screen==='battle')pause();
    else if(screen==='menu'){$('difficulty-back').click();}return;
  }
  if(key===' '){if(e.repeat)return;if(screen==='battle')pause();else if(screen==='pause')resume();return;}
  if(screen!=='battle'||!battle)return;
  if(key==='f'){focusCombat();return;}
  const redKeys={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};
  const blueKeys={arrowup:[0,-1],arrowleft:[-1,0],arrowdown:[0,1],arrowright:[1,0]};
  const side=key in redKeys?0:key in blueKeys?1:-1;
  if(side<0||(side===1&&battle.mode!=='local'))return;
  const delta=(side?blueKeys:redKeys)[key],old=battle.teams[side].selected;
  const col=(old%ROSTER_COLUMNS+delta[0]+ROSTER_COLUMNS)%ROSTER_COLUMNS,row=(Math.floor(old/ROSTER_COLUMNS)+delta[1]+2)%2;
  const next=row*ROSTER_COLUMNS+col;
  battle.select(side,next);inspect=next;burstUnitCard(side,next);sound.click();updateHUD();
});

function frame(now){
  const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
  if(screen==='menu'){
    accumulator+=dt;
    while(accumulator>=RULES.step){demo.tick();accumulator-=RULES.step;}
    if(demo.time>28||demo.units.filter(u=>u.hp>0).length<15)demo=makeDemo();
    renderer.draw(demo,dt);
  }else if(battle){
    if(screen==='battle'){
      accumulator+=dt*speed;
      while(accumulator>=RULES.step){
        battle.tick();accumulator-=RULES.step;
        for(const event of battle.events){if(event.type==='round'){wave(roundSourceNotice(battle,event.round,event.sources));sound.round();}else if(event.type==='weather'){wave(`天气转为：${WEATHER_BY_ID[event.weather]?.name||event.weather}`);}else if(event.type==='bombard'){wave(`${FACTION_BY_ID[battle.teams[event.side].faction].name}区域火炮轰炸交战区`);}else if(event.type==='nuke-detonated'){wave(`核爆冲击全场 · 污染区持续 ${RULES.nukePollutionRounds} 回合`);}else if(event.type==='camp-barrage'){wave(`${FACTION_BY_ID[battle.teams[event.side].faction].name}前置城墙万箭齐发`);}else if(event.type==='camp-destroyed'){wave(`${FACTION_BY_ID[battle.teams[event.side].faction].name}前置城墙被摧毁`);}else if(event.type==='camp-rebuilt'){wave(`${FACTION_BY_ID[battle.teams[event.side].faction].name}前置城墙已重建`);}else if(event.type==='end')result();}
        if(battle.winner!==null){accumulator=0;break;}
      }
      sound.setWeather(battle.weather);
      sound.update(dt,battle);
    }
    renderer.draw(battle,screen==='battle'?dt:0);
  }
  if(now>waveUntil)$('wave-message').classList.remove('show');
  hudClock+=dt;if(hudClock>.15){updateHUD();hudClock=0;}
  requestAnimationFrame(frame);
}
detail();updateHUD();requestAnimationFrame(frame);
// Read-only handle for development and automated integration checks.
Object.defineProperty(window,'game',{value:{get battle(){return battle;},get screen(){return screen;},renderer},writable:false});
