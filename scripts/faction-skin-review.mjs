import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,localEnvironment} from './environment.mjs';
const env=localEnvironment();
const {_electron}=await import('playwright');
const require=createRequire(import.meta.url);
const app=await _electron.launch({executablePath:require('electron'),args:[root],cwd:root,env});
try{
  const page=await app.firstWindow();
  await page.waitForFunction(()=>window.game);
  const review=await page.evaluate(async()=>{
    const {sprite}=await import('./src/sprites.js');
    const {FACTIONS,UNITS}=await import('./src/units.js');
    const cols=6,cellW=248,cellH=166;
    const canvas=document.createElement('canvas');canvas.width=cols*cellW;canvas.height=(UNITS.length+1)*cellH;
    const c=canvas.getContext('2d');c.fillStyle='#15231d';c.fillRect(0,0,canvas.width,canvas.height);
    const skin=f=>({main:f.banner,hi:f.accent,dark:f.shadow,glow:f.glow,accent:f.accent,style:f.id});
    const hashes=[];
    const perUnit=Object.fromEntries(UNITS.map(d=>[d.id,new Set()]));
    const dreadSilhouettes=new Set(),dreadCanvas=document.createElement('canvas');dreadCanvas.width=1380;dreadCanvas.height=390;
    const dc=dreadCanvas.getContext('2d');dc.fillStyle='#15231d';dc.fillRect(0,0,dreadCanvas.width,dreadCanvas.height);
    dc.fillStyle='#eee4c5';dc.font='bold 25px Microsoft YaHei';dc.fillText('猩红裁决者 · 六大阵营专属甲胄轮廓',24,36);
    const dreadDetails={roland:'王权金饰',azure:'帆形肩甲',north:'鹿角冰晶',blackstone:'炉甲铆钉',silvermoon:'弯月仪装',mistsea:'白塔高领'};
    FACTIONS.forEach((f,index)=>{
      const x=index*230,team=skin(f);dc.fillStyle=f.banner;dc.fillRect(x+8,52,214,5);
      dc.fillStyle='#eee4c5';dc.font='bold 16px Microsoft YaHei';dc.fillText(f.name,x+12,80);
      dc.fillStyle='#aeb9ac';dc.font='12px Microsoft YaHei';dc.fillText(dreadDetails[f.id],x+12,100);
      sprite(dc,14,0,x+115,354,1.06,0,0,1,1,false,team);
      const sample=document.createElement('canvas');sample.width=240;sample.height=180;
      sprite(sample.getContext('2d'),14,0,120,158,.9,0,0,1,1,false,team);
      const pixels=sample.getContext('2d').getImageData(0,0,sample.width,sample.height).data;let hash=2166136261;
      for(let p=3;p<pixels.length;p+=4)hash=Math.imul(hash^(pixels[p]>0?1:0),16777619);
      dreadSilhouettes.add(hash>>>0);
    });
    FACTIONS.forEach((f,col)=>{
      const x=col*cellW;c.fillStyle=f.banner;c.fillRect(x+8,8,cellW-16,8);
      c.fillStyle='#eee4c5';c.font='bold 19px Microsoft YaHei';c.fillText(f.name,x+14,42);
    });
    for(let row=0;row<UNITS.length;row++){
      const d=UNITS[row],y=(row+1)*cellH;
      FACTIONS.forEach((f,col)=>{
        const x=col*cellW;c.fillStyle=(row+col)%2?'#283a32':'#23332c';c.fillRect(x+4,y+4,cellW-8,cellH-8);
        c.fillStyle='#cfbd88';c.font='13px Microsoft YaHei';c.fillText(d.name,x+10,y+23);
        c.fillStyle='#101c19';c.beginPath();c.ellipse(x+cellW/2,y+137,62,8,0,0,Math.PI*2);c.fill();
        sprite(c,d.visual,0,x+cellW/2,y+135,d.visual===10?1.05:1.18,row*.35,0,1,1,true,skin(f));
        const icon=document.createElement('canvas');icon.width=96;icon.height=82;const ic=icon.getContext('2d');
        const iconTeam=skin(f);sprite(ic,d.visual,0,48,76,d.visual===10?.58:.66,0,0,1,1,false,iconTeam);const hash=icon.toDataURL();hashes.push(`${d.id}:${f.id}:${hash}`);perUnit[d.id].add(hash);
      });
    }
    return {png:canvas.toDataURL().split(',')[1],dreadPng:dreadCanvas.toDataURL().split(',')[1],skinVariants:hashes.length,minVariantsPerUnit:Math.min(...Object.values(perUnit).map(set=>set.size)),dreadSilhouetteVariants:dreadSilhouettes.size};
  });
  fs.writeFileSync(path.join(root,'artifacts/faction-skin-review.png'),Buffer.from(review.png,'base64'));
  fs.writeFileSync(path.join(root,'artifacts/crimson-arbiter-factions.png'),Buffer.from(review.dreadPng,'base64'));
  if(review.minVariantsPerUnit<6) throw new Error(`A unit has only ${review.minVariantsPerUnit} faction variants`);
  if(review.dreadSilhouetteVariants<6) throw new Error(`Crimson Arbiter has only ${review.dreadSilhouetteVariants} distinct faction silhouettes`);
  console.log(JSON.stringify({skinVariants:review.skinVariants,minVariantsPerUnit:review.minVariantsPerUnit,dreadSilhouetteVariants:review.dreadSilhouetteVariants},null,2));
}finally{await app.close();}
