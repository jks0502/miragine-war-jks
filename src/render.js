import {UNITS,RULES,FACTION_BY_ID} from './units.js';
import {MAPS,MAP_BY_ID} from './maps.js';
import {randomSource} from './engine.js';
import {sprite,VISUALS} from './sprites.js';
import {BattleCamera} from './camera.js';
import {WeatherRenderer} from './weather-renderer.js';
export {sprite} from './sprites.js';

// Terrain and structures use local shapes; characters use cached articulated sprites.
function factionTeam(faction){return {main:faction.banner,hi:faction.accent,dark:faction.shadow,glow:faction.glow,style:faction.id};}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function polygon(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export class Renderer {
  constructor(canvas,minimap) {
    this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.minimap=minimap;this.m=minimap.getContext('2d');
    this.cameraController=new BattleCamera(RULES.width,this.canvas.width);this.shakeTime=0;this.shakeDuration=.6;this.shakeEffect=null;
    this.swampPits=[];
    this.weatherRenderer=new WeatherRenderer(RULES.width,RULES.height);
    this.terrains=new Map(MAPS.map((map,index)=>[map.id,this.createTerrain(map,index)]));
    this.grass=this.terrains.get('grassland');
  }
  createTerrain(map,index=0){
    const canvas=document.createElement('canvas');canvas.width=RULES.width;canvas.height=RULES.height;
    const c=canvas.getContext('2d'),rand=randomSource(1204+index*917);
    if(map.id==='grassland'){
      c.fillStyle=map.colors.base;c.fillRect(0,0,RULES.width,RULES.height);
      for(let i=0;i<3200;i++){const x=rand()*RULES.width,y=rand()*RULES.height;c.fillStyle=['#7d9748','#8ba452','#95a858','#789148','#739049'][i%5];c.fillRect(x,y,15+rand()*80,2+rand()*15);}
      c.globalAlpha=.15;polygon(c,map.colors.accent,[[0,230],[RULES.width,220],[RULES.width,325],[0,330]]);c.globalAlpha=1;
      for(let i=0;i<4300;i++){const x=Math.floor(rand()*RULES.width),y=Math.floor(rand()*RULES.height);c.fillStyle=rand()>.5?'#667e3c':'#a1b668';c.fillRect(x,y,3,1);if(i%4===0){c.fillRect(x+2,y-3,1,3);c.fillRect(x-2,y-2,1,2);}}
      for(let i=0;i<150;i++){const x=rand()*RULES.width,y=rand()*RULES.height;if(y>65&&y<430)continue;this.rock(c,x,y,1+rand());}
      for(let x=0;x<RULES.width;x+=76)this.bush(c,x+rand()*25,rand()*18-7,1+rand()*.8);
    }else if(map.id==='swamp'){
      c.fillStyle=map.colors.base;c.fillRect(0,0,RULES.width,RULES.height);
      c.globalAlpha=.34;for(let i=0;i<90;i++){const x=rand()*RULES.width,y=35+rand()*410,rx=24+rand()*90,ry=5+rand()*18;c.fillStyle=i%3?'#304b43':'#27403c';c.beginPath();c.ellipse(x,y,rx,ry,rand()*.35,0,Math.PI*2);c.fill();}c.globalAlpha=1;
      this.swampPits=[];
      for(let i=0;i<18;i++){
        const pit={x:90+rand()*(RULES.width-180),y:55+rand()*360,rx:25+rand()*38,ry:8+rand()*11,rotation:(rand()-.5)*.55};
        this.swampPits.push(pit);this.mudPit(c,pit.x,pit.y,pit.rx,pit.ry,pit.rotation,i);
      }
      for(let i=0;i<260;i++){const x=rand()*RULES.width,y=rand()*RULES.height;c.strokeStyle=i%2?'#78977a':'#355b4d';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+8);c.lineTo(x+rand()*8-4,y-10-rand()*12);c.stroke();}
      for(let i=0;i<125;i++){const x=rand()*RULES.width,y=rand()*RULES.height;this.rock(c,x,y,.8+rand()*.9);}
      c.globalAlpha=.2;polygon(c,'#a7c4a3',[[0,305],[RULES.width,285],[RULES.width,330],[0,350]]);c.globalAlpha=1;
    }else{
      c.fillStyle=map.colors.base;c.fillRect(0,0,RULES.width,RULES.height);
      c.globalAlpha=.46;for(let i=0;i<2200;i++){const x=rand()*RULES.width,y=rand()*RULES.height;c.fillStyle=i%4?'#c5dde0':'#e5f2f0';c.fillRect(x,y,18+rand()*80,1+rand()*7);}c.globalAlpha=1;
      c.globalAlpha=.55;for(let x=-100;x<RULES.width+200;x+=320+rand()*120){const peak=95+rand()*95;polygon(c,'#7e9da8',[[x,0],[x+160,-peak],[x+340,0]]);}c.globalAlpha=1;
      for(let i=0;i<110;i++){const x=rand()*RULES.width,y=55+rand()*370;c.strokeStyle=i%2?'#dceff0':'#6f9aa8';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+30+rand()*80,y-5-rand()*10);c.stroke();}
      for(let i=0;i<130;i++){const x=rand()*RULES.width,y=rand()>0.5?rand()*55:445+rand()*40;this.iceRock(c,x,y,.7+rand()*.9);}
    }
    return canvas;
  }
  iceRock(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);polygon(c,'#6f8e99',[[-12,5],[-6,-7],[2,-11],[12,3],[6,7],[-4,8]]);polygon(c,'#d8edef',[[-6,-7],[2,-11],[7,-1],[0,2],[-8,0]]);c.restore();}
  mudPit(c,x,y,rx,ry,rotation=0,index=0){
    c.save();c.translate(x,y);c.rotate(rotation);
    c.fillStyle='#243f37';c.beginPath();c.ellipse(0,0,rx+8,ry+5,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#8aa47b';c.lineWidth=2;c.globalAlpha=.72;c.beginPath();c.ellipse(0,0,rx+5,ry+2,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;
    const bubbles=[[-rx*.42,-ry*.1,3],[rx*.08,ry*.15,4],[rx*.42,-ry*.12,2.6]];
    for(const [bx,by,br] of bubbles){c.fillStyle='#101f1d';c.beginPath();c.arc(bx,by,br,0,Math.PI*2);c.fill();c.strokeStyle='#b5c99b';c.lineWidth=1;c.beginPath();c.arc(bx-br*.25,by-br*.35,br*.48,Math.PI*1.1,Math.PI*1.8);c.stroke();}
    c.fillStyle='#c1d2a1';c.globalAlpha=.65;c.beginPath();c.arc((index%3-1)*rx*.28,-ry*.45,1.4,0,Math.PI*2);c.fill();c.restore();
  }
  swampBubbles(c,w,time){
    c.save();
    for(let i=0;i<this.swampPits.length;i++){
      const pit=this.swampPits[i],x=pit.x-this.camera;
      if(x<-80||x>w+80)continue;
      const phase=(time*.72+i*.37)%1,y=pit.y-phase*24,r=1.5+phase*4.5;
      c.globalAlpha=(1-phase)*.78;c.strokeStyle='#d5e5b0';c.lineWidth=1.3;c.beginPath();c.arc(x+Math.sin(i*2.4)*pit.rx*.3,y,r,0,Math.PI*2);c.stroke();
      if(phase<.18){c.globalAlpha=(.18-phase)/.18;c.fillStyle='#e5efc1';c.beginPath();c.arc(x+Math.sin(i*2.4)*pit.rx*.3,y,2,0,Math.PI*2);c.fill();}
    }
    c.restore();
  }
  nuclearPollution(c,zone,time,round,w){
    const x=zone.x-this.camera,rx=zone.radiusX,ry=zone.radiusY;
    if(x<-rx-40||x>w+rx+40)return;
    const pulse=.5+.5*Math.sin(time*1.8+zone.id),roundsLeft=Math.max(0,zone.expiresAtRound-round);
    c.save();c.translate(x,zone.y);
    const stain=c.createRadialGradient(0,0,rx*.08,0,0,rx);
    stain.addColorStop(0,'#83c53b70');stain.addColorStop(.54,'#5c9c3150');stain.addColorStop(1,'#376b2820');
    c.fillStyle=stain;c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.fill();
    c.globalAlpha=.56+pulse*.2;c.strokeStyle='#c5ef68';c.lineWidth=2;c.setLineDash([18,12]);
    c.beginPath();c.ellipse(0,0,rx*(.88+pulse*.025),ry*(.88+pulse*.025),0,0,Math.PI*2);c.stroke();c.setLineDash([]);
    c.globalAlpha=.16+pulse*.1;c.strokeStyle='#d9f88b';c.lineWidth=1;
    c.beginPath();c.ellipse(0,0,rx*.63,ry*.63,time*.04,0,Math.PI*2);c.stroke();
    c.save();c.rotate(-time*.16);
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*Math.PI*2/3,inner=7,outer=25,spread=.42;
      c.globalAlpha=.62+pulse*.24;c.fillStyle='#d6f781';c.beginPath();
      c.moveTo(Math.cos(a-spread)*inner,Math.sin(a-spread)*inner);
      c.lineTo(Math.cos(a-spread)*outer,Math.sin(a-spread)*outer);
      c.arc(0,0,outer,a-spread,a+spread);
      c.lineTo(Math.cos(a+spread)*inner,Math.sin(a+spread)*inner);
      c.arc(0,0,inner,a+spread,a-spread,true);c.closePath();c.fill();
    }
    c.globalAlpha=.9;c.fillStyle='#e9ff9b';c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fill();c.restore();
    c.globalAlpha=.88;c.textAlign='center';c.font='bold 14px sans-serif';c.fillStyle='#eaffaf';
    c.shadowColor='#18270e';c.shadowBlur=5;c.fillText(`☢  污染 ${roundsLeft} 回合`,0,-ry+23);
    c.shadowBlur=0;c.globalAlpha=.75;
    for(let i=0;i<RULES.nukePollutionRounds;i++){
      c.fillStyle=i<roundsLeft?'#d7f581':'#394d2b';c.beginPath();c.arc((i-(RULES.nukePollutionRounds-1)/2)*15,ry-17,3.2,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  rock(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);polygon(c,'#65724e',[[-9,3],[-8,-3],[-2,-6],[5,-4],[8,3]]);polygon(c,'#9a9b70',[[-8,-3],[-2,-6],[5,-4],[1,0],[-5,0]]);c.restore();}
  bush(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);for(let i=0;i<6;i++){c.fillStyle=['#425c36','#526d3a','#607d40'][i%3];c.fillRect((i%3)*8-10,Math.floor(i/3)*6-5,13,9);}c.restore();}
  get camera(){return this.cameraController.position;}
  set camera(value){this.cameraController.setPosition(value);}
  get maxCamera(){return this.cameraController.maxPosition;}
  get follow(){return this.cameraController.following;}
  set follow(value){this.cameraController.setFollowing(value);}
  focus(battle){this.cameraController.focus(battle);}
  setCamera(x){this.cameraController.setPosition(x);}
  updateFollow(battle,dt){this.cameraController.update(battle,dt);}
  castle(c,t,time){
    const x=t.x-this.camera,y=t.y;
    if(x<-86||x>this.canvas.width+86)return;
    c.save();c.translate(x,y);c.scale(.58,.58);
    const faction=FACTION_BY_ID[t.faction]||FACTION_BY_ID.roland;
    const accent=faction.accent,glow=faction.glow;
    const basalt=c.createLinearGradient(-70,0,70,0);
    basalt.addColorStop(0,faction.shadow);basalt.addColorStop(.28,faction.stoneLight);basalt.addColorStop(.55,faction.stone);basalt.addColorStop(1,faction.shadow);
    const side=faction.shadow,top=faction.stoneLight,joint=faction.shadow;
    const masonry=(x0,y0,w,h)=>{
      c.fillStyle=basalt;c.fillRect(x0,y0,w,h);
      c.strokeStyle=joint;c.lineWidth=1;
      for(let yy=y0+12;yy<y0+h;yy+=12){
        c.beginPath();c.moveTo(x0,yy);c.lineTo(x0+w,yy+1);c.stroke();
        const off=(Math.floor((yy-y0)/12)%2)*11;
        for(let xx=x0+off;xx<x0+w;xx+=22){c.beginPath();c.moveTo(xx,yy-12);c.lineTo(xx+1,yy);c.stroke();}
      }
      c.fillStyle='#d7f4f320';c.fillRect(x0+2,y0+2,2,h-4);
    };
    const slab=(x0,y0,w,h,depth=9)=>{
      masonry(x0,y0,w,h);
      polygon(c,side,[[x0+w,y0],[x0+w+depth,y0-depth*.55],[x0+w+depth,y0+h-depth*.55],[x0+w,y0+h]]);
      polygon(c,top,[[x0,y0],[x0+depth,y0-depth*.55],[x0+w+depth,y0-depth*.55],[x0+w,y0]]);
    };
    const battlement=(x0,y0,w,count)=>{
      for(let i=0;i<count;i++)rect(c,top,x0+i*w/count,y0-8,w/count*.52,9);
    };
    const window=(wx,wy,w=6,h=16)=>{
      c.save();c.globalAlpha=.35;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=12;c.fillRect(wx-w/2,wy,w,h);c.restore();
      rect(c,'#15242a',wx-w/2,wy,w,h);
      rect(c,accent,wx-1,wy+2,2,h-5);
    };
    const tower=(tx,topY,w,h=94,spire=41)=>{
      slab(tx,topY,w,h);
      polygon(c,'#0c1419',[[tx-6,topY],[tx+w*.5,topY-spire],[tx+w+6,topY]]);
      polygon(c,'#233941',[[tx+w*.5,topY-spire],[tx+w+15,topY-9],[tx+w+6,topY]]);
      rect(c,top,tx-2,topY,w+4,3);
      battlement(tx-1,topY,w+2,3);
      window(tx+w*.5,topY+20,6,15);window(tx+w*.5,topY+53,5,13);
    };
    const style=faction.castleStyle;
    if(style!=='roland'){
      this.strongholdVariant(c,style,faction,time);
      this.flag(c,faction,t.side,1,-163,1.25);
      this.castleEmblem(c,style,accent,glow,time);
      c.restore();return;
    }
    // Low silhouette, narrow footprint, strong shadow: a fortress rather than a toy castle.
    polygon(c,'#061013aa',[[-72,34],[-45,51],[95,30],[71,10]]);
    slab(-58,18,116,14,16);
    tower(-53,-76,26,94,43);tower(27,-76,26,94,43);tower(-14,-111,28,113,53);
    masonry(-33,-47,66,66);
    battlement(-35,-50,70,5);
    for(const [wx,wy] of [[-24,-29],[24,-29],[0,-78]])window(wx,wy,6,15);
    c.save();c.globalAlpha=.28;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=22;c.beginPath();c.arc(0,-1,25,0,Math.PI*2);c.fill();c.restore();
    c.fillStyle='#0c151b';c.beginPath();c.moveTo(-15,22);c.lineTo(-15,-5);c.quadraticCurveTo(0,-29,15,-5);c.lineTo(15,22);c.closePath();c.fill();
    for(let xx=-11;xx<=11;xx+=6)rect(c,'#6a6d62',xx,-2,2,23);
    polygon(c,faction.stone,[[-20,21],[20,21],[27,29],[-13,29]]);
    this.flag(c,faction,t.side,1,-163,1.25);
    // Small runic cut on the keep gives the selected magical mood without changing the combat palette.
    c.strokeStyle=accent;c.lineWidth=2;c.globalAlpha=.75;c.beginPath();c.moveTo(-7,-39);c.lineTo(0,-47);c.lineTo(7,-39);c.lineTo(0,-30);c.closePath();c.stroke();
    this.castleEmblem(c,faction.castleStyle,accent,glow,time);
    c.restore();
  }
  flag(c,faction,side,poleX,poleTop,scale=1){
    const direction=side===0?1:-1;
    c.save();c.translate(poleX,poleTop);c.scale(direction*scale,scale);c.lineJoin='round';
    // Forged pole, collar, and finial give the banner a physical anchor.
    rect(c,'#101619',-2,0,4,43);rect(c,faction.stoneLight,-.5,3,1,37);
    c.fillStyle=faction.accent;c.beginPath();c.arc(0,-3,4,0,Math.PI*2);c.fill();
    polygon(c,faction.shadow,[[-5,-1],[0,-8],[5,-1]]);
    const cloth=()=>{c.beginPath();c.rect(1,3,42,28);};
    c.save();cloth();c.clip();this.flagField(c,faction.castleStyle,42,28);c.restore();
    cloth();c.strokeStyle='#101619';c.lineWidth=1.2;c.stroke();
    c.restore();
  }
  flagField(c,style,w=42,h=28){
    const colors={
      roland:{field:'#AE1232',primary:'#FFC72C',secondary:'#FFFFFF'},
      azure:{field:'#0052A5',primary:'#00A6BE',secondary:'#FFFFFF'},
      north:{field:'#006B3C',primary:'#FFCD00',secondary:'#FFFFFF'},
      blackstone:{field:'#000000',primary:'#F26522',secondary:'#CFD6DC'},
      silvermoon:{field:'#4C008A',primary:'#FFFFFF',secondary:'#FFFFFF'},
      mistsea:{field:'#2A6F97',primary:'#8ECAE6',secondary:'#FFFFFF'}
    }[style]||{field:'#304936',primary:'#D8C27A',secondary:'#FFFFFF'};
    const {field,primary,secondary}=colors;
    const star=(cx,cy,r1,r2,n=5,rotation=-Math.PI/2)=>{
      const points=[];for(let i=0;i<n*2;i++){const a=rotation+i*Math.PI/n,r=i%2===0?r1:r2;points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
      polygon(c,secondary,points);
    };
    rect(c,field,0,0,w,h);
    if(style==='roland'){
      rect(c,primary,0,0,w*.205,h);for(const [x,y] of [[w*.61,h*.27],[w*.49,h*.63],[w*.73,h*.63]])star(x,y,Math.min(w,h)*.12,Math.min(w,h)*.05);
    }else if(style==='azure'){
      rect(c,secondary,0,h/3,w,h/3);polygon(c,primary,[[0,0],[w*.38,h/2],[0,h]]);star(w*.14,h/2,Math.min(w,h)*.12,Math.min(w,h)*.045,8);
    }else if(style==='north'){
      rect(c,primary,w*.23,0,w*.19,h);rect(c,primary,0,h*.355,w,h*.29);rect(c,secondary,w*.265,0,w*.125,h);rect(c,secondary,0,h*.405,w,h*.19);
    }else if(style==='blackstone'){
      polygon(c,secondary,[[0,h*.27],[w*.27,0],[w,h*.73],[w*.73,h],[0,h*.27]]);polygon(c,primary,[[0,h*.34],[w*.30,0],[w,h*.66],[w*.70,h],[0,h*.34]]);
    }else if(style==='silvermoon'){
      rect(c,secondary,0,0,w*.175,h);const cx=w*.62,cy=h*.5,r=Math.min(w,h)*.26;c.fillStyle=secondary;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();c.fillStyle=field;c.beginPath();c.arc(cx+r*.45,cy-r*.18,r*1.07,0,Math.PI*2);c.fill();star(w*.81,h*.33,Math.min(w,h)*.105,Math.min(w,h)*.04);
    }else if(style==='mistsea'){
      const band=h/5;rect(c,secondary,0,band,w,band);rect(c,secondary,0,band*3,w,band);rect(c,primary,0,band*2,w,band);rect(c,'#003049',0,0,w*.38,h*.6);star(w*.19,h*.3,Math.min(w,h)*.16,Math.min(w,h)*.06,8);
    }
  }
  strongholdVariant(c,style,faction,time){
    const {stone,stoneLight,shadow,accent,glow}=faction;
    const slab=(x,y,w,h,d=8)=>{
      c.fillStyle=stone;c.fillRect(x,y,w,h);
      polygon(c,shadow,[[x+w,y],[x+w+d,y-d*.5],[x+w+d,y+h-d*.5],[x+w,y+h]]);
      polygon(c,stoneLight,[[x,y],[x+d,y-d*.5],[x+w+d,y-d*.5],[x+w,y]]);
    };
    polygon(c,'#061013aa',[[-75,35],[-42,50],[92,31],[72,10]]);
    if(style==='azure'){
      // A sea republic's base is a fortified harbor and lighthouse, not a keep.
      slab(-66,20,132,17,13);slab(-52,-9,104,28,10);
      c.fillStyle=stone;c.fillRect(-18,-111,36,103);polygon(c,stoneLight,[[-18,-111],[0,-130],[18,-111]]);
      rect(c,shadow,-23,-7,46,8);rect(c,accent,-13,-80,4,30);rect(c,accent,9,-80,4,30);
      c.save();c.globalAlpha=.55;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=20;c.beginPath();c.arc(0,-117,13,0,Math.PI*2);c.fill();c.restore();
      polygon(c,stoneLight,[[-56,-2],[-45,-31],[-33,-2]]);polygon(c,stoneLight,[[33,-2],[45,-31],[56,-2]]);
      for(const x of [-45,45])rect(c,accent,x-2,-25,4,15);
    }else if(style==='north'){
      // The northern alliance gathers in a timber longhouse around a carved totem.
      slab(-71,23,142,16,12);rect(c,shadow,-60,-47,120,71);rect(c,stone,-54,-43,108,63);
      polygon(c,stoneLight,[[-68,-47],[0,-101],[68,-47]]);polygon(c,shadow,[[-59,-47],[0,-88],[59,-47]]);
      for(let x=-48;x<=48;x+=24){rect(c,stoneLight,x,-42,7,61);rect(c,shadow,x+7,-42,3,61);}
      rect(c,shadow,-17,-15,34,38);polygon(c,accent,[[-12,-11],[0,-27],[12,-11]]);
      rect(c,accent,-3,-90,6,34);polygon(c,accent,[[-3,-91],[-22,-111],[-18,-94]]);polygon(c,accent,[[3,-91],[22,-111],[18,-94]]);
      for(const x of [-32,32]){c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(x,-59);c.lineTo(x+(x<0?-16:16),-79);c.stroke();}
    }else if(style==='blackstone'){
      // Blackstone's base is a mountain forge with a furnace mouth at its heart.
      polygon(c,shadow,[[-76,32],[-68,-38],[-45,-72],[-30,-40],[-8,-126],[11,-79],[34,-110],[53,-42],[78,32]]);
      polygon(c,stone,[[-59,28],[-53,-35],[-34,-57],[-18,-30],[-6,-99],[8,-57],[27,-83],[42,-30],[62,28]]);
      c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(-5,-94);c.lineTo(-17,-49);c.lineTo(-5,-17);c.moveTo(25,-78);c.lineTo(15,-45);c.lineTo(27,-19);c.stroke();
      c.save();c.globalAlpha=.7;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=24;c.beginPath();c.arc(0,4,27,0,Math.PI*2);c.fill();c.restore();
      polygon(c,'#100f10',[[-23,28],[-17,-4],[0,-22],[17,-4],[23,28]]);rect(c,accent,-9,10,18,4);
    }else if(style==='silvermoon'){
      // Silvermoon keeps a stepped observatory-temple beneath a broken crescent.
      slab(-74,24,148,15,12);slab(-58,6,116,18,9);slab(-42,-15,84,21,7);
      c.fillStyle=stone;c.fillRect(-28,-90,56,76);polygon(c,stoneLight,[[-28,-90],[0,-120],[28,-90]]);
      for(const x of [-18,18]){rect(c,accent,x-3,-69,6,22);rect(c,shadow,x-5,-44,10,5);}
      c.strokeStyle=accent;c.lineWidth=5;c.beginPath();c.arc(0,-127,27,-.9,1.05);c.stroke();
      c.strokeStyle=glow;c.lineWidth=2;c.beginPath();c.moveTo(-31,-119);c.lineTo(-19,-134);c.lineTo(-8,-118);c.moveTo(30,-115);c.lineTo(40,-128);c.lineTo(48,-111);c.stroke();
    }else if(style==='mistsea'){
      // The fog kingdom's stronghold is a narrow white beacon surrounded by veils.
      slab(-62,25,124,14,11);slab(-44,7,88,18,8);
      c.fillStyle=stone;c.fillRect(-21,-130,42,139);polygon(c,stoneLight,[[-21,-130],[0,-160],[21,-130]]);
      rect(c,accent,-4,-111,8,46);rect(c,shadow,-7,-50,14,23);rect(c,glow,-2,-111,4,25);
      c.strokeStyle=accent;c.lineWidth=3;c.globalAlpha=.8;
      for(const [x,y,r] of [[-8,-101,35],[10,-73,42],[0,-40,55]]){c.beginPath();c.arc(x,y,r,Math.PI*1.1,Math.PI*1.85);c.stroke();}c.globalAlpha=1;
      polygon(c,stoneLight,[[-48,4],[-35,-25],[-24,4]]);polygon(c,stoneLight,[[24,4],[35,-25],[48,4]]);
    }
  }
  castleEmblem(c,style,accent,glow,time){
    c.save();c.lineCap='round';c.lineJoin='round';
    if(style==='roland'){
      c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(-17,-129);c.lineTo(-9,-137);c.lineTo(0,-130);c.lineTo(9,-137);c.lineTo(17,-129);c.stroke();
      polygon(c,accent,[[-4,-142],[0,-148],[4,-142],[2,-135],[-2,-135]]);
    }else if(style==='azure'){
      c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.moveTo(-44,25);c.quadraticCurveTo(-22,15,0,25);c.quadraticCurveTo(22,35,44,25);c.stroke();
      polygon(c,accent,[[8,-119],[8,-76],[34,-91]]);polygon(c,'#d5edf2',[[8,-116],[8,-82],[-15,-96]]);rect(c,accent,7,-121,2,48);
    }else if(style==='north'){
      c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(0,-120);c.quadraticCurveTo(-9,-143,-25,-147);c.moveTo(-12,-133);c.quadraticCurveTo(-24,-133,-32,-145);c.moveTo(0,-120);c.quadraticCurveTo(9,-143,25,-147);c.moveTo(12,-133);c.quadraticCurveTo(24,-133,32,-145);c.stroke();
      c.strokeStyle='#6f5239';c.lineWidth=4;c.beginPath();c.moveTo(-28,-47);c.lineTo(28,0);c.moveTo(28,-47);c.lineTo(-28,0);c.stroke();
    }else if(style==='blackstone'){
      c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.moveTo(-19,-37);c.lineTo(-8,-22);c.lineTo(-13,-5);c.moveTo(13,-42);c.lineTo(5,-24);c.lineTo(17,-9);c.stroke();
      c.fillStyle=glow;c.globalAlpha=.55;c.beginPath();c.arc(-37,-91,5+Math.sin(time*2)*1.5,0,Math.PI*2);c.arc(39,-102,4,0,Math.PI*2);c.fill();
      polygon(c,'#17191b',[[-41,-126],[-26,-148],[-10,-126]]);
    }else if(style==='silvermoon'){
      c.strokeStyle=accent;c.lineWidth=4;c.beginPath();c.arc(0,-132,16,-.95,1.1);c.stroke();
      c.strokeStyle=glow;c.lineWidth=1.5;c.beginPath();c.moveTo(-29,-112);c.lineTo(-22,-121);c.lineTo(-17,-111);c.moveTo(28,-99);c.lineTo(35,-108);c.lineTo(40,-98);c.stroke();
    }else if(style==='mistsea'){
      c.strokeStyle=accent;c.lineWidth=3;c.globalAlpha=.75;c.beginPath();c.arc(-8,-85,28,Math.PI*1.1,Math.PI*1.8);c.arc(12,-70,35,Math.PI*1.15,Math.PI*1.85);c.stroke();
      polygon(c,accent,[[-5,-122],[0,-153],[5,-122]]);rect(c,glow,-1,-149,2,22);
    }
    c.restore();
  }
  camp(c,t,time){
    const x=t.x-this.camera;
    if(x<-52||x>this.canvas.width+52)return;
    c.save();c.translate(x,0);
    if(t.hp<=0){
      for(let i=0;i<32;i++){
        const yy=i*17,off=(i%3)*5;
        polygon(c,i%2?'#3e484a':'#242e33',[[-13+off,yy+8],[-6+off,yy-3],[9+off,yy],[18+off,yy+7],[3+off,yy+14]]);
        rect(c,'#697578',-5+off,yy+1,8,2);
      }
      c.restore();return;
    }
    const faction=FACTION_BY_ID[t.faction]||FACTION_BY_ID.roland;
    const accent=faction.accent,glow=faction.glow;
    const wall=c.createLinearGradient(-19,0,28,0);
    wall.addColorStop(0,'#6a7579');wall.addColorStop(.22,'#303b41');wall.addColorStop(.6,'#1c282f');wall.addColorStop(1,'#0d171d');
    const segment=(top,bottom)=>{
      polygon(c,'#06101388',[[-7,top],[28,top+13],[28,bottom+13],[-7,bottom]]);
      rect(c,wall,-17,top,35,bottom-top);
      c.strokeStyle='#17252b';c.lineWidth=1;
      for(let yy=top+18;yy<bottom;yy+=20){
        c.beginPath();c.moveTo(-17,yy);c.lineTo(18,yy+1);c.stroke();
        for(const xx of [-6,10]){c.beginPath();c.moveTo(xx,yy-20);c.lineTo(xx+1,yy);c.stroke();}
      }
      rect(c,'#7c898b',-17,top,2,bottom-top);
      for(let yy=top+4;yy<bottom;yy+=20)polygon(c,'#9aa1a0',[[-21,yy],[-16,yy-4],[-10,yy-4],[-15,yy]]);
    };
    segment(0,t.y-31);segment(t.y+31,RULES.height);
    // Recessed central gatehouse: the wall remains narrow while the door has real depth.
    polygon(c,'#263238',[[-22,t.y-31],[18,t.y-31],[28,t.y-21],[28,t.y+31],[-22,t.y+31]]);
    polygon(c,'#707b7c',[[-22,t.y-31],[-13,t.y-40],[27,t.y-30],[18,t.y-31]]);
    polygon(c,'#0c171d',[[-13,t.y+28],[-13,t.y-5],[0,t.y-29],[13,t.y-5],[13,t.y+28]]);
    for(let xx=-9;xx<=9;xx+=6)rect(c,'#53686a',xx,t.y-4,2,32);
    c.save();c.globalAlpha=.3;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=15;c.beginPath();c.arc(0,t.y-5,22,Math.PI,Math.PI*2);c.fill();c.restore();
    c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.moveTo(-17,t.y-15);c.lineTo(-10,t.y-22);c.lineTo(-4,t.y-15);c.moveTo(4,t.y-15);c.lineTo(10,t.y-22);c.lineTo(17,t.y-15);c.stroke();
    for(const yy of [t.y-41,t.y+30]){
      rect(c,'#536267',-23,yy,35,9);
      for(let xx=-21;xx<10;xx+=13)rect(c,'#a0a6a0',xx,yy-5,8,5);
    }
    this.flag(c,faction,t.side,-3,t.y-80,.84);
    rect(c,'#081116',-24,18,48,5);rect(c,accent,-23,19,46*t.hp/t.maxHp,3);
    c.restore();
  }
  structure(c,s,time){
    if(s.structure==='castle')this.castle(c,s,time);else this.camp(c,s,time);
  }
  draw(battle,dt=0) {
    const c=this.c,w=this.canvas.width,h=this.canvas.height;
    c.imageSmoothingEnabled=false;
    if(this.follow)this.updateFollow(battle,dt);
    const quake=battle.effects.find(e=>e.type==='nuke-explosion')||battle.effects.find(e=>e.type==='bombard');
    if(quake&&quake!==this.shakeEffect){this.shakeEffect=quake;this.shakeDuration=quake.type==='nuke-explosion'?1.55:.6;this.shakeTime=this.shakeDuration;}
    this.shakeTime=Math.max(0,this.shakeTime-dt);
    const intensity=this.shakeTime/this.shakeDuration,quakePower=quake?.type==='nuke-explosion'?2.3:1;
    const shakeX=intensity*quakePower*(Math.sin(this.shakeTime*91)*13+Math.sin(this.shakeTime*173)*5);
    const shakeY=intensity*quakePower*(Math.cos(this.shakeTime*113)*9+Math.sin(this.shakeTime*211)*3);
    c.save();c.translate(shakeX,shakeY);
    const map=MAP_BY_ID[battle.mapId]||MAP_BY_ID.grassland,terrain=this.terrains.get(map.id)||this.grass;
    c.fillStyle=map.colors.base;c.fillRect(-24,-24,w+48,h+48);
    c.drawImage(terrain,Math.round(this.camera),0,w,RULES.height,0,0,w,h);
    c.save();c.scale(1,h/RULES.height);
    this.weatherRenderer.update(map.id,battle.weather,dt);
    this.weatherRenderer.drawBackground(c,{mapId:map.id,weather:battle.weather,time:battle.time,width:w,camera:this.camera});
    if(map.id==='swamp')this.swampBubbles(c,w,battle.time);
    for(const zone of battle.contaminatedZones)this.nuclearPollution(c,zone,battle.time,battle.round,w);
    for(const t of battle.teams){this.castle(c,t,battle.time);this.camp(c,t.camp,battle.time);}
    // Painted border stones, without adding lanes to combat.
    for(const x of [180,RULES.width-180]){rect(c,'#55713970',x-this.camera,40,2,410);}
    const visible=battle.units.filter(u=>u.x>this.camera-60&&u.x<this.camera+w+60).sort((a,b)=>a.y-b.y);
    for(const u of visible){
      const d=UNITS[u.kind],x=u.x-this.camera,s=VISUALS[d.visual].scale;
      const faction=FACTION_BY_ID[battle.teams[u.side]?.faction]||FACTION_BY_ID.roland;
      const team=factionTeam(faction);
      if(u.hp<=0){
        const age=Math.max(0,battle.time-(u.deadAt??battle.time)),fade=Math.min(1,Math.max(0,(RULES.corpseSeconds-age)/.35));
        c.fillStyle='#28372866';c.beginPath();c.ellipse(x,u.y+3,d.radius*2.2,3.5,0,0,7);c.fill();
        c.save();c.translate(x,u.y+5);c.rotate(u.side?-Math.PI/2:Math.PI/2);sprite(c,d.visual,u.side,0,0,s,u.walk||0,0,u.heading,fade,false,team);c.restore();
        continue;
      }
      const hover=d.id==='strange'?-14+Math.sin(battle.time*4.2+u.id)*2:0,drawY=u.y+hover;
      c.fillStyle=d.id==='strange'?'#193f3d66':'#28372855';c.beginPath();c.ellipse(x,u.y+2,d.id==='strange'?d.radius*1.8:d.radius*1.35,d.id==='strange'?2.5:4,0,0,7);c.fill();
      if(d.id==='strange'){
        c.globalAlpha=.45;c.strokeStyle=team.hi;c.lineWidth=1;c.beginPath();c.ellipse(x,u.y+2,d.radius*1.45,5,0,0,7);c.stroke();c.globalAlpha=1;
        for(let i=0;i<3;i++){c.fillStyle=team.hi;c.fillRect(x-8+i*7,u.y-3-Math.sin(battle.time*3+i)*3,2,2);}
      }
      sprite(c,d.visual,u.side,x,drawY,s,u.moving?u.walk:battle.time*1.4,u.attack,u.heading,1,u.moving,team,u.attackVariant||0);
      if(u.hp<d.hp){const barY=drawY-(VISUALS[d.visual].height+5)*s;rect(c,'#2d3827',x-12,barY,24,3);rect(c,team.hi,x-11,barY,22*u.hp/d.hp,2);}
      if(u.flash>0){c.fillStyle='#ffeac29c';c.fillRect(x-2,drawY-25,4,5);}
    }
    for(const e of battle.effects){
      const p=1-e.life/e.max,x=e.x-this.camera,tx=(e.tx??e.x)-this.camera;
      c.globalAlpha=e.life/e.max;
      if(e.type==='bombard'){
        c.save();
        const age=e.max-e.life,left=x-e.width/2;
        // A translucent target band marks the fixed engagement area; the projectiles
        // themselves are physical missiles with a visible accelerating fall.
        c.globalAlpha=Math.min(1,e.life)*.14;c.fillStyle=e.side?'#4fc4d855':'#df593d55';c.fillRect(left,0,e.width,e.height);
        c.globalAlpha=Math.min(1,e.life)*.58;c.strokeStyle=e.side?'#8eeaf0':'#ff9c78';c.lineWidth=2;
        c.setLineDash([22,14]);c.strokeRect(left,2,e.width,e.height-4);c.setLineDash([]);
        const missileCount=e.missiles??RULES.bombardMissiles;
        const flight=e.flight??RULES.bombardFlight;
        const stagger=e.stagger??RULES.bombardStagger;
        for(let i=0;i<missileCount;i++){
          // Low-discrepancy spacing keeps the whole strip busy without making
          // the impacts look like a rigid row or a single beam.
          const bx=left+e.width*(.06+((i*37)%89)/100),by=e.height*(.08+((i*61)%84)/100);
          const launch=i*stagger,fall=age-launch;
          if(fall<0){
            // A brief high-altitude glint telegraphs the incoming projectile.
            c.globalAlpha=Math.min(1,e.life)*.45;c.fillStyle='#fff0b0';c.fillRect(bx-2,2+i%3*4,4,2);
            continue;
          }
          if(fall<flight){
            // Cubic easing makes the projectile visibly crawl at high altitude
            // and then gain speed sharply as it approaches the ground.
            const q=Math.min(1,fall/flight),accelerated=q*q*q;
            const startY=-135-(i%3)*24,my=startY+(by-startY)*accelerated;
            // Smoke and hot exhaust follow the curved acceleration trail.
            for(let k=5;k>=1;k--){
              const tq=Math.max(0,q-k*.075),py=startY+(by-startY)*tq*tq;
              c.globalAlpha=Math.min(1,e.life)*(.06+.035*(6-k));c.fillStyle=k%2?'#7c8079':'#bac0ad';
              c.beginPath();c.arc(bx+(k%2?2:-2)*k,py,2.5+k*.8,0,Math.PI*2);c.fill();
            }
            c.globalAlpha=Math.min(1,e.life)*.8;c.strokeStyle='#fff0b0';c.lineWidth=2;
            c.beginPath();c.moveTo(bx,my-25-q*16);c.lineTo(bx,my-8);c.stroke();
            c.save();c.translate(bx,my);c.rotate(Math.PI/2);
            const body=c.createLinearGradient(-16,0,13,0);body.addColorStop(0,'#26343a');body.addColorStop(.55,'#a9b3a7');body.addColorStop(1,'#e3d6ac');
            polygon(c,body,[[-15,-4],[-2,-6],[10,-4],[15,0],[10,4],[-2,6],[-15,4]]);
            polygon(c,'#d2d6c2',[[9,-4],[17,0],[9,4]]);
            polygon(c,'#9b3e38',[[-7,-5],[-1,-12],[4,-6],[4,6],[-1,12],[-7,5]]);
            c.fillStyle='#fff4b9';c.beginPath();c.arc(-17,0,5+q*4,0,Math.PI*2);c.fill();
            c.restore();
            continue;
          }
          const blast=fall-flight,fade=Math.max(0,1-blast/3.9);
          // Scorched ground, rising smoke, then a bright impact.
          c.globalAlpha=fade*.6;c.fillStyle='#302b25';c.beginPath();c.ellipse(bx,by,25+blast*9,11+blast*4,0,0,Math.PI*2);c.fill();
          for(let j=0;j<3;j++){
            const sx=bx+Math.sin(i+j*2)*blast*22,sy=by-18-blast*55-j*12;
            const size=13+blast*20+j*4;
            c.globalAlpha=fade*.5;c.fillStyle=j%2?'#6c645a':'#3e3b38';c.beginPath();c.arc(sx,sy,size,0,Math.PI*2);c.fill();
          }
          if(blast<.65){
            const size=16+Math.sin(Math.min(1,blast/.65)*Math.PI)*32;
            c.globalAlpha=1-blast/.65;
            const fire=c.createRadialGradient(bx,by-20,2,bx,by-20,size);
            fire.addColorStop(0,'#fffde1');fire.addColorStop(.25,'#ffe681');fire.addColorStop(.6,'#ff922c');fire.addColorStop(1,'#ed431000');
            c.fillStyle=fire;c.beginPath();c.arc(bx,by-20,size,0,Math.PI*2);c.fill();
            c.strokeStyle='#ffe4a2';c.lineWidth=2;c.beginPath();c.ellipse(bx,by,12+blast*95,6+blast*48,0,0,Math.PI*2);c.stroke();
          }
          for(let j=0;j<5;j++){
            const a=j*Math.PI*2/5+i,travel=blast*65;
            c.globalAlpha=fade;c.fillStyle=j%2?'#ffbd52':'#ffe9a3';
            c.fillRect(bx+Math.cos(a)*travel,by-15+Math.sin(a)*travel*.5-blast*65+blast*blast*40,3,4);
          }
        }
        c.restore();
      }else if(e.type==='nuke-fall'){
        c.save();
        const age=e.max-e.life,q=Math.min(1,age/e.flight),accelerated=q*q*q,missileY=-105+(e.impactY+105)*accelerated;
        const marker=18+Math.sin(battle.time*9)*6;
        c.globalAlpha=.35+q*.5;c.strokeStyle='#ff6955';c.lineWidth=2;c.setLineDash([10,8]);
        c.beginPath();c.ellipse(x,e.impactY,marker*1.8,marker*.7,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
        c.globalAlpha=.24+q*.3;c.strokeStyle='#ffd28a';c.lineWidth=1;c.beginPath();
        c.moveTo(x-36,e.impactY);c.lineTo(x+36,e.impactY);c.moveTo(x,e.impactY-20);c.lineTo(x,e.impactY+20);c.stroke();
        const shaft=c.createLinearGradient(x,missileY-150,x,missileY+10);
        shaft.addColorStop(0,'#fff1c000');shaft.addColorStop(.72,'#ffb55330');shaft.addColorStop(1,'#fff5d9cc');
        c.globalAlpha=.48+q*.35;c.fillStyle=shaft;c.beginPath();c.moveTo(x-2,missileY-150);c.lineTo(x+2,missileY-150);c.lineTo(x+9,missileY+4);c.lineTo(x-9,missileY+4);c.closePath();c.fill();
        for(let k=4;k>=1;k--){
          const trailY=missileY-18-k*17,trailX=x+Math.sin(age*8+k*1.7)*k*3;
          c.globalAlpha=(.12+k*.045)*(1-q*.2);c.fillStyle=k%2?'#b7a99a':'#f5d7a1';
          c.beginPath();c.ellipse(trailX,trailY,3+k*1.3,5+k*2,0,0,Math.PI*2);c.fill();
        }
        c.save();c.translate(x,missileY);c.rotate(Math.PI);
        c.globalAlpha=.94;c.fillStyle='#d9d2bd';c.beginPath();c.moveTo(0,-24);c.lineTo(8,-7);c.lineTo(7,17);c.lineTo(0,22);c.lineTo(-7,17);c.lineTo(-8,-7);c.closePath();c.fill();
        c.fillStyle='#5b5b55';c.fillRect(-8,1,16,6);c.fillStyle='#fff3c3';c.beginPath();c.arc(0,20,7+q*4,0,Math.PI*2);c.fill();
        c.strokeStyle='#ff8d42';c.lineWidth=2;c.beginPath();c.moveTo(-5,8);c.lineTo(-12,16);c.moveTo(5,8);c.lineTo(12,16);c.stroke();c.restore();
        c.restore();
      }else if(e.type==='nuke-explosion'){
        c.save();
        const age=e.max-e.life,fade=Math.max(0,Math.min(1,e.life/e.max*1.7)),flash=Math.max(0,1-age/.42);
        c.globalAlpha=flash*.72;c.fillStyle='#fff9d7';c.fillRect(0,0,w,RULES.height);
        c.globalAlpha=fade;
        for(let ring=0;ring<3;ring++){
          const q=Math.min(1,Math.max(0,(age-ring*.18)/3.2)),rx=42+q*(e.radiusX*1.55+ring*32),ry=8+q*(90+ring*24);
          c.globalAlpha=fade*(1-q)*(.75-ring*.16);c.strokeStyle=ring===0?'#fff3ba':ring===1?'#ffae54':'#e7dbad';c.lineWidth=ring===0?5:2.4;
          c.beginPath();c.ellipse(x,e.y,rx,ry,0,0,Math.PI*2);c.stroke();
        }
        const fireFade=Math.max(0,1-age/2.8),fireRadius=92+Math.min(age,1.4)*150;
        if(fireFade>0){
          c.globalAlpha=fireFade*.88;
          const fire=c.createRadialGradient(x,e.y-42,4,x,e.y-42,fireRadius);
          fire.addColorStop(0,'#fffde9');fire.addColorStop(.2,'#fff3b0');fire.addColorStop(.48,'#ffb33d');fire.addColorStop(.78,'#ef5726b8');fire.addColorStop(1,'#e9462100');
          c.fillStyle=fire;c.beginPath();c.arc(x,e.y-42,fireRadius,0,Math.PI*2);c.fill();
        }
        const cloudGrowth=Math.min(1,age/2.3),cloudY=Math.max(78,e.y-56-cloudGrowth*104),cloudRx=92+cloudGrowth*218,cloudRy=36+cloudGrowth*30;
        const columnWidth=32+cloudGrowth*36,stem=c.createLinearGradient(x-columnWidth,cloudY+5,x+columnWidth,e.y+25);
        stem.addColorStop(0,'#ffdf8cbd');stem.addColorStop(.28,'#f59b42cc');stem.addColorStop(.68,'#d95a2db8');stem.addColorStop(1,'#57443766');
        c.globalAlpha=fade*.84;c.fillStyle=stem;c.beginPath();
        c.moveTo(x-columnWidth*.28,e.y+20);c.bezierCurveTo(x-columnWidth*.65,e.y-40,x-columnWidth,cloudY+cloudRy*.6,x-cloudRx*.56,cloudY+cloudRy*.28);
        c.lineTo(x+cloudRx*.56,cloudY+cloudRy*.28);c.bezierCurveTo(x+columnWidth,cloudY+cloudRy*.6,x+columnWidth*.65,e.y-40,x+columnWidth*.28,e.y+20);c.closePath();c.fill();
        const smokeFade=Math.max(.18,1-age/15);
        for(let i=0;i<17;i++){
          const a=i*Math.PI*2/17,offsetX=Math.cos(a)*cloudRx*.63,offsetY=Math.sin(a)*cloudRy*.62;
          const puff=22+(i%5)*8+cloudGrowth*15;
          c.globalAlpha=fade*smokeFade*(.62+(i%3)*.08);
          const smoke=c.createRadialGradient(x+offsetX-puff*.2,cloudY+offsetY-puff*.25,2,x+offsetX,cloudY+offsetY,puff*1.45);
          smoke.addColorStop(0,age<2?'#ffe4a9':'#8b8170');smoke.addColorStop(.42,age<2?'#a85a3d':'#514e49');smoke.addColorStop(1,'#292c2a00');
          c.fillStyle=smoke;c.beginPath();c.ellipse(x+offsetX,cloudY+offsetY,puff*1.45,puff*.88,a*.2,0,Math.PI*2);c.fill();
        }
        if(age<3.2){
          for(let i=0;i<44;i++){
            const a=i*2.399963,travel=age*(75+(i%9)*17),px=x+Math.cos(a)*travel,py=e.y-12+Math.sin(a)*travel*.48-age*52+age*age*18;
            c.globalAlpha=fade*Math.max(0,1-age/3.2)*(.38+(i%4)*.1);c.fillStyle=i%3?'#ffcb66':'#fff1bd';
            c.beginPath();c.arc(px,py,1.5+(i%3),0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='camp-barrage'){
        // The wall's arrows form a full-height defensive curtain. Each wave
        // advances across the horizontal strip while the lanes stay spread
        // from the top edge to the bottom edge of the battlefield.
        const dir=e.side?-1:1,range=e.range??RULES.campBarrageRange,waves=e.waves??RULES.campBarrageWaves,height=e.height??RULES.height;
        const fade=Math.max(0,e.life/e.max),stripLeft=dir>0?x-range*.04:x-range+range*.04;
        c.save();
        const curtain=c.createLinearGradient(stripLeft,0,stripLeft+range,0);
        curtain.addColorStop(0,e.side?'#397e9c18':'#a66b3218');curtain.addColorStop(.45,e.side?'#bdefff42':'#ffe7a04a');curtain.addColorStop(1,e.side?'#397e9c08':'#a66b3208');
        c.globalAlpha=fade*.8;c.fillStyle=curtain;c.fillRect(stripLeft,0,range,height);
        c.globalAlpha=fade*.7;c.strokeStyle=e.side?'#aeeeff':'#ffe3a0';c.lineWidth=2;c.setLineDash([10,14]);c.strokeRect(stripLeft,2,range,height-4);c.setLineDash([]);
        for(let lane=0;lane<7;lane++){
          const laneX=stripLeft+range*(.12+lane*.13),wave=Math.sin(p*8+lane)*3;
          c.globalAlpha=fade*(.18+lane%2*.08);c.strokeStyle=e.side?'#75d9eb':'#e4ad61';c.lineWidth=1;
          c.beginPath();c.moveTo(laneX,0);c.lineTo(laneX+dir*wave,height);c.stroke();
        }
        c.globalAlpha=fade*.95;c.strokeStyle=e.side?'#c9f7ff':'#fff0bf';c.lineWidth=2.2;
        c.beginPath();c.arc(x,e.y,24+p*16,-Math.PI*.72,Math.PI*.72);c.stroke();
        const progress=p*waves,arrowCount=28;
        for(let wave=0;wave<waves;wave++){
          const waveProgress=Math.min(1,Math.max(0,progress-wave));
          if(waveProgress<=0)continue;
          for(let i=0;i<arrowCount;i++){
            const laneY=height*(i+.5)/arrowCount+Math.sin(i*2.1+wave*1.7)*5;
            const distance=range*(.08+.86*waveProgress),ax=x+dir*distance,trail=34+18*(1-waveProgress),ay=laneY+Math.sin(p*6+i*.8+wave)*3;
            c.save();c.translate(ax,ay);c.rotate(dir>0?0:Math.PI);c.globalAlpha=fade*Math.min(1,waveProgress*5)*(.58+(i%4)*.1);
            c.strokeStyle=e.side?'#c8f6ff':'#ffe2a0';c.lineWidth=1.8;c.beginPath();c.moveTo(-trail,0);c.lineTo(8,0);c.stroke();
            c.fillStyle=e.side?'#f1ffff':'#fff5cf';c.beginPath();c.moveTo(15,0);c.lineTo(6,-4);c.lineTo(8,0);c.lineTo(6,4);c.closePath();c.fill();
            c.strokeStyle=e.side?'#77d6e8':'#d98f52';c.lineWidth=1;c.beginPath();c.moveTo(-trail,0);c.lineTo(-trail-8,-3);c.moveTo(-trail,0);c.lineTo(-trail-8,3);c.stroke();
            c.restore();
            const impact=Math.max(0,(waveProgress-.82)/.18);
            if(impact>0){
              const ix=x+dir*range*.88;c.globalAlpha=fade*(1-impact)*.55;c.strokeStyle=e.side?'#a6f1ff':'#ffd88d';c.lineWidth=1.2;c.beginPath();c.arc(ix,laneY,3+impact*8,0,Math.PI*2);c.stroke();
            }
          }
        }
        c.restore();
      }else if(e.type==='bandage'){
        // Zombie: only the strips of burial cloth are illuminated; the target
        // area stays unlit so the attack reads as a physical lash, not an AoE.
        const length=Math.sin(p*Math.PI),endX=x+(tx-x)*length,endY=e.y+(e.ty-e.y)*length;
        const fade=Math.max(0,e.life/e.max),pulse=Math.sin(Math.min(1,p)*Math.PI);
        const primary=e.side?'#62e8d2':'#b8f05e',secondary=e.side?'#4b8cff':'#ff9d45',hot=e.side?'#d8ffff':'#fff0b0';
        c.save();
        for(let i=0;i<3;i++){
          const wave=Math.sin(p*8+i*2.1)*12,offset=(i-1)*5;
          c.globalAlpha=fade*(.5+i*.1);c.strokeStyle=i===1?hot:primary;c.lineWidth=3.6-i*.8;c.lineCap='round';
          c.beginPath();c.moveTo(x,e.y+offset);c.bezierCurveTo(x+(tx-x)*.22,e.y-28+wave+offset,endX-32,endY+24-wave,endX,endY+offset);c.stroke();
          c.globalAlpha=fade*(.62-i*.1);c.strokeStyle=secondary;c.lineWidth=.9;c.beginPath();c.moveTo(x,e.y+offset-1.5);c.bezierCurveTo(x+(tx-x)*.22,e.y-28+wave+offset-1.5,endX-32,endY+24-wave,endX,endY+offset-1.5);c.stroke();
        }
        c.globalAlpha=fade*.8;c.strokeStyle=hot;c.lineWidth=1.2;c.beginPath();c.arc(endX,endY,3+pulse*3,0,Math.PI*2);c.stroke();
        c.restore();
      }else if(e.type==='strange'||e.type==='mandala'){
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const style=(e.variant??0)%4,fade=Math.min(1,Math.sqrt(Math.max(0,e.life/e.max))*1.65),q=Math.min(1,Math.max(0,p)),dir=e.side===0?1:-1;
        const primary=faction.glow,accent=faction.accent,deep=faction.banner,white='#f6fbff',mysticGold='#f0ad3e',goldLight='#fff0b3';
        const point=(t,bend=0)=>({x:(1-t)*(1-t)*x+2*(1-t)*t*((x+tx)*.5)+t*t*tx,
          y:(1-t)*(1-t)*e.y+2*(1-t)*t*((e.y+e.ty)*.5+dir*(38+bend))+t*t*e.ty});
        const seal=(cx,cy,r,rotation,alpha,color)=>{
          c.save();c.translate(cx,cy);c.rotate(rotation);c.globalAlpha=fade*alpha;c.strokeStyle=color;c.lineWidth=1.6;
          c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,0,r*.78,r*.34,0,0,Math.PI*2);c.stroke();
          for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*(r-3),Math.sin(a)*(r-3));c.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));c.stroke();}
          c.restore();
        };
        const trail=(t,span,color,width,alpha,bend=0,offset=0)=>{
          const start=Math.max(0,t-span);c.globalAlpha=fade*alpha;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();
          for(let i=0;i<=20;i++){const at=point(start+(t-start)*i/20,bend),y=at.y+Math.sin(Math.PI*(start+(t-start)*i/20))*offset;if(i===0)c.moveTo(at.x,y);else c.lineTo(at.x,y);}c.stroke();
        };
        const lance=(t,scale=1,bend=0)=>{
          const at=point(t,bend),angle=Math.atan2(e.ty-e.y,tx-x);c.save();c.translate(at.x,at.y);c.rotate(angle);
          const glow=c.createRadialGradient(0,0,1,0,0,22*scale);glow.addColorStop(0,white);glow.addColorStop(.22,accent);glow.addColorStop(.62,primary);glow.addColorStop(1,`${primary}00`);
          c.globalAlpha=fade*.8;c.fillStyle=glow;c.beginPath();c.arc(0,0,22*scale,0,Math.PI*2);c.fill();
          c.globalAlpha=fade;c.fillStyle=white;c.beginPath();c.moveTo(18*scale,0);c.lineTo(-3*scale,-6*scale);c.lineTo(-12*scale,0);c.lineTo(-3*scale,6*scale);c.closePath();c.fill();
          c.strokeStyle=accent;c.lineWidth=1.5;c.beginPath();c.moveTo(-8*scale,0);c.lineTo(-27*scale,0);c.stroke();c.restore();
        };
        const shieldDisc=(cx,cy,r,rotation,alpha)=>{
          c.save();c.translate(cx,cy);c.rotate(rotation);c.globalAlpha=fade*alpha;
          const face=c.createRadialGradient(-r*.28,-r*.34,1,0,0,r);face.addColorStop(0,goldLight);face.addColorStop(.24,mysticGold);face.addColorStop(.62,primary);face.addColorStop(1,deep);
          c.fillStyle=face;c.strokeStyle=goldLight;c.lineWidth=1.5;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();
          c.globalAlpha=fade*alpha*.9;c.strokeStyle=goldLight;c.lineWidth=1.1;
          for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*r*.46,Math.sin(a)*r*.46);c.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);c.stroke();}
          c.beginPath();c.arc(0,0,r*.4,-Math.PI*.82,Math.PI*.82);c.stroke();c.restore();
        };
        c.save();
        if(style===0){
          const charge=Math.min(1,q/.18),travel=Math.max(0,Math.min(1,(q-.12)/.68)),impact=Math.max(0,Math.min(1,(q-.78)/.22));
          // A recognizable golden sling-ring forms at the wrist, then sends
          // several flexible bands outward. Their loops cinch around the hit.
          seal(x+dir*18,e.y,9+charge*7,-q*6,.88,mysticGold);
          if(q>=.12&&q<.84){trail(travel,.22,deep,9,.3);trail(travel,.2,mysticGold,3.1,.96);lance(travel,.78);
            for(let i=0;i<3;i++){const offset=(i-1)*8,tip=point(travel,(i-1)*12+Math.sin(q*15+i*2)*7),tail=point(Math.max(0,travel-.28),(i-1)*12+Math.sin(q*15+i*2)*7);
              c.globalAlpha=fade*.44;c.strokeStyle=deep;c.lineWidth=6;c.beginPath();c.moveTo(tail.x,tail.y+offset);c.quadraticCurveTo((tail.x+tip.x)*.5,(tail.y+tip.y)*.5+dir*24,tip.x,tip.y+offset);c.stroke();
              c.globalAlpha=fade*.96;c.strokeStyle=i===1?goldLight:mysticGold;c.lineWidth=i===1?2.8:2;c.beginPath();c.moveTo(tail.x,tail.y+offset);c.quadraticCurveTo((tail.x+tip.x)*.5,(tail.y+tip.y)*.5+dir*24,tip.x,tip.y+offset);c.stroke();}}
          if(q>=.68){const cinch=Math.min(1,(q-.68)/.32);for(let i=0;i<3;i++){c.save();c.translate(tx,e.ty+(i-1)*4);c.rotate(dir*(cinch*5+i*.55));c.globalAlpha=fade*(1-cinch*.35);c.strokeStyle=i===1?goldLight:mysticGold;c.lineWidth=i===1?2.7:1.8;c.beginPath();c.ellipse(0,0,12+i*7+cinch*7,7+i*3,0,-Math.PI*.8,Math.PI*.8);c.stroke();c.restore();}
            const r=8+impact*34;seal(tx,e.ty,r,impact*5,1-impact*.45,mysticGold);c.globalAlpha=fade*(1-impact);c.strokeStyle=goldLight;c.lineWidth=2;
            for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(tx+Math.cos(a)*5,e.ty+Math.sin(a)*5);c.lineTo(tx+Math.cos(a)*(r+14),e.ty+Math.sin(a)*(r+14));c.stroke();}}
        }else if(style===1){
          const charge=Math.min(1,q/.2),travel=Math.max(0,Math.min(1,(q-.16)/.66)),impact=Math.max(0,Math.min(1,(q-.78)/.22));
          // The hand shield detaches as a rotating, rune-cut disc. A hard
          // circular shock-ring makes its hit read differently from a bolt.
          shieldDisc(x+dir*17,e.y,11+charge*8,q*2,.95);
          if(q>=.16&&q<.88){const at=point(travel,Math.sin(travel*Math.PI)*22),tail=point(Math.max(0,travel-.23),Math.sin(Math.max(0,travel-.23)*Math.PI)*22);
            c.globalAlpha=fade*.32;c.strokeStyle=deep;c.lineWidth=12;c.beginPath();c.moveTo(tail.x,tail.y);c.quadraticCurveTo((tail.x+at.x)*.5,(tail.y+at.y)*.5+dir*18,at.x,at.y);c.stroke();
            c.globalAlpha=fade*.9;c.strokeStyle=mysticGold;c.lineWidth=3;c.beginPath();c.moveTo(tail.x,tail.y);c.quadraticCurveTo((tail.x+at.x)*.5,(tail.y+at.y)*.5+dir*18,at.x,at.y);c.stroke();shieldDisc(at.x,at.y,14+Math.sin(travel*Math.PI)*5,travel*dir*12,1);}
          if(q>=.78){const r=8+impact*48;seal(tx,e.ty,r,-impact*3,1-impact*.4,mysticGold);c.globalAlpha=fade*(1-impact);c.strokeStyle=goldLight;c.lineWidth=2.4;c.beginPath();c.arc(tx,e.ty,r*.75,0,Math.PI*2);c.stroke();
            for(let i=0;i<8;i++){const a=i*Math.PI/4+impact*.18;c.globalAlpha=fade*(1-impact);c.strokeStyle=i%2?primary:mysticGold;c.lineWidth=i%2?1.6:2.6;c.beginPath();c.moveTo(tx+Math.cos(a)*6,e.ty+Math.sin(a)*6);c.lineTo(tx+Math.cos(a)*(r+13),e.ty+Math.sin(a)*(r+13));c.stroke();}}
        }else if(style===2){
          const travel=Math.max(0,Math.min(1,(q-.06)/.75)),impact=Math.max(0,Math.min(1,(q-.8)/.2));
          for(let i=0;i<3;i++){const t=Math.max(0,travel-i*.07),offset=(i-1)*20,at=point(t,(i-1)*24),previous=point(Math.max(0,t-.19),(i-1)*24);
            c.globalAlpha=fade*.52;c.strokeStyle=i===1?accent:primary;c.lineWidth=i===1?3.2:2;c.beginPath();c.moveTo(previous.x,previous.y+offset*.2);c.bezierCurveTo(previous.x+24,previous.y-dir*24,at.x-18,at.y+dir*17,at.x,at.y+offset);c.stroke();
            c.save();c.translate(at.x,at.y+offset);c.rotate(t*9+i*2);c.globalAlpha=fade;c.fillStyle=i===1?white:accent;c.beginPath();c.moveTo(10,0);c.lineTo(0,-5);c.lineTo(-9,0);c.lineTo(0,5);c.closePath();c.fill();c.restore();}
          if(q>=.8){const r=9+impact*35;seal(tx,e.ty,r,impact*7,.95,accent);for(let i=0;i<6;i++){const a=i*Math.PI/3;c.globalAlpha=fade*(1-impact);c.fillStyle=i%2?primary:white;c.beginPath();c.arc(tx+Math.cos(a)*impact*30,e.ty+Math.sin(a)*impact*30,2.5,0,Math.PI*2);c.fill();}}
        }else{
          // Hero signature: a faction-lit time gate charges, tears across the
          // lane as a layered comet, then fractures into a broad dimensional seal.
          const charge=Math.min(1,q/.24),travel=Math.max(0,Math.min(1,(q-.24)/.39)),impact=Math.max(0,Math.min(1,(q-.59)/.41));
          const ox=x+dir*18,oy=e.y-2,gate=12+charge*17;
          seal(ox,oy,gate,-q*8,.95,accent);seal(ox,oy,gate*.58,q*11,.82,primary);
          c.save();c.translate(ox,oy);c.rotate(-q*5);c.globalAlpha=fade*(1-charge*.24);c.fillStyle=white;
          for(let i=0;i<8;i++){const a=i*Math.PI/4;c.save();c.rotate(a);c.beginPath();c.moveTo(0,-gate-12);c.lineTo(4,-gate-2);c.lineTo(0,-gate+7);c.lineTo(-4,-gate-2);c.closePath();c.fill();c.restore();}c.restore();
          if(q>=.24&&q<.68){
            for(let i=3;i>=1;i--){const t=Math.max(0,travel-i*.075),echo=point(t,26);c.globalAlpha=fade*(.1+i*.045);c.fillStyle=i%2?accent:primary;c.beginPath();c.arc(echo.x,echo.y,8-i,0,Math.PI*2);c.fill();}
            trail(travel,.3,deep,18,.32,26);trail(travel,.28,primary,6,.98,26);trail(travel,.24,accent,2,.95,-20);lance(travel,1.25,26);
            const at=point(travel,26);seal(at.x,at.y,17+Math.sin(q*22)*3,q*9,.75,white);
          }
          if(q>=.59){
            const remain=1-impact,r=18+impact*74;
            seal(tx,e.ty,r,impact*3,remain*.98,primary);seal(tx,e.ty,r*.58,-impact*7,remain*.88,accent);
            c.save();c.translate(tx,e.ty);c.rotate(dir*.35+impact*.7);c.globalAlpha=fade*remain*.95;c.strokeStyle=white;c.lineWidth=3;
            c.beginPath();c.moveTo(0,-r*1.15);c.lineTo(r*.13,-r*.22);c.lineTo(-r*.08,0);c.lineTo(r*.17,r*.23);c.lineTo(0,r*1.15);c.stroke();c.restore();
            for(let i=0;i<12;i++){const a=i*Math.PI/6+dir*.12,distance=impact*(40+(i%3)*12),size=3+remain*2;c.globalAlpha=fade*remain;c.fillStyle=i%3===0?white:i%2?accent:primary;c.save();c.translate(tx+Math.cos(a)*distance,e.ty+Math.sin(a)*distance);c.rotate(a);c.beginPath();c.moveTo(size*2,0);c.lineTo(0,-size);c.lineTo(-size,0);c.lineTo(0,size);c.closePath();c.fill();c.restore();}
            const burst=c.createRadialGradient(tx,e.ty,2,tx,e.ty,r*.7);burst.addColorStop(0,`${white}ee`);burst.addColorStop(.18,accent);burst.addColorStop(.52,`${primary}80`);burst.addColorStop(1,`${primary}00`);
            c.globalAlpha=fade*Math.max(0,1-impact*1.7)*.9;c.fillStyle=burst;c.beginPath();c.arc(tx,e.ty,r*.7,0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='frost'){
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const style=(e.variant??0)%3,fade=Math.min(1,Math.sqrt(Math.max(0,e.life/e.max))*1.65),q=Math.min(1,Math.max(0,p)),dir=e.side===0?1:-1;
        const primary=faction.glow,accent=faction.accent,deep=faction.banner,white='#f4fbff';
        const point=t=>({x:(1-t)*(1-t)*x+2*(1-t)*t*((x+tx)*.5)+t*t*tx,
          y:(1-t)*(1-t)*e.y+2*(1-t)*t*((e.y+e.ty)*.5+dir*30)+t*t*e.ty});
        const bolt=(t,offset=0)=>{
          const at=point(t),angle=Math.atan2(e.ty-e.y,tx-x);
          c.save();c.translate(at.x,at.y+Math.sin(Math.PI*t)*offset);c.rotate(angle);
          const aura=c.createRadialGradient(0,0,1,0,0,14);aura.addColorStop(0,white);aura.addColorStop(.22,accent);aura.addColorStop(1,`${primary}00`);
          c.globalAlpha=fade*.9;c.fillStyle=aura;c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.fill();
          c.globalAlpha=fade;c.fillStyle=white;c.beginPath();c.moveTo(12,0);c.lineTo(-1,-4);c.lineTo(-7,0);c.lineTo(-1,4);c.closePath();c.fill();
          c.strokeStyle=primary;c.lineWidth=1.5;c.beginPath();c.moveTo(-5,0);c.lineTo(-22,0);c.stroke();c.restore();
        };
        const ring=(cx,cy,r,alpha,color,rotation=0)=>{
          c.save();c.translate(cx,cy);c.rotate(rotation);c.globalAlpha=fade*alpha;c.strokeStyle=color;c.lineWidth=1.5;
          c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,0,r*.78,r*.35,0,0,Math.PI*2);c.stroke();
          for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*(r-3),Math.sin(a)*(r-3));c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));c.stroke();}
          c.restore();
        };
        c.save();
        if(style===0){
          // Focused sigil needle: the staff gathers a small rune before a clean,
          // fast bolt lands with a crisp starburst rather than a white beam.
          const travel=Math.max(0,Math.min(1,(q-.08)/.72)),impact=Math.max(0,Math.min(1,(q-.79)/.21));
          ring(x+dir*10,e.y,5+Math.min(1,q/.14)*5,.58,primary,q*3);
          if(q>=.08&&q<.84){
            const at=point(travel),previous=point(Math.max(0,travel-.2));
            c.globalAlpha=fade*.28;c.strokeStyle=deep;c.lineWidth=7;c.beginPath();c.moveTo(previous.x,previous.y);c.lineTo(at.x,at.y);c.stroke();
            c.globalAlpha=fade*.95;c.strokeStyle=primary;c.lineWidth=2.2;c.beginPath();c.moveTo(previous.x,previous.y);c.lineTo(at.x,at.y);c.stroke();bolt(travel);
          }
          if(q>=.79){const r=5+impact*27;c.globalAlpha=fade*(1-impact);c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.arc(tx,e.ty,r,0,Math.PI*2);c.stroke();
            c.strokeStyle=white;c.beginPath();c.moveTo(tx-r*.65,e.ty);c.lineTo(tx+r*.65,e.ty);c.moveTo(tx,e.ty-r*.65);c.lineTo(tx,e.ty+r*.65);c.stroke();}
        }else if(style===1){
          // A fan of three independently spiralling shards converges on a
          // turning hex seal; the single existing hit is still resolved once.
          const travel=Math.max(0,Math.min(1,(q-.05)/.76)),impact=Math.max(0,Math.min(1,(q-.8)/.2));
          for(let i=0;i<3;i++){
            const t=Math.max(0,travel-i*.075),at=point(t),previous=point(Math.max(0,t-.16)),spread=Math.sin(t*Math.PI)*(i-1)*20;
            c.globalAlpha=fade*.38;c.strokeStyle=i===1?primary:accent;c.lineWidth=4;c.beginPath();c.moveTo(previous.x,previous.y+spread*.4);c.quadraticCurveTo(at.x-12,at.y+spread,at.x,at.y+spread);c.stroke();
            c.save();c.translate(at.x,at.y+spread);c.rotate(t*9+i*2);c.globalAlpha=fade;c.fillStyle=i===1?white:accent;c.beginPath();c.moveTo(6,0);c.lineTo(0,-4);c.lineTo(-7,0);c.lineTo(0,4);c.closePath();c.fill();c.restore();
          }
          if(q>=.8){const r=7+impact*30;c.globalAlpha=fade*(1-impact);c.strokeStyle=primary;c.lineWidth=2;c.beginPath();c.moveTo(tx-r,e.ty);c.lineTo(tx,e.ty-r*.7);c.lineTo(tx+r,e.ty);c.lineTo(tx,e.ty+r*.7);c.closePath();c.stroke();
            for(let i=0;i<6;i++){const a=i*Math.PI/3,travelled=impact*20;c.fillStyle=accent;c.globalAlpha=fade*(1-impact);c.beginPath();c.arc(tx+Math.cos(a)*travelled,e.ty+Math.sin(a)*travelled,2,0,Math.PI*2);c.fill();}}
        }else{
          // Signature: an astral gate opens beside the mage, feeds a layered
          // comet down a curved path, then leaves a rotating seal and fragments.
          const charge=Math.min(1,q/.22),travel=Math.max(0,Math.min(1,(q-.22)/.4)),impact=Math.max(0,Math.min(1,(q-.58)/.42));
          const ox=x+dir*12,oy=e.y-2,originRadius=9+charge*12;
          ring(ox,oy,originRadius,.92,accent,-q*7);ring(ox,oy,originRadius*.62,.72,primary,q*9);
          c.save();c.translate(ox,oy);c.rotate(q*4);c.globalAlpha=fade*(1-charge*.35);c.fillStyle=accent;
          for(let i=0;i<6;i++){const a=i*Math.PI/3;c.save();c.rotate(a);c.beginPath();c.moveTo(0,-originRadius-7);c.lineTo(3,-originRadius-1);c.lineTo(0,-originRadius+5);c.lineTo(-3,-originRadius-1);c.closePath();c.fill();c.restore();}c.restore();
          if(q>=.22&&q<.72){
            for(let i=3;i>=1;i--){const t=Math.max(0,travel-i*.075),at=point(t);c.globalAlpha=fade*(.08+i*.035);c.fillStyle=primary;c.beginPath();c.arc(at.x,at.y,8-i,0,Math.PI*2);c.fill();}
            const at=point(travel),previous=point(Math.max(0,travel-.22));
            c.globalAlpha=fade*.25;c.strokeStyle=deep;c.lineWidth=15;c.beginPath();c.moveTo(previous.x,previous.y);c.quadraticCurveTo((previous.x+at.x)*.5,(previous.y+at.y)*.5-dir*9,at.x,at.y);c.stroke();
            c.globalAlpha=fade*.88;c.strokeStyle=primary;c.lineWidth=4;c.beginPath();c.moveTo(previous.x,previous.y);c.quadraticCurveTo((previous.x+at.x)*.5,(previous.y+at.y)*.5-dir*9,at.x,at.y);c.stroke();
            c.globalAlpha=fade*.9;c.strokeStyle=accent;c.lineWidth=1.3;c.beginPath();c.moveTo(previous.x,previous.y-2);c.lineTo(at.x,at.y-2);c.stroke();bolt(travel);
          }
          if(q>=.7){
            const remain=1-impact,sealRadius=12+impact*68;
            ring(tx,e.ty,sealRadius,remain*.88,primary,impact*5);ring(tx,e.ty,sealRadius*.58,remain*.65,accent,-impact*7);
            c.save();c.translate(tx,e.ty);c.rotate(impact*1.1);c.globalAlpha=fade*remain*.8;c.strokeStyle=accent;c.lineWidth=2;
            c.beginPath();c.moveTo(0,-sealRadius);c.lineTo(sealRadius*.72,0);c.lineTo(0,sealRadius);c.lineTo(-sealRadius*.72,0);c.closePath();c.stroke();c.restore();
            for(let i=0;i<8;i++){const a=i*Math.PI/4+dir*.2,dist=impact*60,size=3+remain*2;c.globalAlpha=fade*remain;c.fillStyle=i%2?accent:white;c.save();c.translate(tx+Math.cos(a)*dist,e.ty+Math.sin(a)*dist);c.rotate(a);c.beginPath();c.moveTo(size*1.8,0);c.lineTo(0,-size);c.lineTo(-size,0);c.lineTo(0,size);c.closePath();c.fill();c.restore();}
            const flare=c.createRadialGradient(tx,e.ty,1,tx,e.ty,24+impact*28);flare.addColorStop(0,`${white}`);flare.addColorStop(.2,accent);flare.addColorStop(1,`${primary}00`);
            c.globalAlpha=fade*Math.max(0,1-impact*1.8)*.72;c.fillStyle=flare;c.beginPath();c.arc(tx,e.ty,24+impact*28,0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='arrow'){
        // Archer attacks are visual variants only: all three use the same
        // damage and cooldown contract while reading as distinct techniques.
        const style=e.variant??0,fade=Math.max(0,e.life/e.max);
        const primary=e.side?'#65d8ff':'#ffbf55',secondary=e.side?'#9b7bff':'#ff5578',hot=e.side?'#efffff':'#fff3c4';
        const drawArrow=(ax,ay,angle,scale=1,alpha=1)=>{
          c.save();c.translate(ax,ay);c.rotate(angle);c.globalAlpha=fade*alpha;
          const tail=15*scale;
          c.globalAlpha=fade*alpha*.22;c.strokeStyle=primary;c.lineWidth=5*scale;c.lineCap='round';c.beginPath();c.moveTo(-tail-8*scale,0);c.lineTo(-tail+5*scale,0);c.stroke();
          c.globalAlpha=fade*alpha;
          c.strokeStyle=primary;c.lineWidth=2.2*scale;c.beginPath();c.moveTo(-tail,0);c.lineTo(10*scale,0);c.stroke();
          c.strokeStyle=hot;c.lineWidth=1;c.beginPath();c.moveTo(-tail+2,-1);c.lineTo(8*scale,-1);c.stroke();
          const head=c.createLinearGradient(7*scale,0,17*scale,0);head.addColorStop(0,hot);head.addColorStop(.55,primary);head.addColorStop(1,secondary);
          c.fillStyle=head;c.beginPath();c.moveTo(17*scale,0);c.lineTo(7*scale,-4.5*scale);c.lineTo(9*scale,0);c.lineTo(7*scale,4.5*scale);c.closePath();c.fill();
          c.strokeStyle=secondary;c.lineWidth=1.4*scale;c.beginPath();c.moveTo(-tail,0);c.lineTo(-tail-8*scale,-4*scale);c.moveTo(-tail,0);c.lineTo(-tail-8*scale,4*scale);c.stroke();
          c.strokeStyle=hot;c.lineWidth=.9*scale;c.beginPath();c.moveTo(-tail+1,-1.5*scale);c.lineTo(-tail-7*scale,-5*scale);c.moveTo(-tail+1,1.5*scale);c.lineTo(-tail-7*scale,5*scale);c.stroke();
          c.restore();
        };
        if(style===0){
          // Precision shot: a clean, readable line with a feather glint.
          const px=x+(tx-x)*p,py=e.y+(e.ty-e.y)*p,angle=Math.atan2(e.ty-e.y,tx-x);
          drawArrow(px,py,angle);
          c.globalAlpha=fade*.45*(1-p);c.strokeStyle=hot;c.lineWidth=1;c.beginPath();c.arc(px,py,5+p*7,0,Math.PI*2);c.stroke();
        }else if(style===1){
          // Twin-flight shot: the two arrows briefly separate, then converge
          // into a double impact ring without changing the hit calculation.
          const angle=Math.atan2(e.ty-e.y,tx-x),nx=-Math.sin(angle),ny=Math.cos(angle),spread=Math.sin(p*Math.PI)*12;
          const px=x+(tx-x)*p,py=e.y+(e.ty-e.y)*p;
          drawArrow(px+nx*spread,py+ny*spread,angle-.035,.86,.9);
          drawArrow(px-nx*spread,py-ny*spread,angle+.035,.86,.9);
          c.globalAlpha=fade*(.35+.55*p);c.strokeStyle=secondary;c.lineWidth=1.4;c.beginPath();c.arc(px,py,7+Math.sin(p*Math.PI)*13,0,Math.PI*2);c.stroke();
          for(let i=0;i<4;i++){const a=i*Math.PI/2+p*2;c.globalAlpha=fade*.6;c.fillStyle=hot;c.fillRect(px+Math.cos(a)*(10+p*7)-1,py+Math.sin(a)*(10+p*7)-1,2,2);}
        }else{
          // Signature technique: the archer draws a luminous seal, releases a
          // comet-like arrow on a curved path, then leaves a layered impact.
          const charge=Math.min(1,p/.24),flight=Math.max(0,(p-.18)/.82),curve=Math.sin(flight*Math.PI)*34;
          const qx=x+(tx-x)*flight, qy=e.y+(e.ty-e.y)*flight-curve;
          if(p<.3){
            c.save();c.translate(x,e.y);c.globalAlpha=fade*(.25+.65*charge);c.strokeStyle=primary;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.arc(0,0,12+charge*13,-2.4,2.4);c.stroke();c.setLineDash([]);
            c.strokeStyle=hot;c.lineWidth=1;c.beginPath();c.arc(0,0,5+charge*8,p*8,p*8+2.8);c.stroke();c.restore();
          }
          if(p>=.12){
            const angle=Math.atan2(e.ty-e.y-curve*Math.cos(flight*Math.PI)*Math.PI/1.8,tx-x);
            for(let i=4;i>=1;i--){const trail=Math.max(0,flight-i*.055),trailCurve=Math.sin(trail*Math.PI)*34;drawArrow(x+(tx-x)*trail, e.y+(e.ty-e.y)*trail-trailCurve, angle, .72, .12+i*.07);}
            drawArrow(qx,qy,angle,1.05,1);
            c.globalAlpha=fade*.42;c.strokeStyle=secondary;c.lineWidth=1.6;c.beginPath();c.moveTo(x,e.y);c.quadraticCurveTo((x+tx)/2,(e.y+e.ty)/2-50,tx,e.ty);c.stroke();
          }
          if(p>.72){
            const impact=(p-.72)/.28;c.globalAlpha=fade*(1-impact)*.9;c.strokeStyle=hot;c.lineWidth=2.2;c.beginPath();c.arc(tx,e.ty,8+impact*25,0,Math.PI*2);c.stroke();
            for(let i=0;i<8;i++){const a=i*Math.PI/4+p*4,len=10+impact*(18+(i%3)*7);c.globalAlpha=fade*(1-impact)*.7;c.strokeStyle=i%2?primary:secondary;c.lineWidth=1.5;c.beginPath();c.moveTo(tx+Math.cos(a)*6,e.ty+Math.sin(a)*6);c.lineTo(tx+Math.cos(a)*len,e.ty+Math.sin(a)*len);c.stroke();}
            c.globalAlpha=fade*(1-impact)*.7;c.fillStyle=hot;c.beginPath();c.arc(tx,e.ty,4+impact*7,0,Math.PI*2);c.fill();
          }
        }
      }else if(e.type==='charge'){
        // Northern cavalry leaves a frost lance, hoof-rune and crystal burst.
        // Other factions keep their warm dust-and-steel cavalry signature.
        const px=x+(tx-x)*p,py=e.y+(e.ty-e.y)*p,angle=Math.atan2(e.ty-e.y,tx-x);
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        if(faction.id==='north'){
          const fade=Math.max(0,e.life/e.max),q=Math.min(1,Math.max(0,p)),dir=e.side===0?1:-1;
          const charge=Math.min(1,q/.2),travel=Math.min(1,Math.max(0,(q-.12)/.62)),impact=Math.min(1,Math.max(0,(q-.68)/.32));
          const sx=x+dir*10,sy=e.y+5,primary='#2edbff',ice='#f1fff7',deep='#008f4c';
          c.save();c.lineCap='round';c.lineJoin='round';
          c.globalAlpha=fade*(.25+charge*.55);c.strokeStyle=deep;c.lineWidth=10;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo((sx+px)*.5,sy-10,px,py);c.stroke();
          c.globalAlpha=fade*.9;c.strokeStyle=primary;c.lineWidth=3.4;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo((sx+px)*.5,sy-10,px,py);c.stroke();
          c.globalAlpha=fade;c.strokeStyle=ice;c.lineWidth=1.1;c.beginPath();c.moveTo(sx,sy-1);c.lineTo(px,py-1);c.stroke();
          c.save();c.translate(px,py);c.rotate(dir*(travel*4+q*2));
          c.globalAlpha=fade*(.7+charge*.3);c.strokeStyle=ice;c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,7+charge*8,3+charge*3,0,0,Math.PI*2);c.stroke();
          c.globalAlpha=fade*.82;c.strokeStyle=primary;c.beginPath();c.ellipse(0,0,4+charge*5,8+charge*4,0,0,Math.PI*2);c.stroke();
          for(let i=0;i<4;i++){const a=i*Math.PI/2+travel*5;c.globalAlpha=fade*.9;c.fillStyle=i%2?ice:primary;c.beginPath();c.moveTo(Math.cos(a)*5,Math.sin(a)*5);c.lineTo(Math.cos(a)*12,Math.sin(a)*12-3);c.lineTo(Math.cos(a)*6-2,Math.sin(a)*6);c.closePath();c.fill();}
          c.restore();
          if(q>.68){
            const radius=8+impact*30;c.globalAlpha=fade*(1-impact*.55);c.strokeStyle=ice;c.lineWidth=2;c.beginPath();c.arc(tx,e.ty,radius,0,Math.PI*2);c.stroke();
            c.globalAlpha=fade*(1-impact*.62);c.strokeStyle=primary;c.lineWidth=1.5;c.beginPath();c.ellipse(tx,e.ty+3,radius*1.2,radius*.45,0,0,Math.PI*2);c.stroke();
            for(let i=0;i<8;i++){const a=i*Math.PI/4+dir*.12,len=9+impact*(15+(i%3)*5),tipX=tx+Math.cos(a)*len,tipY=e.ty+Math.sin(a)*len;
              c.globalAlpha=fade*(1-impact*.7);c.fillStyle=i%2?ice:primary;c.beginPath();c.moveTo(tx+Math.cos(a)*4,e.ty+Math.sin(a)*4);c.lineTo(tipX,tipY);c.lineTo(tx+Math.cos(a+Math.PI/2)*3,e.ty+Math.sin(a+Math.PI/2)*3);c.closePath();c.fill();}
          }
          for(let i=0;i<5;i++){const t=(q*1.4+i/5)%1,pxTrail=x+(tx-x)*t,pyTrail=e.y+(e.ty-e.y)*t-7*Math.sin(t*Math.PI);c.globalAlpha=fade*(1-t)*.75;c.fillStyle=i%2?ice:primary;c.beginPath();c.arc(pxTrail,pyTrail,1.2+(i%2)*.5,0,Math.PI*2);c.fill();}
          c.restore();
        }else{
          c.save();c.translate(px,py);c.rotate(angle);c.globalAlpha*=.75;
          c.strokeStyle=e.side?'#a9d8ee':'#f0bd73';c.lineWidth=3;c.beginPath();c.moveTo(-28,0);c.lineTo(18,0);c.stroke();
          c.strokeStyle='#fff4c0';c.lineWidth=1.5;c.beginPath();c.moveTo(-22,-4);c.lineTo(14,-4);c.moveTo(-22,4);c.lineTo(14,4);c.stroke();
          c.fillStyle='#d6bf8a';for(let i=0;i<5;i++){const a=i*1.3+p*3;c.beginPath();c.arc(-18+Math.cos(a)*18,7+Math.sin(a)*7,1.8,0,Math.PI*2);c.fill();}
          c.restore();
        }
      }else if(e.type==='drain'){
        // One existing hit is expressed as three blood-draining techniques.
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const accent=faction.accent,primary=faction.glow,deep=faction.banner;
        const dir=e.side===0?1:-1,q=Math.min(1,Math.max(0,p)),fade=Math.min(1,Math.max(0,(1-q)/.18));
        const impactX=tx-dir*5,impactY=e.ty,controlX=(x+impactX)*.5;
        const controlY=(e.y+impactY)*.5+(e.side?-24:24);
        const point=(t,offset=0)=>({
          x:(1-t)*(1-t)*x+2*(1-t)*t*controlX+t*t*impactX,
          y:(1-t)*(1-t)*e.y+2*(1-t)*t*controlY+t*t*impactY+Math.sin(Math.PI*t)*offset
        });
        const siphon=(amount,offset=0,color='#bd334e',width=2.5,alpha=.8)=>{
          if(amount<=0)return;
          c.globalAlpha=fade*alpha;c.strokeStyle=deep;c.lineWidth=width+4;c.beginPath();
          for(let i=0;i<=24;i++){const t=1-amount*i/24,v=point(t,offset);if(i===0)c.moveTo(v.x,v.y);else c.lineTo(v.x,v.y);}c.stroke();
          c.globalAlpha=fade*Math.min(.96,alpha+.12);c.strokeStyle=color;c.lineWidth=width;c.beginPath();
          for(let i=0;i<=24;i++){const t=1-amount*i/24,v=point(t,offset);if(i===0)c.moveTo(v.x,v.y);else c.lineTo(v.x,v.y);}c.stroke();
          c.globalAlpha=fade*.84;c.strokeStyle='#ffe3db';c.lineWidth=Math.max(.7,width*.28);c.beginPath();
          for(let i=0;i<=24;i++){const t=1-amount*i/24,v=point(t,offset);if(i===0)c.moveTo(v.x,v.y-1);else c.lineTo(v.x,v.y-1);}c.stroke();
        };
        const bloodMotes=(amount,count=5,offset=0)=>{
          for(let i=0;i<count;i++){
            const travel=amount*((q*1.9+i/count)%1),v=point(1-travel,offset+Math.sin(q*12+i)*1.5);
            c.globalAlpha=fade*(.5+Math.sin(q*19+i*2)*.22);c.fillStyle=i%3===0?'#ffe6d9':'#e64d68';
            c.beginPath();c.ellipse(v.x,v.y,2+(i%2)*.5,3+(i%3)*.45,dir*.4,0,Math.PI*2);c.fill();
          }
        };
        const siphonHead=(amount,offset=0)=>{
          if(amount<=.08)return;
          const v=point(1-amount,offset);c.globalAlpha=fade*.96;c.fillStyle='#df3f5b';
          c.beginPath();c.ellipse(v.x,v.y,3.3,5.1,dir*.28,0,Math.PI*2);c.fill();
          c.globalAlpha=fade*.92;c.fillStyle='#ffe5dc';c.beginPath();c.ellipse(v.x-dir*.8,v.y-1.6,1,1.8,dir*.2,0,Math.PI*2);c.fill();
        };
        c.save();c.lineCap='round';c.lineJoin='round';
        if(e.variant===0){
          // Blood Draw: three close claw marks open a wound, then veins pull
          // a thin, readable stream from the victim back into the vampire.
          const wound=Math.min(1,Math.max(0,(q-.12)/.35));
          if(wound>0){
            c.globalAlpha=fade*wound*.75;c.strokeStyle=accent;c.lineWidth=1.8;
            for(let i=0;i<3;i++){const yy=impactY+(i-1)*4;c.beginPath();c.moveTo(impactX-dir*5,yy-3);c.quadraticCurveTo(impactX,yy,impactX+dir*4,yy+3);c.stroke();}
            c.globalAlpha=fade*wound*.45;c.fillStyle='#d73555';c.beginPath();c.arc(impactX,impactY,3+wound*3,0,Math.PI*2);c.fill();
          }
          const draw=Math.min(1,Math.max(0,(q-.34)/.6));
          siphon(draw,0,'#d13d58',2.2,.76);siphonHead(draw);if(draw>.12)bloodMotes(draw,4);
          c.globalAlpha=fade*.72;c.strokeStyle=primary;c.lineWidth=1.2;c.beginPath();c.arc(x,e.y,5+draw*3,q*3,q*3+Math.PI*1.25);c.stroke();
        }else if(e.variant===1){
          // Talon Rake: three separate cuts fan across the target; each cut
          // becomes its own short blood thread before all flow home.
          const rake=Math.min(1,Math.max(0,(q-.08)/.36));
          for(let i=0;i<3;i++){
            const start=impactX-dir*(3+i*2),y=impactY+(i-1)*5;
            c.globalAlpha=fade*rake*.78;c.strokeStyle=i===1?'#ffe1dc':accent;c.lineWidth=i===1?1.8:1.35;
            c.beginPath();c.moveTo(start,y-5);c.quadraticCurveTo(impactX+dir*3,y-1,impactX+dir*(6+i),y+5);c.stroke();
          }
          if(q>.35){const pull=Math.min(1,(q-.35)/.6);for(let i=0;i<3;i++)siphon(pull,(i-1)*3,i===1?'#e54f67':'#b72d4b',i===1?1.7:1.25,.62);siphonHead(pull);bloodMotes(pull,7);}
          if(rake>0){c.globalAlpha=fade*rake*.5;c.strokeStyle=primary;c.lineWidth=1;c.beginPath();c.arc(impactX,impactY,8+rake*7,-.8,1.1);c.stroke();}
        }else{
          // Signature: Blood Oath. A seal primes the grasp; several tendrils
          // seize the target, then the captured blood streams back in layers.
          const cinematic=Math.min(1,fade*1.8),gather=Math.max(0,1-q/.23),flight=Math.min(1,Math.max(0,(q-.16)/.57));
          if(gather>0){
            c.save();c.translate(x,e.y);c.rotate(q*5*(e.side?-1:1));
            c.globalAlpha=cinematic*gather*.52;c.strokeStyle=accent;c.lineWidth=1.6;c.setLineDash([3,4]);c.beginPath();c.arc(0,0,9+gather*10,-2.35,2.55);c.stroke();c.setLineDash([]);
            c.globalAlpha=cinematic*gather*.76;c.strokeStyle=primary;c.lineWidth=1.3;c.beginPath();c.moveTo(-6,0);c.quadraticCurveTo(0,-8,6,0);c.quadraticCurveTo(0,8,-6,0);c.stroke();
            for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.globalAlpha=cinematic*gather*.75;c.fillStyle=i%2?accent:'#ffe7df';c.beginPath();c.arc(Math.cos(a)*(12+gather*7),Math.sin(a)*(12+gather*7),1.3,0,Math.PI*2);c.fill();}
            c.restore();
          }
          if(flight>0){
            const lash=Math.max(0,(flight-.22)/.78);
            for(let i=0;i<3;i++){
              const v=point(flight,(i-1)*6-Math.sin(flight*Math.PI)*16);
              c.globalAlpha=cinematic*(.24+i*.08);c.strokeStyle=i===1?primary:accent;c.lineWidth=i===1?3.4:1.8;
              c.beginPath();c.moveTo(x,e.y+(i-1)*3);c.quadraticCurveTo((x+v.x)*.5,controlY-Math.sin(flight*Math.PI)*18+(i-1)*6,v.x,v.y);c.stroke();
              c.globalAlpha=cinematic*.92;c.fillStyle=i===1?'#ffe4dc':'#d93d5d';c.beginPath();c.arc(v.x,v.y,2.2+Math.sin(flight*Math.PI),0,Math.PI*2);c.fill();
            }
            if(lash>0){c.globalAlpha=cinematic*lash*.48;c.strokeStyle='#fff0e5';c.lineWidth=1.5;c.beginPath();c.arc(impactX,impactY,7+lash*13,-.8,1.4);c.stroke();}
          }
          if(q>.58){
            const draw=Math.min(1,(q-.58)/.42),radius=7+draw*22,pull=Math.min(1,Math.max(0,(q-.68)/.32));
            c.globalAlpha=cinematic*(1-draw*.58);c.strokeStyle='#ffe7df';c.lineWidth=1.8;c.beginPath();c.arc(impactX,impactY,radius,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematic*(1-draw*.55);c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.arc(impactX,impactY,Math.max(3,radius-7),q*5,q*5+Math.PI*1.45);c.stroke();
            for(let i=0;i<8;i++){const a=i*Math.PI/4+(e.side?Math.PI:0),travel=8+draw*(17+(i%3)*4);c.globalAlpha=cinematic*(1-draw*.64);c.strokeStyle=i%2?primary:'#fff1d9';c.lineWidth=i%2?1.2:1.8;c.beginPath();c.moveTo(impactX+Math.cos(a)*4,impactY+Math.sin(a)*3);c.lineTo(impactX+Math.cos(a)*travel,impactY+Math.sin(a)*travel);c.stroke();}
            if(pull>0){siphon(pull,0,'#e54461',4,.94);siphon(pull,5,primary,1.4,.8);siphon(pull,-5,accent,1.4,.8);siphonHead(pull);bloodMotes(pull,11);}
          }
        }
        c.restore();
      }else if(e.type==='sweep'){
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const primary='#ff1838',accent='#ff5266',deep='#310813',contrast='#fff3f4',factionLight=faction.glow;
        const dir=e.side===0?1:-1,fade=Math.max(0,e.life/e.max),q=Math.min(1,Math.max(0,p));
        const impactX=tx-dir*6,impactY=e.ty;
        c.save();c.lineCap='round';c.lineJoin='round';
        if(e.variant===0){
          // Quick duelist thrust: a small emitter flare feeds a needle-straight
          // blade trail, then snaps into a compact red-white contact spark.
          const charge=Math.max(0,1-q/.17),flight=Math.min(1,Math.max(0,(q-.1)/.61));
          const ox=x+dir*13,oy=e.y-8;
          if(charge>0){c.globalAlpha=fade*charge*.8;c.shadowColor=primary;c.shadowBlur=10;c.fillStyle=accent;c.beginPath();c.arc(ox,oy,3+charge*4,0,Math.PI*2);c.fill();c.shadowBlur=0;}
          if(flight>0){
            const hx=ox+(impactX-ox)*flight,hy=oy+(impactY-oy)*flight;
            c.globalAlpha=fade*.28;c.strokeStyle=deep;c.lineWidth=13;c.beginPath();c.moveTo(ox,oy);c.lineTo(hx,hy);c.stroke();
            c.globalAlpha=fade*.9;c.shadowColor=primary;c.shadowBlur=12;c.strokeStyle=primary;c.lineWidth=5;c.beginPath();c.moveTo(ox,oy);c.lineTo(hx,hy);c.stroke();
            c.shadowBlur=0;c.globalAlpha=fade;c.strokeStyle=contrast;c.lineWidth=1.3;c.beginPath();c.moveTo(ox,oy);c.lineTo(hx,hy);c.stroke();
          }
          if(q>.52){const hit=Math.min(1,(q-.52)/.48),r=4+hit*18;c.globalAlpha=fade*(1-hit*.45);c.strokeStyle=accent;c.lineWidth=2.2;c.beginPath();c.arc(impactX,impactY,r,0,Math.PI*2);c.stroke();
            c.globalAlpha=fade*(1-hit);c.fillStyle=contrast;c.beginPath();c.arc(impactX,impactY,2+hit*2,0,Math.PI*2);c.fill();
            for(let i=0;i<6;i++){const a=i*Math.PI/3+(e.side?Math.PI:0),reach=6+hit*(15+i%2*6);c.globalAlpha=fade*(1-hit*.7);c.strokeStyle=i%3===0?factionLight:accent;c.lineWidth=i%3===0?1.7:2;c.beginPath();c.moveTo(impactX,impactY);c.lineTo(impactX+Math.cos(a)*reach,impactY+Math.sin(a)*reach);c.stroke();}}
        }else if(e.variant===1){
          // Cross-cut: two opposed red blade strokes arrive in sequence and
          // briefly form a sharp X at the target.
          const charge=Math.max(0,1-q/.2),flight=Math.min(1,Math.max(0,(q-.14)/.51));
          if(charge>0){c.globalAlpha=fade*charge*.65;c.strokeStyle=primary;c.lineWidth=2;c.beginPath();c.arc(x+dir*15,e.y-13,8+charge*8,-2.2,1.1);c.stroke();}
          if(flight>0){
            const progress=flight,trail=(t,offset)=>({x:x+dir*16+(impactX-x-dir*16)*t,y:e.y-31+offset+(impactY-e.y+31-offset)*t});
            for(let slash=0;slash<2;slash++){
              const lag=slash?.12:0,t=Math.max(0,progress-lag),start=trail(Math.max(0,t-.55),slash?27:-25),head=trail(t,slash?-25:27);
              c.globalAlpha=fade*.3;c.strokeStyle=deep;c.lineWidth=12;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(head.x,head.y);c.stroke();
              c.globalAlpha=fade*.92;c.shadowColor=primary;c.shadowBlur=10;c.strokeStyle=primary;c.lineWidth=5.4;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(head.x,head.y);c.stroke();
              c.shadowBlur=0;c.globalAlpha=fade;c.strokeStyle=contrast;c.lineWidth=1.25;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(head.x,head.y);c.stroke();
            }
          }
          if(q>.48){const hit=Math.min(1,(q-.48)/.52),size=9+hit*26;c.globalAlpha=fade*(1-hit*.62);c.strokeStyle=accent;c.lineWidth=2.4;c.beginPath();c.moveTo(impactX-size,impactY-size);c.lineTo(impactX+size,impactY+size);c.moveTo(impactX+size,impactY-size);c.lineTo(impactX-size,impactY+size);c.stroke();
            c.globalAlpha=fade*(1-hit*.7);c.strokeStyle=contrast;c.lineWidth=1.1;c.beginPath();c.moveTo(impactX-size*.72,impactY-size*.72);c.lineTo(impactX+size*.72,impactY+size*.72);c.stroke();
            for(let i=0;i<8;i++){const a=i*Math.PI/4,reach=10+hit*(17+i%3*5);c.globalAlpha=fade*(1-hit*.72);c.strokeStyle=i%3===0?factionLight:accent;c.lineWidth=1.7;c.beginPath();c.moveTo(impactX,impactY);c.lineTo(impactX+Math.cos(a)*reach,impactY+Math.sin(a)*reach);c.stroke();}}
        }else{
          // Signature: Crimson Eclipse. Charge around the guard, unleash a
          // layered crescent with an afterimage, then leave a saber-shaped
          // shock cut, expanding rings, faction glints and ember fragments.
          const cinematic=Math.min(1,fade*2.5),gather=Math.max(0,1-q/.27),flight=Math.min(1,Math.max(0,(q-.19)/.39));
          if(gather>0){
            c.save();c.translate(x+dir*12,e.y-8);c.rotate(q*5*(e.side?-1:1));c.globalAlpha=cinematic*gather*.25;c.fillStyle=deep;c.beginPath();c.arc(0,0,23+gather*12,0,Math.PI*2);c.fill();
            c.globalAlpha=cinematic*gather*.9;c.strokeStyle=primary;c.lineWidth=2.5;c.setLineDash([5,4]);c.beginPath();c.arc(0,0,17+gather*12,-2.6,2.35);c.stroke();c.setLineDash([]);
            c.globalAlpha=cinematic*gather;c.shadowColor=primary;c.shadowBlur=12;c.fillStyle=contrast;c.beginPath();c.arc(0,0,2+gather*2,0,Math.PI*2);c.fill();c.shadowBlur=0;
            for(let i=0;i<7;i++){const a=i*Math.PI*2/7;c.globalAlpha=cinematic*gather*.9;c.fillStyle=i%3===0?factionLight:accent;c.beginPath();c.arc(Math.cos(a)*(21+gather*9),Math.sin(a)*(21+gather*9),1.8,0,Math.PI*2);c.fill();}c.restore();
          }
          if(flight>0){const lift=Math.sin(flight*Math.PI)*38,headX=x+(impactX-x)*flight,headY=e.y+(impactY-e.y)*flight-lift;
            for(let trail=3;trail>=1;trail--){const t=Math.max(0,flight-trail*.08),hx=x+(impactX-x)*t,hy=e.y+(impactY-e.y)*t-Math.sin(t*Math.PI)*38;c.globalAlpha=cinematic*(.12+(3-trail)*.06);c.strokeStyle=trail===1?accent:primary;c.lineWidth=trail===1?3.4:1.7;c.beginPath();c.arc(hx,hy,30-trail*2,-2.45,.65);c.stroke();}
            c.globalAlpha=cinematic*.35;c.strokeStyle=deep;c.lineWidth=25;c.beginPath();c.arc(headX,headY,40,-2.5,.72);c.stroke();
            c.globalAlpha=cinematic*.98;c.shadowColor=primary;c.shadowBlur=18;c.strokeStyle=primary;c.lineWidth=8;c.beginPath();c.arc(headX,headY,40,-2.5,.72);c.stroke();c.shadowBlur=0;
            c.globalAlpha=cinematic;c.strokeStyle=contrast;c.lineWidth=1.8;c.beginPath();c.arc(headX,headY,40,-2.43,.66);c.stroke();
          }
          if(q>.44){const hit=Math.min(1,(q-.44)/.56),radius=12+hit*52;
            c.globalAlpha=cinematic*(1-hit*.68);c.strokeStyle=deep;c.lineWidth=15;c.beginPath();c.arc(impactX,impactY,radius+7,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematic*(1-hit*.62);c.shadowColor=primary;c.shadowBlur=12;c.strokeStyle=primary;c.lineWidth=4;c.beginPath();c.arc(impactX,impactY,radius,-.15,Math.PI*1.85);c.stroke();c.shadowBlur=0;
            c.globalAlpha=cinematic*(1-hit*.7);c.strokeStyle=contrast;c.lineWidth=1.35;c.beginPath();c.arc(impactX,impactY,radius-7,.05,Math.PI*1.75);c.stroke();
            c.save();c.translate(impactX,impactY);c.rotate(dir*.62+hit*.22);c.globalAlpha=cinematic*(1-hit*.62);c.shadowColor=accent;c.shadowBlur=14;c.strokeStyle=accent;c.lineWidth=8;c.beginPath();c.moveTo(-10,-34-hit*17);c.quadraticCurveTo(18,-8,0,35+hit*12);c.stroke();c.shadowBlur=0;c.strokeStyle=contrast;c.lineWidth=1.5;c.beginPath();c.moveTo(-10,-32-hit*17);c.quadraticCurveTo(18,-8,0,32+hit*12);c.stroke();c.restore();
            for(let i=0;i<14;i++){const a=i*Math.PI/7+(e.side?Math.PI:0),travel=12+hit*(28+(i%4)*7);c.globalAlpha=cinematic*(1-hit*.72);c.strokeStyle=i%4===0?factionLight:i%3===0?contrast:accent;c.lineWidth=i%3===0?2.2:1.5;c.beginPath();c.moveTo(impactX+Math.cos(a)*4,impactY+Math.sin(a)*3);c.lineTo(impactX+Math.cos(a)*travel,impactY+Math.sin(a)*travel);c.stroke();}
            const flare=c.createRadialGradient(impactX,impactY,2,impactX,impactY,radius*.72);flare.addColorStop(0,'#fff6f7');flare.addColorStop(.16,accent);flare.addColorStop(.55,'#d7092c99');flare.addColorStop(1,'#a5001a00');c.globalAlpha=cinematic*Math.max(0,1-hit*1.9)*.92;c.fillStyle=flare;c.beginPath();c.arc(impactX,impactY,radius*.72,0,Math.PI*2);c.fill();
            for(let i=0;i<9;i++){const a=q*5+i*Math.PI*2/9,distance=18+hit*(35+(i%3)*9),size=3+hit*1.8;c.globalAlpha=cinematic*(1-hit*.82);c.fillStyle=i%4===0?factionLight:accent;c.save();c.translate(impactX+Math.cos(a)*distance,impactY+Math.sin(a)*distance);c.rotate(a);c.beginPath();c.moveTo(size*2.2,0);c.lineTo(0,-size);c.lineTo(-size*1.2,0);c.lineTo(0,size);c.closePath();c.fill();c.restore();}
          }
        }
        c.restore();
      }else if(e.type==='high-strike'){
        const px=x+(tx-x)*p,py=e.ty;
        c.save();c.translate(px,py);c.globalAlpha*=.9;c.strokeStyle='#fff0a2';c.lineWidth=3;c.beginPath();c.moveTo(0,-34-p*18);c.lineTo(0,7);c.stroke();
        c.strokeStyle='#d9b15e';c.lineWidth=1.5;c.beginPath();c.moveTo(-8,-25-p*12);c.lineTo(0,2);c.lineTo(9,-25-p*12);c.stroke();c.restore();
      }else if(e.type==='monk-strike'){
        // Three single-target staff techniques share the same combat hit.
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const accent=faction.accent,primary=faction.glow,deep=faction.banner,contrast='#fff4d6';
        const dir=e.side===0?1:-1,fade=Math.max(0,e.life/e.max),q=Math.min(1,Math.max(0,p));
        const impactX=tx-dir*5,impactY=e.ty;
        c.save();c.lineCap='round';c.lineJoin='round';
        if(e.variant===0){
          // Arhat's point: a measured staff thrust with a tight contact seal.
          const reach=Math.min(1,q/.58),px=x+(impactX-x)*reach,py=e.y+(impactY-e.y)*reach;
          c.globalAlpha=fade*.28;c.strokeStyle=deep;c.lineWidth=9;c.beginPath();c.moveTo(x,e.y);c.lineTo(px,py);c.stroke();
          c.globalAlpha=fade*.88;c.strokeStyle=primary;c.lineWidth=3.2;c.beginPath();c.moveTo(x,e.y);c.lineTo(px,py);c.stroke();
          c.globalAlpha=fade*.94;c.strokeStyle=contrast;c.lineWidth=1.1;c.beginPath();c.moveTo(x,e.y-1);c.lineTo(px,py-1);c.stroke();
          if(q>.42){
            const pulse=Math.min(1,(q-.42)/.58),radius=6+pulse*11;
            c.globalAlpha=fade*(1-pulse*.52);c.strokeStyle=accent;c.lineWidth=1.8;c.beginPath();c.arc(impactX,impactY,radius,-.9,.9);c.stroke();
            for(let i=0;i<4;i++){const a=(i/3-.5)*.9+(dir<0?Math.PI:0);c.globalAlpha=fade*(1-pulse*.7);c.strokeStyle=i%2?primary:contrast;c.lineWidth=1.4;c.beginPath();c.moveTo(impactX,impactY);c.lineTo(impactX+Math.cos(a)*(5+pulse*12),impactY+Math.sin(a)*(5+pulse*12));c.stroke();}
          }
        }else if(e.variant===1){
          // Crouching tiger: a rising staff sweep and a compact spark fan.
          const sweep=Math.min(1,q/.64),px=x+(impactX-x)*sweep,py=e.y+(impactY-e.y)*sweep;
          const lift=e.side?-23:23,midX=(x+px)*.5,midY=(e.y+py)*.5-lift;
          c.globalAlpha=fade*.27;c.strokeStyle=deep;c.lineWidth=12;c.beginPath();c.moveTo(x,e.y+lift*.18);c.quadraticCurveTo(midX,midY,px,py);c.stroke();
          c.globalAlpha=fade*.84;c.strokeStyle=primary;c.lineWidth=4.4;c.beginPath();c.moveTo(x,e.y+lift*.18);c.quadraticCurveTo(midX,midY,px,py);c.stroke();
          c.globalAlpha=fade*.96;c.strokeStyle=contrast;c.lineWidth=1.2;c.beginPath();c.moveTo(x,e.y+lift*.18-2);c.quadraticCurveTo(midX,midY-2,px,py);c.stroke();
          if(q>.4){
            const pulse=Math.min(1,(q-.4)/.6),radius=8+pulse*15;
            c.globalAlpha=fade*(1-pulse*.55);c.strokeStyle=accent;c.lineWidth=2.2;c.beginPath();c.arc(impactX,impactY,radius,dir>0?-.8:Math.PI-.8,dir>0?.9:Math.PI+.9);c.stroke();
            for(let i=0;i<7;i++){const a=(i/6-.5)*1.3+(e.side?Math.PI:0),length=6+pulse*(12+i%2*5);c.globalAlpha=fade*(1-pulse*.64);c.strokeStyle=i%3===0?contrast:primary;c.lineWidth=i%3===0?1.8:1.2;c.beginPath();c.moveTo(impactX+Math.cos(a)*4,impactY+Math.sin(a)*3);c.lineTo(impactX+Math.cos(a)*length,impactY+Math.sin(a)*length);c.stroke();}
          }
        }else{
          // Signature: a vajra bell seal gathers, rides a bowed staff trail,
          // then rings through the target with falling fragments.
          const cinematic=Math.min(1,fade*2.2),gather=Math.max(0,1-q/.24),flight=Math.min(1,Math.max(0,(q-.16)/.57));
          if(gather>0){
            const radius=7+gather*10,rotation=q*13*(e.side?-1:1);
            c.globalAlpha=cinematic*gather*.72;c.strokeStyle=accent;c.lineWidth=1.8;c.beginPath();c.arc(x,e.y,radius,rotation,rotation+Math.PI*1.65);c.stroke();
            c.globalAlpha=cinematic*gather*.62;c.strokeStyle=primary;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.arc(x,e.y,radius+5,-rotation,Math.PI*1.35-rotation);c.stroke();c.setLineDash([]);
            for(let i=0;i<6;i++){const a=rotation+i*Math.PI/3,inner=radius-2,outer=radius+4+(i%2)*2;c.globalAlpha=cinematic*gather*.82;c.strokeStyle=i%2?primary:contrast;c.lineWidth=i%2?1.2:1.7;c.beginPath();c.moveTo(x+Math.cos(a)*inner,e.y+Math.sin(a)*inner);c.lineTo(x+Math.cos(a)*outer,e.y+Math.sin(a)*outer);c.stroke();}
            c.globalAlpha=cinematic*gather*.85;c.fillStyle=contrast;c.beginPath();c.arc(x,e.y,1.7+gather*1.2,0,Math.PI*2);c.fill();
          }
          if(flight>0){
            const lift=Math.sin(flight*Math.PI)*28,headX=x+(impactX-x)*flight,headY=e.y+(impactY-e.y)*flight-lift;
            for(let trail=3;trail>=1;trail--){const lag=trail*.08,t=Math.max(0,flight-lag),trailLift=Math.sin(t*Math.PI)*28;c.globalAlpha=cinematic*(.13+(4-trail)*.06);c.strokeStyle=trail%2?primary:accent;c.lineWidth=1.4;c.beginPath();c.moveTo(x+(impactX-x)*Math.max(0,t-.22),e.y+(impactY-e.y)*Math.max(0,t-.22)-Math.sin(Math.max(0,t-.22)*Math.PI)*28);c.quadraticCurveTo((x+headX)*.5,(e.y+headY)*.5-lift*.18,x+(impactX-x)*t,e.y+(impactY-e.y)*t-trailLift);c.stroke();}
            const path=c.createLinearGradient(x,e.y,headX,headY);path.addColorStop(0,accent);path.addColorStop(.6,primary);path.addColorStop(1,contrast);
            c.globalAlpha=cinematic*.9;c.strokeStyle=deep;c.lineWidth=8;c.beginPath();c.moveTo(x,e.y);c.quadraticCurveTo((x+headX)*.5,(e.y+headY)*.5-lift*.55,headX,headY);c.stroke();
            c.globalAlpha=cinematic*.92;c.strokeStyle=path;c.lineWidth=3.5;c.beginPath();c.moveTo(x,e.y);c.quadraticCurveTo((x+headX)*.5,(e.y+headY)*.5-lift*.55,headX,headY);c.stroke();
            c.globalAlpha=cinematic*.95;c.strokeStyle=contrast;c.lineWidth=1;c.beginPath();c.moveTo(x,e.y);c.quadraticCurveTo((x+headX)*.5,(e.y+headY)*.5-lift*.55-1,headX,headY);c.stroke();
            c.globalAlpha=cinematic*.92;c.fillStyle=accent;c.beginPath();c.arc(headX,headY,3+Math.sin(flight*Math.PI)*2.5,0,Math.PI*2);c.fill();
          }
          if(q>.58){
            const pulse=Math.min(1,(q-.58)/.42),radius=7+pulse*25;
            c.globalAlpha=cinematic*(1-pulse*.62);c.strokeStyle=contrast;c.lineWidth=2;c.beginPath();c.arc(impactX,impactY,radius,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematic*(1-pulse*.7);c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.moveTo(impactX,impactY-radius*.8);c.lineTo(impactX+dir*radius*.8,impactY);c.lineTo(impactX,impactY+radius*.8);c.lineTo(impactX-dir*radius*.8,impactY);c.closePath();c.stroke();
            c.globalAlpha=cinematic*(1-pulse*.75);c.strokeStyle=primary;c.lineWidth=1.2;c.beginPath();c.ellipse(impactX,impactY+10,8+pulse*15,3+pulse*4,0,0,Math.PI*2);c.stroke();
            for(let i=0;i<9;i++){const a=i*Math.PI*2/9+(e.side?Math.PI:0),distance=5+pulse*(13+(i%3)*4),fall=pulse*pulse*(i%2?7:12);c.globalAlpha=cinematic*(1-pulse*.7);c.strokeStyle=i%3===0?contrast:i%2?primary:accent;c.lineWidth=i%3===0?1.8:1.2;c.beginPath();c.moveTo(impactX+Math.cos(a)*3,impactY+Math.sin(a)*3);c.lineTo(impactX+Math.cos(a)*distance,impactY+Math.sin(a)*distance+fall);c.stroke();}
            c.globalAlpha=cinematic*(1-pulse*.78);c.fillStyle=contrast;c.beginPath();c.arc(impactX,impactY,2+Math.sin(pulse*Math.PI)*3,0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='ninja-blink'){
        const destX=tx,destY=e.ty,fade=Math.max(0,e.life/e.max),pulse=Math.sin(Math.min(1,p)*Math.PI);
        const primary=e.side?'#20e7ff':'#ff3bd4',secondary=e.side?'#8d5bff':'#ff7a2f',hot=e.side?'#e9ffff':'#fff0b2';
        const drawBurst=(cx,cy,r,rotation)=>{
          c.save();c.translate(cx,cy);c.rotate(rotation);
          c.strokeStyle=primary;c.lineWidth=2.5;c.beginPath();c.arc(0,0,r,-.35,2.65);c.stroke();
          c.strokeStyle=secondary;c.lineWidth=1.5;c.beginPath();c.arc(0,0,r+5,2.8,5.6);c.stroke();
          c.fillStyle=hot;c.beginPath();c.moveTo(r+8,0);c.lineTo(r-1,-3);c.lineTo(r-1,3);c.closePath();c.fill();
          c.restore();
        };
        c.save();
        c.globalAlpha=fade*.72;
        const trail=c.createLinearGradient(x,e.y,destX,destY);trail.addColorStop(0,secondary);trail.addColorStop(.5,primary);trail.addColorStop(1,hot);
        c.strokeStyle=trail;c.lineWidth=3.5;c.setLineDash([18,10]);c.lineDashOffset=-p*80;
        c.beginPath();c.moveTo(x,e.y);c.lineTo(destX,destY);c.stroke();c.setLineDash([]);
        // Two independent energy ribbons make the jump read as a tear in
        // space rather than a single line or a teleporting sprite.
        for(let i=0;i<3;i++){
          const bend=(i-1)*12,wiggle=Math.sin(p*10+i*2.4)*8;
          c.globalAlpha=fade*(.32+i*.08);c.strokeStyle=i===1?hot:primary;c.lineWidth=1.2+i*.45;
          c.beginPath();c.moveTo(x,e.y);c.bezierCurveTo(x+(destX-x)*.25,e.y+bend+wiggle,destX-(destX-x)*.25,destY-bend-wiggle,destX,destY);c.stroke();
        }
        // Saturated afterimages sit along the path and collapse into the
        // destination portal as the ninja arrives.
        for(let i=1;i<=4;i++){
          const t=Math.max(0,p-i*.12),gx=x+(destX-x)*t,gy=e.y+(destY-e.y)*t;
          c.globalAlpha=fade*(.11+(4-i)*.035);c.strokeStyle=i%2?secondary:primary;c.lineWidth=2;
          c.beginPath();c.moveTo(gx-10,gy);c.lineTo(gx,gy-13);c.lineTo(gx+10,gy);c.lineTo(gx,gy+13);c.closePath();c.stroke();
          c.beginPath();c.moveTo(gx-6,gy-9);c.lineTo(gx+6,gy+9);c.moveTo(gx+6,gy-9);c.lineTo(gx-6,gy+9);c.stroke();
        }
        c.globalAlpha=fade*.95;drawBurst(x,e.y,13+pulse*8,-p*7);
        c.globalAlpha=fade*(.85+.15*pulse);drawBurst(destX,destY,15+pulse*19,p*8);
        // A sharp arrival flash and radial shards keep the effect legible over
        // dense formations without obscuring the units for a full frame.
        c.globalAlpha=fade*(.35+.65*pulse);c.fillStyle=hot;c.beginPath();c.arc(destX,destY,3+pulse*9,0,Math.PI*2);c.fill();
        for(let i=0;i<10;i++){
          const a=i*Math.PI*2/10+p*5.5,len=10+pulse*(18+(i%3)*7),sx=destX+Math.cos(a)*8,sy=destY+Math.sin(a)*8;
          c.globalAlpha=fade*(.45-(i%3)*.07);c.strokeStyle=i%2?primary:secondary;c.lineWidth=1.5;c.beginPath();c.moveTo(sx,sy);c.lineTo(destX+Math.cos(a)*len,destY+Math.sin(a)*len);c.stroke();
        }
        c.restore();
      }else if(e.type==='ninja-arc'){
        const px=x+(tx-x)*p,py=e.ty;
        c.save();c.translate(px,py);c.rotate((e.side?-1:1)*p*3);c.strokeStyle=e.side?'#97e7ef':'#d8e8ee';c.lineWidth=2;c.beginPath();c.arc(0,0,13+p*10,-1.1,1.1);c.stroke();c.strokeStyle='#fff4cf';c.lineWidth=1;c.beginPath();c.arc(0,0,8+p*7,-1.0,1.0);c.stroke();c.restore();
      }else if(e.type==='militia-strike'){
        // Militia has a disciplined spear-thrust: compact, bright and easy to
        // distinguish from the heavier units' broad melee arcs.
        const px=x+(tx-x)*p,py=e.y+(e.ty-e.y)*p,fade=Math.max(0,e.life/e.max),pulse=Math.sin(Math.min(1,p)*Math.PI);
        const primary=e.side?'#46d9ff':'#ffb83d',secondary=e.side?'#d8fbff':'#ff5268',hot=e.side?'#ffffff':'#fff0b0';
        c.save();c.globalAlpha=fade*.82;
        c.strokeStyle=primary;c.lineWidth=3;c.beginPath();c.moveTo(x,e.y);c.lineTo(px,py);c.stroke();
        c.globalAlpha=fade*.55;c.strokeStyle=secondary;c.lineWidth=1.5;c.beginPath();c.moveTo(x,e.y-4);c.lineTo(px,py-4);c.moveTo(x,e.y+4);c.lineTo(px,py+4);c.stroke();
        c.globalAlpha=fade*.92;c.translate(px,py);c.rotate(Math.atan2(e.ty-e.y,tx-x));
        c.strokeStyle=hot;c.lineWidth=2;c.beginPath();c.moveTo(-20-pulse*12,0);c.lineTo(13+pulse*10,0);c.stroke();
        c.fillStyle=hot;c.beginPath();c.moveTo(20+pulse*10,0);c.lineTo(9+pulse*10,-5);c.lineTo(11+pulse*10,0);c.lineTo(9+pulse*10,5);c.closePath();c.fill();
        c.globalAlpha=fade*(.65+.35*pulse);c.strokeStyle=secondary;c.lineWidth=1.6;c.beginPath();c.arc(13,0,8+pulse*12,-1.1,1.1);c.stroke();
        for(let i=0;i<3;i++){const y=(i-1)*8,a=(i-1)*.22;c.globalAlpha=fade*(.7-i*.12);c.strokeStyle=i===1?hot:primary;c.lineWidth=1.4;c.beginPath();c.moveTo(9,y);c.lineTo(23+pulse*9,y+Math.tan(a)*12);c.stroke();}
        c.restore();
      }else if(e.type==='spear-guard'){
        // The heavy spearman cycles three single-target weapon presentations;
        // this effect never adds damage or changes the existing strike timing.
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const accent=faction.accent,primary=faction.glow,deep=faction.banner;
        const dir=e.side===0?1:-1,fade=Math.max(0,e.life/e.max),q=Math.min(1,Math.max(0,p));
        const contactX=tx-dir*5,contactY=e.ty,impact=Math.min(1,Math.max(0,(q-.55)/.45));
        c.save();c.lineCap='round';c.lineJoin='round';
        if(e.variant===0){
          // A precise, braced thrust with a narrow point-first trail.
          const advance=Math.min(1,q/.66),tipX=x+(contactX-x)*advance,tipY=e.y+(contactY-e.y)*advance;
          c.globalAlpha=fade*.34;c.strokeStyle=deep;c.lineWidth=9;c.beginPath();c.moveTo(x,e.y);c.lineTo(tipX,tipY);c.stroke();
          c.globalAlpha=fade*.88;c.strokeStyle=primary;c.lineWidth=3.8;c.beginPath();c.moveTo(x,e.y);c.lineTo(tipX,tipY);c.stroke();
          c.globalAlpha=fade*.96;c.strokeStyle='#fff8dc';c.lineWidth=1.25;c.beginPath();c.moveTo(x,e.y-1);c.lineTo(tipX,tipY-1);c.stroke();
          c.globalAlpha=fade*.9;c.fillStyle=accent;c.beginPath();c.moveTo(tipX+dir*11,tipY);c.lineTo(tipX-dir*3,tipY-4);c.lineTo(tipX-dir*1,tipY);c.lineTo(tipX-dir*3,tipY+4);c.closePath();c.fill();
          if(impact>0){
            c.globalAlpha=fade*(1-impact*.72);c.strokeStyle='#fff5d1';c.lineWidth=1.6;
            for(let i=0;i<4;i++){
              const a=(i/3-.5)*1.05+(dir<0?Math.PI:0),length=5+impact*(9+i%2*4);
              c.beginPath();c.moveTo(contactX+Math.cos(a)*3,contactY+Math.sin(a)*3);c.lineTo(contactX+Math.cos(a)*length,contactY+Math.sin(a)*length);c.stroke();
            }
          }
        }else if(e.variant===1){
          // A rising hook sweep draws a broad crescent, distinct from the
          // straight thrust, then scrapes a short fan of metallic sparks.
          const sweep=Math.min(1,q/.72),headX=x+(contactX-x)*sweep,headY=e.y+(contactY-e.y)*sweep;
          const lift=e.side?-19:19,midX=(x+headX)*.5,midY=(e.y+headY)*.5-lift;
          c.globalAlpha=fade*.3;c.strokeStyle=deep;c.lineWidth=12;c.beginPath();c.moveTo(x,e.y+lift*.25);c.quadraticCurveTo(midX,midY,headX,headY);c.stroke();
          c.globalAlpha=fade*.86;c.strokeStyle=primary;c.lineWidth=4.5;c.beginPath();c.moveTo(x,e.y+lift*.25);c.quadraticCurveTo(midX,midY,headX,headY);c.stroke();
          c.globalAlpha=fade*.94;c.strokeStyle='#fff8dc';c.lineWidth=1.35;c.beginPath();c.moveTo(x,e.y+lift*.25-2);c.quadraticCurveTo(midX,midY-2,headX,headY);c.stroke();
          if(q>.46){
            const flare=Math.min(1,(q-.46)/.54);
            c.globalAlpha=fade*(1-flare*.4);c.strokeStyle=accent;c.lineWidth=2.4;
            c.beginPath();c.arc(contactX,contactY,10+flare*13,dir>0?-.65:Math.PI-.65,dir>0?.8:Math.PI+.8);c.stroke();
            for(let i=0;i<6;i++){
              const a=(i/5-.5)*1.25+(e.side?Math.PI:0),length=8+flare*(8+i%2*5);
              c.globalAlpha=fade*(1-flare*.58);c.strokeStyle=i%2?primary:'#fff5d1';c.lineWidth=i%2?1.4:2;
              c.beginPath();c.moveTo(contactX+Math.cos(a)*6,contactY+Math.sin(a)*5);c.lineTo(contactX+Math.cos(a)*length,contactY+Math.sin(a)*length);c.stroke();
            }
          }
        }else{
          // Signature: Iron Curtain Lance. A shield brace gathers faction
          // light, then three aligned trails drive into a compact shattering
          // impact; all particles remain bounded to this one target.
          const cinematicFade=Math.min(1,fade*2.2),brace=Math.max(0,1-q/.23),drive=Math.min(1,Math.max(0,(q-.15)/.58));
          if(brace>0){
            const braceX=x+dir*7,braceY=e.y+8,radius=7+brace*8;
            c.globalAlpha=cinematicFade*brace*.82;c.strokeStyle=accent;c.lineWidth=2;
            c.beginPath();c.arc(braceX,braceY,radius,-.95,.95);c.stroke();
            c.beginPath();c.moveTo(braceX-dir*radius*.65,braceY+6);c.lineTo(braceX+dir*radius*.65,braceY+6);c.stroke();
            c.globalAlpha=cinematicFade*brace;c.fillStyle='#fff8dc';c.beginPath();c.arc(braceX,braceY,2+brace*2,0,Math.PI*2);c.fill();
          }
          if(drive>0){
            const tipX=x+(contactX-x)*drive,tipY=e.y+(contactY-e.y)*drive;
            for(let lane=-1;lane<=1;lane++){
              const offset=lane*4;
              c.globalAlpha=cinematicFade*(lane===0?.94:.55);c.strokeStyle=lane===0?'#fff8dc':lane<0?primary:accent;c.lineWidth=lane===0?2.2:1.5;
              c.beginPath();c.moveTo(x, e.y+offset);c.lineTo(tipX,tipY+offset);c.stroke();
            }
            const tipSize=6+Math.sin(drive*Math.PI)*3;
            c.globalAlpha=cinematicFade*.95;c.fillStyle=accent;c.beginPath();c.moveTo(tipX+dir*tipSize,tipY);c.lineTo(tipX-dir*tipSize*.55,tipY-tipSize*.55);c.lineTo(tipX-dir*tipSize*.25,tipY);c.lineTo(tipX-dir*tipSize*.55,tipY+tipSize*.55);c.closePath();c.fill();
          }
          if(impact>0){
            const radius=6+impact*25;
            c.globalAlpha=cinematicFade*(1-impact*.52);c.strokeStyle='#fff8dc';c.lineWidth=2.3;c.beginPath();c.arc(contactX,contactY,radius,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematicFade*(1-impact*.62);c.strokeStyle=accent;c.lineWidth=2.7;c.beginPath();c.moveTo(contactX,contactY-radius*.8);c.lineTo(contactX+dir*radius*.8,contactY);c.lineTo(contactX,contactY+radius*.8);c.lineTo(contactX-dir*radius*.8,contactY);c.closePath();c.stroke();
            c.globalAlpha=cinematicFade*(1-impact*.7);c.fillStyle=deep;c.beginPath();c.ellipse(contactX,contactY+13,12+impact*15,3+impact*3,0,0,Math.PI*2);c.fill();
            for(let i=0;i<10;i++){
              const a=i*Math.PI*2/10+(e.side?Math.PI:0),length=7+impact*(15+(i%3)*5),sx=contactX+Math.cos(a)*length,sy=contactY+Math.sin(a)*length;
              c.globalAlpha=cinematicFade*(1-impact*.68);c.strokeStyle=i%3===0?'#fff8dc':i%2?primary:accent;c.lineWidth=i%3===0?2:1.4;
              c.beginPath();c.moveTo(contactX+Math.cos(a)*4,contactY+Math.sin(a)*3);c.lineTo(sx,sy);c.stroke();
            }
            c.globalAlpha=cinematicFade*(1-impact*.75);c.fillStyle='#fffbe9';c.beginPath();c.arc(contactX,contactY,2+Math.sin(impact*Math.PI)*4,0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='sword-guard'){
        // Sword Man attack styles are visual-only: a guarded cut, a shield
        // counter, or the signature bastion riposte. All share one hit event.
        const faction=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        const accent=faction.accent,primary=faction.glow,deep=faction.banner;
        const dir=e.side===0?1:-1,fade=Math.max(0,e.life/e.max),q=Math.min(1,Math.max(0,p));
        const impact=Math.min(1,Math.max(0,(q-.58)/.42)),contactX=tx-dir*5,contactY=e.ty;
        c.save();c.lineCap='round';c.lineJoin='round';
        if(e.variant===0){
          // Guarded cut: a compact shield glint leads two clean sword arcs.
          const move=Math.min(1,q/.58),sx=x+(contactX-x)*move,sy=e.y+(contactY-e.y)*move;
          c.globalAlpha=fade*.72;c.strokeStyle=accent;c.lineWidth=2.4;
          c.beginPath();c.moveTo(x,e.y);c.lineTo(sx,sy);c.stroke();
          c.globalAlpha=fade*(.5+.35*Math.sin(q*Math.PI));c.strokeStyle=primary;c.lineWidth=1.2;
          c.beginPath();c.arc(x+dir*8,e.y+5,5+move*5,-.85,1.05);c.stroke();
          const r=10+impact*18;
          c.globalAlpha=fade*(.7-impact*.18);c.strokeStyle=accent;c.lineWidth=3.2;
          c.beginPath();c.arc(contactX,contactY,r,dir>0?-.82:Math.PI-.82,dir>0?1.02:Math.PI+1.02);c.stroke();
          c.globalAlpha=fade*.72;c.strokeStyle='#fff8db';c.lineWidth=1.2;
          c.beginPath();c.arc(contactX,contactY,r-4,dir>0?-.76:Math.PI-.76,dir>0?.72:Math.PI+.72);c.stroke();
          if(impact>0)for(let i=0;i<5;i++){
            const a=(i/4-.5)*1.45+(dir>0?0:Math.PI),len=5+impact*(11+i%2*4);
            c.globalAlpha=fade*(1-impact*.72);c.strokeStyle=i%2?primary:'#fff4cd';c.lineWidth=1.5;
            c.beginPath();c.moveTo(contactX+Math.cos(a)*4,contactY+Math.sin(a)*4);c.lineTo(contactX+Math.cos(a)*len,contactY+Math.sin(a)*len);c.stroke();
          }
        }else if(e.variant===1){
          // Shield counter: the guard surges forward, then sends a rippling
          // impact ring through the target's silhouette.
          const move=Math.min(1,q/.64),sx=x+(contactX-x)*move,sy=e.y+(contactY-e.y)*move;
          const size=5+Math.sin(Math.min(1,q/.64)*Math.PI)*3;
          c.globalAlpha=fade*.82;c.strokeStyle=deep;c.lineWidth=5;
          c.beginPath();c.moveTo(x,e.y+4);c.lineTo(sx,sy+4);c.stroke();
          c.globalAlpha=fade*.95;c.fillStyle=accent;
          c.beginPath();c.moveTo(sx+dir*size,sy);c.lineTo(sx-dir*size*.55,sy-size);c.lineTo(sx-dir*size*.55,sy+size);c.closePath();c.fill();
          c.strokeStyle='#fff9df';c.lineWidth=1.3;c.stroke();
          if(q>.43){
            const wave=Math.min(1,(q-.43)/.57);
            for(let ring=0;ring<3;ring++){
              const radius=5+wave*(17+ring*7),offset=ring*.11;
              c.globalAlpha=fade*Math.max(0,.72-wave*.62-ring*.13);c.strokeStyle=ring===1?accent:primary;c.lineWidth=ring===0?2.4:1.2;
              c.beginPath();c.ellipse(contactX,contactY,radius,radius*.55,0,0,Math.PI*2);c.stroke();
            }
            c.globalAlpha=fade*(1-wave*.7);c.fillStyle='#fff8df';
            for(let i=0;i<6;i++){const a=i*Math.PI/3+q*4;c.beginPath();c.arc(contactX+Math.cos(a)*(5+wave*13),contactY+Math.sin(a)*(4+wave*8),1.3,0,Math.PI*2);c.fill();}
          }
        }else{
          // Signature: the shield's oath gathers a small heraldic seal, then
          // a layered blade ribbon crosses the line and fractures into sparks.
          const cinematicFade=Math.min(1,fade*2.2);
          const gather=Math.max(0,1-q/.24),sweep=Math.min(1,Math.max(0,(q-.16)/.56));
          if(gather>0){
            const runeX=x+dir*9,runeY=e.y+5,radius=8+gather*5;
            c.globalAlpha=cinematicFade*(.48+gather*.45);c.strokeStyle=accent;c.lineWidth=1.6;
            c.beginPath();c.arc(runeX,runeY,radius,-.85,1.1);c.stroke();
            c.beginPath();c.moveTo(runeX-dir*4,runeY);c.lineTo(runeX+dir*5,runeY);c.moveTo(runeX,runeY-5);c.lineTo(runeX,runeY+5);c.stroke();
            for(let spark=0;spark<3;spark++){
              const angle=q*8+spark*Math.PI*2/3,sparkX=runeX+Math.cos(angle)*radius,sparkY=runeY+Math.sin(angle)*radius*.7;
              c.globalAlpha=cinematicFade*gather*.9;c.fillStyle=spark===1?'#fff8d9':accent;c.beginPath();c.arc(sparkX,sparkY,1.5+gather,0,Math.PI*2);c.fill();
            }
          }
          if(sweep>0){
            const headX=x+(contactX-x)*sweep,headY=e.y+(contactY-e.y)*sweep;
            const tailX=x+(contactX-x)*Math.max(0,sweep-.28),tailY=e.y+(contactY-e.y)*Math.max(0,sweep-.28);
            c.globalAlpha=cinematicFade*.28;c.strokeStyle=deep;c.lineWidth=13;c.beginPath();c.moveTo(tailX,tailY-3);c.quadraticCurveTo((tailX+headX)*.5,(tailY+headY)*.5-19,headX,headY);c.stroke();
            c.globalAlpha=cinematicFade*.9;c.strokeStyle=primary;c.lineWidth=5.5;c.beginPath();c.moveTo(tailX,tailY-3);c.quadraticCurveTo((tailX+headX)*.5,(tailY+headY)*.5-19,headX,headY);c.stroke();
            c.globalAlpha=cinematicFade*.92;c.strokeStyle='#fff8db';c.lineWidth=1.7;c.beginPath();c.moveTo(tailX,tailY-5);c.quadraticCurveTo((tailX+headX)*.5,(tailY+headY)*.5-21,headX,headY);c.stroke();
            for(let after=1;after<=2;after++){
              const lag=after*.13,trail=Math.max(0,sweep-lag),ax=x+(contactX-x)*trail,ay=e.y+(contactY-e.y)*trail;
              c.globalAlpha=cinematicFade*(.36-after*.09);c.strokeStyle=after===1?accent:'#fff2c2';c.lineWidth=after===1?2.3:1;
              c.beginPath();c.arc(ax,ay,10+after*4,dir>0?-1.25:Math.PI-1.25,dir>0?.72:Math.PI+.72);c.stroke();
            }
          }
          if(impact>0){
            const radius=8+impact*30;
            c.globalAlpha=cinematicFade*(1-impact*.55);c.strokeStyle='#fff7d6';c.lineWidth=2.7;
            c.beginPath();c.arc(contactX,contactY,radius,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematicFade*(1-impact*.62);c.strokeStyle=accent;c.lineWidth=3;
            c.beginPath();c.ellipse(contactX,contactY,radius*1.42,radius*.48,dir*.24,0,Math.PI*2);c.stroke();
            c.globalAlpha=cinematicFade*(1-impact*.55);c.strokeStyle=primary;c.lineWidth=1.2;c.setLineDash([4,5]);
            c.beginPath();c.arc(contactX,contactY,radius*.76,-q*4,Math.PI*1.7-q*4);c.stroke();c.setLineDash([]);
            for(let i=0;i<12;i++){
              const a=i*Math.PI*2/12+(e.side?Math.PI:0),travel=7+impact*(19+(i%3)*7),sx=contactX+Math.cos(a)*travel,sy=contactY+Math.sin(a)*travel;
              c.globalAlpha=cinematicFade*(1-impact*.68);c.strokeStyle=i%3===0?'#fff8de':i%2?primary:accent;c.lineWidth=i%3===0?2.4:1.6;
              c.beginPath();c.moveTo(contactX+Math.cos(a)*5,contactY+Math.sin(a)*4);c.lineTo(sx,sy);c.stroke();
            }
            c.globalAlpha=cinematicFade*(1-impact*.72);c.fillStyle='#fffbe9';c.beginPath();c.arc(contactX,contactY,3+Math.sin(impact*Math.PI)*5,0,Math.PI*2);c.fill();
          }
        }
        c.restore();
      }else if(e.type==='slash'){
        c.strokeStyle='#fff2c7';c.lineWidth=2;c.beginPath();c.arc(tx,e.ty,12+p*9,-1.5,1.2);c.stroke();
        rect(c,'#f5deb0',tx-3+p*12,e.ty-9,3,3);
      }else if(e.type==='bolt'||e.type==='beam'){
        c.strokeStyle=e.side?'#b1edff':'#ffe0a0';c.lineWidth=e.type==='beam'?3:2;
        c.beginPath();c.moveTo(x+(tx-x)*Math.max(0,p-.25),e.y+(e.ty-e.y)*Math.max(0,p-.25));c.lineTo(x+(tx-x)*p,e.y+(e.ty-e.y)*p);c.stroke();
        rect(c,'#fff3d0',x+(tx-x)*p-2,e.y+(e.ty-e.y)*p-2,4,4);
      }else if(e.type==='splash'){
        c.strokeStyle=e.side?'#a3d9ee':'#f5cb91';c.lineWidth=2;
        c.beginPath();c.ellipse(x,e.y,e.radius*(.5+p*.5),e.radius*(.25+p*.25),0,0,Math.PI*2);c.stroke();
      }else if(e.type==='heal'){
        rect(c,'#a3e2ad',x-3,e.y-35-p*12,6,2);rect(c,'#a3e2ad',x-1,e.y-37-p*12,2,6);
      }else if(e.type==='death'){
        const fx=FACTION_BY_ID[battle.teams[e.side]?.faction]||FACTION_BY_ID.roland;
        for(let i=0;i<4;i++)rect(c,i%2?'#c1b586':fx.banner,x+(i-1.5)*p*20,e.y-p*16+i*3,3,3);
      }
    }
    // Rain and snow particles pass in front of the battle, while their
    // accumulation remains beneath the units in the background layer.
    this.weatherRenderer.drawForeground(c,{mapId:map.id,weather:battle.weather,time:battle.time,width:w,camera:this.camera});
    c.globalAlpha=1;c.restore();
    const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#20322433');shade.addColorStop(.15,'#20322400');shade.addColorStop(.8,'#20322400');shade.addColorStop(1,'#20322438');c.fillStyle=shade;c.fillRect(0,0,w,h);
    c.restore();
    this.drawMap(battle);
  }
  drawMap(battle){
    const c=this.m,w=this.minimap.width,h=this.minimap.height;
    const map=MAP_BY_ID[battle.mapId]||MAP_BY_ID.grassland;
    c.fillStyle=map.colors.minimap;c.fillRect(0,0,w,h);c.fillStyle=map.colors.base;c.fillRect(0,20,w,28);
    for(const zone of battle.contaminatedZones){
      const left=(zone.x-zone.radiusX)/RULES.width*w,width=zone.radiusX*2/RULES.width*w;
      c.globalAlpha=.48;c.fillStyle='#a8e451';c.fillRect(left,20,width,28);
      c.globalAlpha=.9;c.strokeStyle='#e6ff9c';c.lineWidth=1;c.strokeRect(left,20,width,28);c.globalAlpha=1;
    }
    for(const t of battle.teams){
      const faction=FACTION_BY_ID[t.faction]||FACTION_BY_ID.roland;
      rect(c,faction.glow,t.x/RULES.width*w-4,20,8,18);
      const campX=t.camp.x/RULES.width*w;
      const campFaction=FACTION_BY_ID[t.faction]||FACTION_BY_ID.roland;
      rect(c,t.camp.hp>0?campFaction.accent:'#4f5944',campX-2,23,4,10);
    }
    for(const u of battle.units)if(u.hp>0){const faction=FACTION_BY_ID[battle.teams[u.side]?.faction]||FACTION_BY_ID.roland;rect(c,faction.accent,u.x/RULES.width*w,u.y/RULES.height*h,2,2);}
    c.fillStyle='#e8eac917';c.fillRect(this.camera/RULES.width*w,1,this.canvas.width/RULES.width*w,h-2);
    c.strokeStyle='#ece3ae';c.lineWidth=1;c.strokeRect(this.camera/RULES.width*w+.5,.5,this.canvas.width/RULES.width*w,h-1);
  }
}

