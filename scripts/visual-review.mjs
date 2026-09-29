import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {root,localEnvironment} from './environment.mjs';
const env=localEnvironment();
const {_electron}=await import('playwright');
const require=createRequire(import.meta.url);
const app=await _electron.launch({executablePath:require('electron'),args:[root],cwd:root,env});
try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.game);
  const review=await page.evaluate(async()=>{
    const {sprite,portrait,VISUALS}=await import('./src/sprites.js');
    const {UNITS,UNIT_BY_ID,FACTIONS}=await import('./src/units.js');
    const {Battle}=await import('./src/engine.js');
    const {Renderer}=await import('./src/render.js');
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1490;
    const c=canvas.getContext('2d');c.fillStyle='#172523';c.fillRect(0,0,1600,1490);
    c.fillStyle='#eee4c5';c.font='bold 36px Microsoft YaHei';c.fillText('军团重设计  /  14 种独立轮廓',45,58);
    c.fillStyle='#9eafa0';c.font='17px Microsoft YaHei';c.fillText('完整装备 · 分层材质 · 关节动作 · 阵营色彩标记',47,91);
    const hashes=[];
    for(const d of UNITS){
      const x=35+(d.index%4)*390,y=120+Math.floor(d.index/4)*240;
      c.fillStyle=(d.index%4+Math.floor(d.index/4))%2?'#2a3832':'#24332d';c.fillRect(x,y,378,227);
      c.fillStyle='#d2b97d';c.font='bold 21px Microsoft YaHei';c.fillText(d.name,x+18,y+33);
      c.fillStyle='#9eaf9b';c.font='14px Microsoft YaHei';c.fillText(VISUALS[d.visual].role,x+18,y+58);
      c.fillStyle='#15231d';c.beginPath();c.ellipse(x+198,y+198,90,10,0,0,Math.PI*2);c.fill();
      sprite(c,d.visual,0,x+175,y+193,d.visual===10?1.65:1.85,1.4,0,1,1,true);
      sprite(c,d.visual,1,x+323,y+202,.66,0,0,-1,1,false);
      c.fillStyle='#849888';c.font='12px Microsoft YaHei';c.fillText('蓝方',x+310,y+222);
      const icon=document.createElement('canvas');icon.width=120;icon.height=108;portrait(icon.getContext('2d'),d.visual,0);hashes.push(icon.toDataURL());
    }
    c.fillStyle='#eee4c5';c.font='bold 27px Microsoft YaHei';c.fillText('骑兵 / 四腿疾驰、平举长枪、披风与尾迹',45,1134);
    c.fillStyle='#aeb79d';c.font='16px Microsoft YaHei';c.fillText('移动速度4.3，全军最快；奔跑、停步与突刺使用不同动作。',47,1168);
    const poses=[['奔跑 · 伸展',0,true,0],['奔跑 · 收腿',1.6,true,0],['停止',0,false,0],['突刺',0,false,.12]];
    poses.forEach(([label,phase,moving,attack],i)=>{
      const x=65+i*385;c.fillStyle='#304036';c.fillRect(x-20,1200,362,230);
      sprite(c,10,0,x+147,1398,1.8,phase,attack,1,1,moving);
      c.fillStyle='#d5c498';c.font='16px Microsoft YaHei';c.fillText(label,x+70,1454);
    });
    const performanceCanvas=document.createElement('canvas');performanceCanvas.width=1280;performanceCanvas.height=500;
    const ctx=performanceCanvas.getContext('2d');
    // Warm all moving frames; then measure drawing a dense 500-unit army.
    for(let k=0;k<VISUALS.length;k++)for(let f=0;f<12;f++)sprite(ctx,k,f%2,50,100,.8,f/12*Math.PI*2,0,1,1,true);
    const times=[];for(let n=0;n<30;n++){
      const t=performance.now();ctx.clearRect(0,0,1280,500);
      for(let j=0;j<500;j++)sprite(ctx,j%VISUALS.length,j%2,(j%40)*32,100+Math.floor(j/40)*30,.85,(n+j)/12*Math.PI*2,0,j%2?1:-1,1,true);
      times.push(performance.now()-t);
    }
    times.sort((a,b)=>a-b);
    const mageCanvas=document.createElement('canvas');mageCanvas.width=1290;mageCanvas.height=1780;
    const mc=mageCanvas.getContext('2d');mc.fillStyle='#15211f';mc.fillRect(0,0,mageCanvas.width,mageCanvas.height);
    mc.fillStyle='#eee4c5';mc.font='bold 28px Microsoft YaHei';mc.fillText('法师升级预览  /  双跑姿 · 三种法术 · 星界汇聚',28,40);
    const robeTeam={main:'#654b9c',hi:'#e0e1f2',dark:'#191723',style:'silvermoon'};
    const poseLabels=['行进姿态 A · 悬步','行进姿态 B · 大步','法术姿态 · 星界汇聚'];
    for(let i=0;i<3;i++){
      const x=28+i*414;mc.fillStyle='#26332d';mc.fillRect(x,58,390,190);
      sprite(mc,12,0,x+194,221,1.25,[.8,4.7,.8][i],i===2?.18:0,1,1,i<2,robeTeam,i===2?2:0);
      mc.fillStyle='#d6c798';mc.font='15px Microsoft YaHei';mc.fillText(poseLabels[i],x+16,237);
    }
    const mageSpritePixels=(moving,phase,attack=0,variant=0)=>{
      const sample=document.createElement('canvas');sample.width=240;sample.height=200;const sampleCtx=sample.getContext('2d');
      sprite(sampleCtx,12,0,120,178,1.5,phase,attack,1,1,moving,robeTeam,variant);return sampleCtx.getImageData(0,0,240,200).data;
    };
    const difference=(a,b)=>{let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])changed++;return changed;};
    const mageRunPoseDifference=difference(mageSpritePixels(true,.8),mageSpritePixels(true,4.7));
    const mageAttackStyleDifference=difference(mageSpritePixels(false,.8,.16,0),mageSpritePixels(false,.8,.16,1));
    const strangeCanvas=document.createElement('canvas');strangeCanvas.width=1290;strangeCanvas.height=2260;
    const sc=strangeCanvas.getContext('2d');sc.fillStyle='#15211f';sc.fillRect(0,0,strangeCanvas.width,strangeCanvas.height);
    sc.fillStyle='#eee4c5';sc.font='bold 28px Microsoft YaHei';sc.fillText('奇异博士升级预览  /  双奔跑姿态 · 金色法器 · 四种秘术',28,40);
    const strangeTeam={main:'#8f293c',hi:'#e0b65b',dark:'#301c26',style:'roland'};
    const strangePoseLabels=['奔跑 A · 悬浮滑行','奔跑 B · 前倾跨步','施法 · 护盾与秘纹'];
    for(let i=0;i<3;i++){
      const x=28+i*414;sc.fillStyle='#26332d';sc.fillRect(x,58,390,188);
      sprite(sc,16,0,x+194,221,1.42,[.8,4.7,.8][i],i===2?.16:0,1,1,i<2,strangeTeam,i===2?1:0);
      sc.fillStyle='#d6c798';sc.font='15px Microsoft YaHei';sc.fillText(strangePoseLabels[i],x+16,235);
    }
    const strangeSpritePixels=(moving,phase,attack=0,variant=0)=>{
      const sample=document.createElement('canvas');sample.width=240;sample.height=200;const sampleCtx=sample.getContext('2d');
      sprite(sampleCtx,16,0,120,178,1.5,phase,attack,1,1,moving,strangeTeam,variant);return sampleCtx.getImageData(0,0,240,200).data;
    };
    const strangeRunPoseDifference=difference(strangeSpritePixels(true,.8),strangeSpritePixels(true,4.7));
    const strangeAttackPoseDifference=difference(strangeSpritePixels(false,.8,.16,0),strangeSpritePixels(false,.8,.16,1));
    const strangeBattle=new Battle({mode:'local',seed:22});strangeBattle.round=2;strangeBattle.time=20;strangeBattle.mapId='grassland';strangeBattle.weather='clear';
    for(const team of strangeBattle.teams){team.auto=false;team.shot=Infinity;}
    const spawnStrange=(side,id,x)=>{const team=strangeBattle.teams[side],def=UNIT_BY_ID[id];team.gold=10000;team.supply=60;team.selected=def.index;team.auto=true;const spawned=strangeBattle.recruit(side);team.auto=false;Object.assign(spawned,{x,y:255});return spawned;};
    const strange=spawnStrange(0,'strange',2250),strangeTarget=spawnStrange(1,'heavy',2400);
    strangeBattle.teams[0].faction='roland';strangeBattle.teams[1].faction='azure';
    const strangeScene=document.createElement('canvas');strangeScene.width=430;strangeScene.height=500;
    const strangeMini=document.createElement('canvas');strangeMini.width=320;strangeMini.height=50;
    const strangeRenderer=new Renderer(strangeScene,strangeMini);strangeRenderer.camera=2167;
    const strangeContext=strangeScene.getContext('2d');strangeContext.translate(0,-62.5);strangeContext.scale(1.5,1.25);
    const strangePhases=[.17,.5,.91],strangePhaseNames=['蓄势与展开','飞行与延展','命中与余辉'];
    const strangeAttackNames=['金色伸缩缚带','秘术圆盾投掷','双环折跃秘术','镜像维度裂隙'];
    for(let style=0;style<4;style++)for(let phase=0;phase<3;phase++){
      const q=strangePhases[phase];strangeBattle.effects=[{type:'strange',variant:style,x:strange.x,y:strange.y-30,tx:strangeTarget.x,ty:strangeTarget.y-30,side:0,life:1-q,max:1}];
      strangeRenderer.draw(strangeBattle,0);
      sc.drawImage(strangeScene,phase*430,style*500+260);
      sc.fillStyle='#eee4c5';sc.font='bold 15px Microsoft YaHei';sc.fillText(`${strangeAttackNames[style]} · ${strangePhaseNames[phase]}`,phase*430+14,style*500+282);
    }
    const factionHashes=new Set();
    for(const faction of FACTIONS){strangeBattle.teams[0].faction=faction.id;strangeBattle.effects=[{type:'strange',variant:3,x:strange.x,y:strange.y-30,tx:strangeTarget.x,ty:strangeTarget.y-30,side:0,life:.5,max:1}];strangeRenderer.draw(strangeBattle,0);factionHashes.add(strangeScene.getContext('2d').getImageData(100,100,220,250).data.join(','));}
    const dreadCanvas=document.createElement('canvas');dreadCanvas.width=1290;dreadCanvas.height=1760;
    const dc=dreadCanvas.getContext('2d');dc.fillStyle='#15211f';dc.fillRect(0,0,dreadCanvas.width,dreadCanvas.height);
    dc.fillStyle='#eee4c5';dc.font='bold 28px Microsoft YaHei';dc.fillText('猩红裁决者升级预览  /  双奔跑姿势 · 三式猩红光刃 · 猩红日蚀',28,40);
    const dreadTeam={main:'#b20e2d',hi:'#f04358',dark:'#0b0d11',style:'blackstone',accent:'#ef1939'};
    const dreadPoseLabels=['奔跑 A · 前压疾冲','奔跑 B · 收势护刃','攻击姿态 · 光刃交锋'];
    for(let i=0;i<3;i++){
      const x=28+i*414;dc.fillStyle='#26332d';dc.fillRect(x,58,390,188);
      sprite(dc,14,0,x+194,222,1.42,[.8,4.7,.8][i],i===2?.16:0,1,1,i<2,dreadTeam,i===2?2:0);
      dc.fillStyle='#d6c798';dc.font='15px Microsoft YaHei';dc.fillText(dreadPoseLabels[i],x+16,235);
    }
    const dreadSpritePixels=(moving,phase,attack=0,variant=0)=>{
      const sample=document.createElement('canvas');sample.width=240;sample.height=200;const sampleCtx=sample.getContext('2d');
      sprite(sampleCtx,14,0,120,178,1.5,phase,attack,1,1,moving,dreadTeam,variant);return sampleCtx.getImageData(0,0,240,200).data;
    };
    const dreadRunPoseDifference=difference(dreadSpritePixels(true,.8),dreadSpritePixels(true,4.7));
    const dreadAttackStyleDifference=difference(dreadSpritePixels(false,.8,.16,0),dreadSpritePixels(false,.8,.16,1));
    const dreadBattle=new Battle({mode:'local',seed:23});dreadBattle.round=2;dreadBattle.time=20;dreadBattle.mapId='grassland';dreadBattle.weather='clear';
    for(const team of dreadBattle.teams){team.auto=false;team.shot=Infinity;}
    const spawnDread=(side,id,x)=>{const team=dreadBattle.teams[side],def=UNIT_BY_ID[id];team.gold=10000;team.supply=60;team.selected=def.index;team.auto=true;const spawned=dreadBattle.recruit(side);team.auto=false;Object.assign(spawned,{x,y:255});return spawned;};
    const dread=spawnDread(0,'dread',2250),dreadTarget=spawnDread(1,'heavy',2380);dreadBattle.teams[0].faction='blackstone';dreadBattle.teams[1].faction='azure';
    const dreadScene=document.createElement('canvas');dreadScene.width=430;dreadScene.height=500;
    const dreadMini=document.createElement('canvas');dreadMini.width=320;dreadMini.height=50;
    const dreadRenderer=new Renderer(dreadScene,dreadMini);dreadRenderer.camera=2167;
    const dreadContext=dreadScene.getContext('2d');dreadContext.translate(0,-62.5);dreadContext.scale(1.5,1.25);
    const dreadPhases=[.1,.43,.78],dreadPhaseNames=['蓄能','挥斩与命中','剑弧余辉'];
    const dreadAttackNames=['猩红突刺','交叉斜斩','猩红日蚀回旋斩'];
    for(let style=0;style<3;style++)for(let phase=0;phase<3;phase++){
      const q=dreadPhases[phase],max=style===2?1.45:.68;dreadBattle.effects=[{type:'sweep',variant:style,x:dread.x,y:dread.y-30,tx:dreadTarget.x,ty:dreadTarget.y-30,side:0,life:max*(1-q),max}];
      dreadRenderer.draw(dreadBattle,0);
      dc.drawImage(dreadScene,phase*430,style*500+260);
      dc.fillStyle='#eee4c5';dc.font='bold 15px Microsoft YaHei';dc.fillText(`${dreadAttackNames[style]} · ${dreadPhaseNames[phase]}`,phase*430+14,style*500+282);
    }
    const dreadFactionHashes=new Set();
    for(const faction of FACTIONS){dreadBattle.teams[0].faction=faction.id;dreadBattle.effects=[{type:'sweep',variant:2,x:dread.x,y:dread.y-30,tx:dreadTarget.x,ty:dreadTarget.y-30,side:0,life:.7,max:1.45}];dreadRenderer.draw(dreadBattle,0);dreadFactionHashes.add(dreadScene.getContext('2d').getImageData(100,100,220,250).data.join(','));}
    const battle=new Battle({mode:'local',seed:21});battle.round=2;battle.time=20;battle.mapId='grassland';battle.weather='clear';
    for(const team of battle.teams){team.auto=false;team.shot=Infinity;}
    const spawn=(side,id)=>{const team=battle.teams[side],def=UNIT_BY_ID[id];team.gold=10000;team.supply=60;team.selected=def.index;team.auto=true;const unit=battle.recruit(side);team.auto=false;return unit;};
    const mage=spawn(0,'mage'),target=spawn(1,'heavy');mage.x=2250;mage.y=255;target.x=2490;target.y=255;
    battle.teams[0].faction='silvermoon';battle.teams[1].faction='north';
    const scene=document.createElement('canvas');scene.width=430;scene.height=500;const mini=document.createElement('canvas');mini.width=320;mini.height=50;
    const renderer=new Renderer(scene,mini);renderer.camera=2070;
    const phases=[.13,.48,.8],phaseNames=['蓄势','飞行','命中'];
    for(let style=0;style<3;style++)for(let phase=0;phase<3;phase++){
      battle.effects=[{type:'frost',variant:style,x:mage.x,y:mage.y-30,tx:target.x,ty:target.y-30,side:0,life:1-phases[phase],max:1}];
      renderer.draw(battle,0);
      const x=style*430,y=270+phase*500;mc.drawImage(scene,x,y,430,500);
      mc.fillStyle='#eee4c5';mc.font='bold 15px Microsoft YaHei';mc.fillText(`${['秘纹穿刺','三重冰晶','星界汇聚'][style]} · ${phaseNames[phase]}`,x+14,y+22);
    }
    return {png:canvas.toDataURL().split(',')[1],magePng:mageCanvas.toDataURL().split(',')[1],strangePng:strangeCanvas.toDataURL().split(',')[1],dreadPng:dreadCanvas.toDataURL().split(',')[1],distinctPortraits:new Set(hashes).size,mageRunPoseDifference,mageAttackStyleDifference,strangeRunPoseDifference,strangeAttackPoseDifference,strangeFactionPaletteCount:factionHashes.size,dreadRunPoseDifference,dreadAttackStyleDifference,dreadFactionPaletteCount:dreadFactionHashes.size,denseArmyMedianMs:times[15],denseArmyP95Ms:times[28]};
  });
  assert.equal(review.distinctPortraits,14);
  assert.ok(review.mageRunPoseDifference>200,'Mage running poses must visibly differ');
  assert.ok(review.mageAttackStyleDifference>200,'Mage attack poses must visibly differ');
  assert.ok(review.strangeRunPoseDifference>200,'Doctor Strange running poses must visibly differ');
  assert.ok(review.strangeAttackPoseDifference>200,'Doctor Strange casting poses must visibly differ');
  assert.ok(review.strangeFactionPaletteCount>1,'Doctor Strange spell effects should react to faction colors');
  assert.ok(review.dreadRunPoseDifference>200,'Crimson Arbiter running poses must visibly differ');
  assert.ok(review.dreadAttackStyleDifference>200,'Crimson Arbiter attack poses must visibly differ');
  assert.ok(review.dreadFactionPaletteCount>1,'Crimson Arbiter signature effects should retain faction accents');
  fs.writeFileSync(path.join(root,'artifacts/unit-redesign.png'),Buffer.from(review.png,'base64'));delete review.png;
  fs.writeFileSync(path.join(root,'artifacts/mage-upgrade-review.png'),Buffer.from(review.magePng,'base64'));delete review.magePng;
  fs.writeFileSync(path.join(root,'artifacts/strange-upgrade-review.png'),Buffer.from(review.strangePng,'base64'));delete review.strangePng;
  fs.writeFileSync(path.join(root,'artifacts/crimson-arbiter-upgrade-review.png'),Buffer.from(review.dreadPng,'base64'));delete review.dreadPng;
  fs.writeFileSync(path.join(root,'artifacts/unit-redesign-review.json'),JSON.stringify(review,null,2));console.log(review);
}finally{await app.close();}


