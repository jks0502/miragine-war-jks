import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,localEnvironment} from './environment.mjs';
const env=localEnvironment();
const {_electron}=await import('playwright');
const require=createRequire(import.meta.url);
const executableIndex=process.argv.indexOf('--executable');
const packagedExecutable=executableIndex>=0?path.resolve(process.argv[executableIndex+1]):path.join(root,'dist','MiragineWar-win32-x64','MiragineWar.exe');
const executablePath=process.argv.includes('--packaged')?packagedExecutable:require('electron');
const errors=[],checks=[];
const output=path.join(root,'artifacts');fs.mkdirSync(output,{recursive:true});
const app=await _electron.launch({executablePath,args:process.argv.includes('--packaged')?[]:[root],cwd:root,env,timeout:30000});
try{
  const page=await app.firstWindow();
  page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.game?.screen==='menu');
  await page.screenshot({path:path.join(output,'01-menu.png')});
  await page.click('#single-btn');await page.click('[data-difficulty="normal"]');
  assert.equal(await page.locator('#map-grid .map-option').count(),3);
  await page.click('#map-grid [data-map-id="swamp"]');
  await page.click('#map-continue');
  assert.match(await page.locator('#faction-summary').textContent(),/罗兰王国/);
  assert.match(await page.locator('#faction-summary').textContent(),/王室借贷与海上盟约/);
  checks.push('faction picker displays the selected countries relationship story');
  await page.click('#faction-start');
  await page.waitForFunction(()=>window.game.battle.units.length>5);
  assert.deepEqual(await page.evaluate(()=>window.game.battle.teams.map(t=>t.faction)),['roland','azure']);
  assert.equal(await page.evaluate(()=>window.game.battle.mapId),'swamp');
  assert.match(await page.locator('#field-status').textContent(),/灰雾沼泽/);
  assert.equal(await page.locator('.camp-status').count(),0);
  assert.match(await page.locator('#field-source0').textContent(),/罗兰王国下次出兵：前置城墙/);
  assert.match(await page.locator('#field-source1').textContent(),/蓝海共和国下次出兵：前置城墙/);
  assert.equal((await page.locator('#supply-cap0').textContent()).trim(),'/30');
  assert.match(await page.locator('#income-breakdown0').textContent(),/^\(\d+\+\d+\)$/);
  checks.push('next spawn locations are shown below Miragine Plains on both sides');
  checks.push('HUD explains base plus living-army income and the 30-supply wave cap');
  checks.push('single-player starts and automatically recruits both armies');
  await page.click('#roster0 [data-unit-id="swordsman"]');
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].selected),Number(await page.locator('#roster0 [data-unit-id="swordsman"]').getAttribute('data-unit')));
  checks.push('mouse selects a unit');
  await page.keyboard.press('Space');
  const paused=await page.evaluate(()=>window.game.battle.time);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.game.battle.time),paused);
  await page.click('#resume-btn');
  checks.push('pause freezes the match and resume works');
  // Deterministically advance actual production and combat to a visually inspectable battle.
  await page.evaluate(()=>{for(let i=0;i<1800;i++)window.game.battle.tick();});
  await page.keyboard.press('f');
  await page.screenshot({path:path.join(output,'02-battle.png')});
  const bounds=await page.locator('#minimap').boundingBox();
  await page.mouse.click(bounds.x+5,bounds.y+bounds.height/2);
  assert.equal(await page.evaluate(()=>window.game.renderer.follow),false);
  assert.equal(await page.evaluate(()=>window.game.renderer.camera),0);
  checks.push('minimap click releases camera follow and reaches the left base');
  await page.keyboard.press('f');
  const focus=await page.evaluate(()=>({follow:window.game.renderer.follow,camera:window.game.renderer.camera,
    wanted:Math.max(0,Math.min(window.game.renderer.maxCamera,window.game.renderer.cameraController.anchor-640))}));
  assert.equal(focus.follow,true);assert.ok(Math.abs(focus.camera-focus.wanted)<4);
  checks.push('F instantly centers the fight and locks camera tracking');
  const cameraStability=await page.evaluate(()=>{
    const r=window.game.renderer,camera=new r.cameraController.constructor(r.cameraController.worldWidth,r.canvas.width);
    const fake={time:30,units:[]};
    for(let i=0;i<10;i++)fake.units.push({id:i*2,side:0,hp:100,x:900+i*18,lastCombat:30},{id:i*2+1,side:1,hp:100,x:1300-i*18,lastCombat:30});
    camera.focus(fake);
    const still=[];
    for(let frame=0;frame<120;frame++){
      const offset=frame%2?7:-7;for(const u of fake.units)u.x+=offset;
      camera.update(fake,1/60);still.push(camera.position);
      for(const u of fake.units)u.x-=offset;
    }
    for(const u of fake.units)u.x+=300;
    const moving=[];for(let frame=0;frame<90;frame++){camera.update(fake,1/60);moving.push(camera.position);}
    return {stillSpread:Math.max(...still)-Math.min(...still),steps:moving.slice(1).map((x,i)=>x-moving[i])};
  });
  assert.ok(cameraStability.stillSpread<.01);
  assert.ok(cameraStability.steps.every(step=>step>=0&&step<=5.01));
  checks.push('camera follow ignores small front-line jitter and moves with bounded smooth steps');
  const currentFightOnly=await page.evaluate(()=>{
    const r=window.game.renderer,camera=new r.cameraController.constructor(r.cameraController.worldWidth,r.canvas.width);
    const fake={time:30,units:[{id:1,side:0,hp:100,x:900,combatTarget:2},{id:2,side:1,hp:100,x:1300,combatTarget:1}]};
    camera.focus(fake);
    const held=[];for(let frame=0;frame<60;frame++){fake.units[0].x+=3;fake.units[1].x+=3;camera.update(fake,1/60);held.push(camera.position);}
    fake.units[0].lastCombat=30;fake.units[1].lastCombat=30;
    fake.units[0].cameraTarget={id:2};fake.units[1].cameraTarget={id:1};
    camera.focus(fake);
    const active=[];for(let frame=0;frame<60;frame++){fake.units[0].x+=3;fake.units[1].x+=3;camera.update(fake,1/60);active.push(camera.position);}
    return {heldSpread:Math.max(...held)-Math.min(...held),activeMove:active.at(-1)-active[0]};
  });
  assert.ok(currentFightOnly.heldSpread<.01);assert.ok(currentFightOnly.activeMove>0);
  checks.push('camera holds the current anchor between fights and follows only active exchanges');
  const survivingAdvance=await page.evaluate(()=>{
    const r=window.game.renderer,camera=new r.cameraController.constructor(r.cameraController.worldWidth,r.canvas.width);
    const fake={time:40,units:[{id:1,side:0,hp:100,x:1500,lastCombat:40},{id:2,side:0,hp:100,x:1660,lastCombat:40},{id:3,side:1,hp:100,x:1510,lastCombat:40}]};
    camera.focus(fake);camera.setPosition(0);fake.units[2].hp=0;
    camera.update(fake,1/60);
    const after=camera.position;
    for(let frame=0;frame<120;frame++)camera.update(fake,1/60);
    return {after,later:camera.position,wanted:Math.max(0,Math.min(camera.maxPosition,1660-r.canvas.width/2))};
  });
  assert.ok(survivingAdvance.after<survivingAdvance.wanted);
  assert.ok(survivingAdvance.later>survivingAdvance.after);
  assert.ok(Math.abs(survivingAdvance.later-survivingAdvance.wanted)<110);
  checks.push('camera smoothly centers the surviving formation after the opposing army is wiped out');
  const field=await page.locator('#battle').boundingBox();
  await page.mouse.move(field.x+field.width*.5,field.y+field.height*.5);await page.mouse.down();
  await page.mouse.move(field.x+field.width*.65,field.y+field.height*.5,{steps:8});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.game.renderer.follow),false);
  checks.push('battlefield mouse drag releases tracking and moves the camera');
  await page.keyboard.press('f');
  await page.click('#help-btn');assert.equal(await page.evaluate(()=>window.game.screen),'help');
  await page.click('#help-close');assert.equal(await page.evaluate(()=>window.game.screen),'battle');
  checks.push('help returns to the same match');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.evaluate(()=>window.game.battle.paused),false);
  checks.push('window blur does not auto-pause the match');
  await page.evaluate(()=>{window.game.battle.round=1;window.game.battle.time=9;window.game.battle.remaining=4;});
  await page.waitForFunction(()=>document.querySelector('#countdown').classList.contains('warning'));
  assert.equal(await page.locator('#spawn-alert').evaluate(node=>node.classList.contains('show')),true);
  assert.equal((await page.locator('#spawn-alert-count').textContent()).trim(),'4');
  assert.equal(await page.locator('.field-source.spawn-warning').count(),2);
  assert.match(await page.locator('#spawn-alert-source0').textContent(),/大本营/);
  assert.match(await page.locator('#spawn-alert-source1').textContent(),/大本营/);
  await page.screenshot({path:path.join(output,'05-spawn-warning.png')});
  await page.evaluate(()=>{window.game.battle.remaining=12;});
  await page.waitForFunction(()=>!document.querySelector('#spawn-alert').classList.contains('show'));
  checks.push('every wave uses a large five-second alert and shakes both upcoming spawn locations');
  await page.evaluate(()=>{
    const b=window.game.battle,kind=Number(document.querySelector('#roster0 [data-unit-id="newbie"]').dataset.unit);
    b.winner=null;b.units=[];b.pendingBombards=[];b.effects=[];
    for(const t of b.teams){t.auto=true;t.selected=kind;t.gold=2520;t.supply=30;t.bombardCooldown=0;}
    const left=b.recruit(0),right=b.recruit(1);
    Object.assign(left,{x:3100,y:250,engaged:true,combatTarget:right.id});
    Object.assign(right,{x:3110,y:250,engaged:true,combatTarget:left.id});
    b.teams[0].auto=false;
  });
  await page.waitForTimeout(200);
  await page.evaluate(()=>{window.game.battle.paused=false;if(!window.game.battle.bombard(0))throw new Error('area artillery should be available');});
  assert.ok(await page.evaluate(()=>window.game.battle.teams[0].bombardCooldown>79));
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].gold),500);
  await page.evaluate(()=>window.game.battle.tick());
  assert.ok(await page.evaluate(()=>window.game.battle.effects.some(e=>e.type==='bombard')));
  await page.waitForFunction(()=>window.game.renderer.shakeTime>0);
  await page.evaluate(()=>{window.game.battle.teams[0].auto=true;});
  checks.push('area artillery skill button spends 2000 gold and queues an engagement-area strike');
  await page.click('#auto0');assert.equal(await page.evaluate(()=>window.game.battle.teams[0].auto),false);
  const recruitmentPaused=await page.evaluate(()=>({time:window.game.battle.time,spawned:window.game.battle.teams[0].spawned}));
  const afterPause=await page.evaluate(()=>{window.game.battle.tick();return {time:window.game.battle.time,spawned:window.game.battle.teams[0].spawned};});
  assert.ok(afterPause.time>recruitmentPaused.time);assert.equal(afterPause.spawned,recruitmentPaused.spawned);
  await page.evaluate(()=>{
    const b=window.game.battle;b.pendingBombards=[];b.teams[1].auto=false;
    for(const u of b.units){u.hp=u.maxHp=1000;u.cooldown=Infinity;u.moving=false;}
  });
  await page.click('#nuke0');
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].nukesUsed),1);
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].gold),0);
  assert.match(await page.locator('#nuke0').textContent(),/2\/3 · 18888/);
  await page.evaluate(()=>{for(let i=0;i<155;i++)window.game.battle.tick();});
  assert.equal(await page.evaluate(()=>window.game.battle.units.filter(u=>u.hp>0).length),0);
  assert.equal(await page.evaluate(()=>window.game.battle.contaminatedZones.length),1);
  await page.evaluate(()=>{
    const b=window.game.battle;b.paused=true;
    document.querySelector('#spawn-alert').style.display='none';
    document.querySelector('#wave-message').style.display='none';
  });
  await page.screenshot({path:path.join(output,'06-nuclear-blast.png')});
  checks.push('nuclear button escalates price, kills all deployed units after its visible five-second descent, and leaves contamination');
  await page.evaluate(()=>{const b=window.game.battle;b.units=[];b.teams[0].gold=500;b.teams[0].supply=30;});
  const beforeManual=await page.evaluate(()=>window.game.battle.teams[0].spawned);
  await page.click('#roster0 [data-unit-id="newbie"]');
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].spawned),beforeManual+1);
  checks.push('a paused player can manually recruit from a unit card when gold and supply are sufficient');
  await page.click('#auto0');assert.equal(await page.evaluate(()=>window.game.battle.teams[0].auto),true);
  checks.push('pause recruitment without pausing the game and resume it');
  await page.click('#sound-btn');await page.click('#sound-btn');
  await page.click('#fullscreen-btn');await page.waitForTimeout(250);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isFullScreen()),true);
  await page.keyboard.press('F11');
  checks.push('fullscreen toggle and F11 work');
  await page.keyboard.press('Space');await page.click('#pause-menu-btn');await page.click('#multi-btn');
  assert.equal(await page.locator('#map-grid .map-option').count(),3);
  await page.click('#map-continue');
  await page.click('#faction-grid0 [data-faction-id="north"]');await page.click('#faction-grid1 [data-faction-id="blackstone"]');await page.click('#faction-start');
  assert.deepEqual(await page.evaluate(()=>window.game.battle.teams.map(t=>t.faction)),['north','blackstone']);
  await page.keyboard.press('d');await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.evaluate(()=>window.game.battle.teams.map(t=>t.selected)),[1,1]);
  await page.click('#roster1 [data-unit-id="cavalry"]');assert.equal(await page.evaluate(()=>window.game.battle.teams[1].selected),Number(await page.locator('#roster1 [data-unit-id="cavalry"]').getAttribute('data-unit')));
  checks.push('local multiplayer supports independent keyboard and mouse selection');
  await page.evaluate(()=>{window.game.battle.teams[1].hp=0;});
  await page.waitForFunction(()=>window.game.screen==='result');
  await page.screenshot({path:path.join(output,'03-result.png')});
  await page.click('#again-btn');assert.equal(await page.evaluate(()=>window.game.battle.round),1);
  checks.push('victory screen displays and rematch resets all match state');
  const tactics=await page.evaluate(()=>{
    const b=window.game.battle;b.units=[];b.effects=[];
    for(const t of b.teams){t.auto=false;t.shot=Infinity;}
    function add(side,kind,x){
      const t=b.teams[side];t.gold=10000;t.supply=60;t.selected=kind;t.auto=true;
      const u=b.recruit(side);t.auto=false;Object.assign(u,{x,y:250,cooldown:0});return u;
    }
    const kind=id=>Number(document.querySelector(`#roster0 [data-unit-id="${id}"]`).dataset.unit);
    const mage=add(0,kind('mage'),900),enemy=add(1,kind('heavy'),1240);
    enemy.hp=enemy.maxHp=100000;enemy.cooldown=Infinity;
    let shots=0,previous=mage.lastCombat,facingStable=true;
    for(let i=0;i<300;i++){
      b.tick();
      if(mage.lastCombat!==previous){shots++;previous=mage.lastCombat;}
      facingStable&&=mage.heading===1;
    }
    b.units=[];b.effects=[];
    const kiter=add(0,kind('mage'),900),chaser=add(1,kind('heavy'),940);
    chaser.hp=chaser.maxHp=100000;chaser.cooldown=Infinity;
    const initialGap=chaser.x-kiter.x;let movingShots=0;previous=kiter.lastCombat;
    for(let i=0;i<150;i++){
      b.tick();
      if(kiter.lastCombat!==previous){if(kiter.tactic==='kite')movingShots++;previous=kiter.lastCombat;}
    }
    b.units=[];b.effects=[];
    const archer=add(0,kind('samurai'),4000),front=add(0,kind('zombie'),4090),wall=b.teams[1].camp;
    wall.hp=wall.maxHp=100000;wall.shot=Infinity;
    let formationHeld=true;
    for(let i=0;i<300;i++){b.tick();formationHeld&&=front.x-archer.x>=51;}
    return {sustained:shots>=4,facingStable,kites:chaser.x-kiter.x>initialGap+20,movingFire:movingShots>=2,formationHeld};
  });
  assert.deepEqual(tactics,{sustained:true,facingStable:true,kites:true,movingFire:true,formationHeld:true});
  checks.push('ranged troops stay behind melee, sustain fire, and shoot while kiting');
  const denseCombat=await page.evaluate(()=>{
    const b=window.game.battle;b.units=[];b.effects=[];
    for(const t of b.teams){t.auto=false;t.shot=Infinity;t.gold=100000;t.supply=500;}
    const kind=Number(document.querySelector('#roster0 [data-unit-id="swordsman"]').dataset.unit);
    const units=[];
    for(const side of [0,1])for(let i=0;i<14;i++){
      const t=b.teams[side];t.selected=kind;t.auto=true;const u=b.recruit(side);t.auto=false;
      Object.assign(u,{x:side?2050:1950,y:145+(i%7)*31,cooldown:0,hp:10000,maxHp:10000});units.push(u);
    }
    for(let i=0;i<150;i++)b.tick();
    let closest=Infinity;
    for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)
      closest=Math.min(closest,Math.hypot(units[i].x-units[j].x,(units[i].y-units[j].y)*.72));
    const fighters=units.filter(u=>u.engaged&&b.time-(u.lastCombat??-99)<2).length;
    return {closest,fighters,total:units.length,targets:new Set(units.map(u=>u.combatTarget).filter(Boolean)).size};
  });
  assert.ok(denseCombat.closest>=24);assert.equal(denseCombat.fighters,denseCombat.total);assert.ok(denseCombat.targets>=8);
  await page.keyboard.press('f');await page.waitForTimeout(100);
  await page.screenshot({path:path.join(output,'04-dense-combat.png')});
  checks.push('dense combat keeps visible bodies separated and every front-line unit engaged');
  const storage=await app.evaluate(({app})=>Object.fromEntries(['userData','sessionData','temp','crashDumps','logs'].map(k=>[k,app.getPath(k)])));
  for(const p of Object.values(storage))assert.ok(p.toLowerCase().startsWith(root.toLowerCase()),p);
  checks.push('all Electron writable paths are inside D:\\milaqi');
  assert.deepEqual(errors,[]);
  const report={packaged:process.argv.includes('--packaged'),checks,errors,storage};
  fs.writeFileSync(path.join(output,report.packaged?'packaged-smoke.json':'desktop-smoke.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await app.close();}
