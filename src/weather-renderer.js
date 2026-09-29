import {RULES} from './units.js';

// Weather is deliberately kept in its own renderer. Ground accumulation uses
// deterministic world coordinates, while rain and snow particles are screen
// space effects drawn in front of the units.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smoothstep=value=>value*value*(3-2*value);
const hash=(seed)=>{
  const value=Math.sin(seed*12.9898+78.233)*43758.5453;
  return value-Math.floor(value);
};

export class WeatherRenderer {
  constructor(worldWidth,height){
    this.worldWidth=worldWidth;this.height=height;this.width=0;
    this.backLayer=document.createElement('canvas');
    this.frontLayer=document.createElement('canvas');
    this.backContext=this.backLayer.getContext('2d');
    this.frontContext=this.frontLayer.getContext('2d');
    this.weatherKey=null;this.weatherFrom=null;this.weatherCurrent=null;this.weatherBlend=1;
    this.rainAmount=0;this.snowAmount=0;
    this.puddles=Array.from({length:120},(_,i)=>({
      x:hash(i+11)*worldWidth,
      y:62+hash(i+211)*366,
      rx:10+hash(i+311)*34,
      ry:2.5+hash(i+411)*7,
      rotation:(hash(i+511)-.5)*.32,
      depth:hash(i+611)
    }));
    this.snowBanks=Array.from({length:100},(_,i)=>({
      x:hash(i+701)*worldWidth,
      y:66+hash(i+801)*360,
      rx:24+hash(i+901)*52,
      ry:5+hash(i+1001)*9,
      rotation:(hash(i+1101)-.5)*.22,
      depth:hash(i+1201)
    }));
  }
  resize(width){
    if(width===this.width)return;
    this.width=width;
    for(const layer of [this.backLayer,this.frontLayer]){layer.width=width;layer.height=this.height;}
    this.backContext=this.backLayer.getContext('2d');this.frontContext=this.frontLayer.getContext('2d');
  }
  update(mapId,weather,dt=0){
    const next=weather||{id:'clear',kind:'clear'};
    const key=`${mapId}:${next.id}`;
    if(this.weatherKey===null){this.weatherKey=key;this.weatherCurrent=next;this.weatherBlend=1;}
    else if(key!==this.weatherKey){this.weatherFrom=this.weatherCurrent||next;this.weatherCurrent=next;this.weatherKey=key;this.weatherBlend=0;}
    const step=Math.max(0,dt);
    this.weatherBlend=Math.min(1,this.weatherBlend+step/3.5);
    const rainTarget=next.kind==='rain'?1:0;
    const snowTarget=next.kind==='snow'?1:0;
    this.rainAmount+=(rainTarget-this.rainAmount)*clamp(step/18);
    this.snowAmount+=(snowTarget-this.snowAmount)*clamp(step/22);
    if(Math.abs(rainTarget-this.rainAmount)<.001)this.rainAmount=rainTarget;
    if(Math.abs(snowTarget-this.snowAmount)<.001)this.snowAmount=snowTarget;
    if(this.weatherBlend>=1)this.weatherFrom=null;
  }
  drawBackground(c,{mapId,weather,time=0,width,camera}){
    this.resize(width);this.composite(c,'back',mapId,weather,time,width,camera);
  }
  drawForeground(c,{mapId,weather,time=0,width,camera}){
    this.resize(width);this.composite(c,'front',mapId,weather,time,width,camera);
  }
  composite(target,layer,mapId,weather,time,width,camera){
    const from=this.weatherFrom,blend=smoothstep(clamp(this.weatherBlend));
    if(from&&blend<1){
      this.paint(layer==='back'?this.backContext:this.frontContext,mapId,from,time,width,camera,layer);
      target.save();target.globalAlpha=1-blend;target.drawImage(layer==='back'?this.backLayer:this.frontLayer,0,0,width,this.height);target.restore();
      this.paint(layer==='back'?this.backContext:this.frontContext,mapId,weather,time,width,camera,layer);
      target.save();target.globalAlpha=blend;target.drawImage(layer==='back'?this.backLayer:this.frontLayer,0,0,width,this.height);target.restore();
    }else{
      this.paint(layer==='back'?this.backContext:this.frontContext,mapId,weather,time,width,camera,layer);
      target.drawImage(layer==='back'?this.backLayer:this.frontLayer,0,0,width,this.height);
    }
  }
  paint(c,mapId,weather,time,width,camera,layer){
    c.clearRect(0,0,width,this.height);
    if(!weather)return;
    const phase=Math.max(0,time||0);
    if(layer==='back')this.paintBack(c,mapId,weather,phase,width,camera);
    else this.paintFront(c,mapId,weather,phase,width);
  }
  paintBack(c,mapId,weather,phase,width,camera){
    if(weather.kind==='clear'){
      const light=c.createLinearGradient(0,0,0,this.height);
      light.addColorStop(0,'#fff2bd18');light.addColorStop(.42,'#fff5cb08');light.addColorStop(1,'#15291a00');
      c.globalAlpha=1;c.fillStyle=light;c.fillRect(0,0,width,this.height);
      // Clear-weather sun patches belong to the world, so their x positions
      // are offset by the camera just like the terrain texture. Keeping them
      // in viewport coordinates made them slide across the grass while panning.
      const scroll=Number.isFinite(camera)?camera:0;
      c.globalAlpha=.11;c.fillStyle='#fff4c4';c.beginPath();c.arc(this.worldWidth*.82-scroll,36,31+Math.sin(phase*.7)*2,0,Math.PI*2);c.fill();
      c.globalAlpha=.055;c.fillStyle='#fff5c7';
      for(let i=0;i<4;i++){
        const x=this.worldWidth*(.12+i*.24)-scroll;
        c.beginPath();c.moveTo(x,0);c.lineTo(x+80,this.height);c.lineTo(x+145,this.height);c.lineTo(x+40,0);c.closePath();c.fill();
      }
      return;
    }
    if(weather.kind==='rain'){
      const swamp=mapId==='swamp';
      c.globalAlpha=swamp?.31:.23;c.fillStyle=swamp?'#173d3c':'#163a3b';c.fillRect(0,0,width,this.height);
      const count=swamp?82:48,opacity=this.rainAmount;
      for(let i=0;i<count;i++){
        const p=this.puddles[i],x=p.x-camera;
        if(x<-p.rx-20||x>width+p.rx+20)continue;
        const rx=p.rx*(swamp?1.2:1),ry=p.ry*(swamp?1.25:1);
        c.save();c.translate(x,p.y);c.rotate(p.rotation);c.globalAlpha=opacity*(swamp?.42:.32)*(0.65+p.depth*.35);
        c.fillStyle=swamp?'#193c3b':'#183b49';c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.fill();
        c.globalAlpha*=1.8;c.strokeStyle=swamp?'#a7c99c':'#a5d6d0';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,rx*.95,ry*.78,0,0,Math.PI*2);c.stroke();
        c.globalAlpha*=.95;c.strokeStyle='#e8ffff';const shimmer=Math.sin(phase*1.8+i)*.16;c.beginPath();c.moveTo(-rx*.45,-1+shimmer);c.lineTo(rx*.18,-2+shimmer);c.stroke();
        c.restore();
      }
      // Wet grass/peat glints make the map respond even between visible pools.
      c.globalAlpha=opacity*(swamp?.16:.11);c.strokeStyle=swamp?'#b4cf9d':'#c2e4c0';c.lineWidth=1;
      for(let i=0;i<65;i++){
        const x=((i*137+phase*13)% (width+30))-15,y=56+(i*71)%360;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+5,y-2);c.stroke();
      }
    }else if(weather.kind==='snow'){
      const intensity=this.snowAmount,ice=mapId==='icefield';
      c.globalAlpha=.34+.2*intensity;c.fillStyle=ice?'#f1fbff':'#f1fbf7';c.fillRect(0,420,width,80);
      const count=ice?52:34;
      for(let i=0;i<count;i++){
        const p=this.snowBanks[i],x=p.x-camera;
        if(x<-p.rx-30||x>width+p.rx+30)continue;
        c.save();c.translate(x,p.y);c.rotate(p.rotation);c.globalAlpha=intensity*(ice?.38:.26)*(0.7+p.depth*.3);c.fillStyle='#f1fbf7';
        c.beginPath();c.ellipse(0,0,p.rx,p.ry,0,0,Math.PI*2);c.fill();c.globalAlpha*=.7;c.fillStyle='#d4e9eb';c.beginPath();c.ellipse(0,p.ry*.36,p.rx*.72,p.ry*.28,0,0,Math.PI*2);c.fill();c.restore();
      }
      c.globalAlpha=intensity*(ice?.25:.15);c.fillStyle='#d8edf0';c.fillRect(0,0,width,this.height);
    }
  }
  paintFront(c,mapId,weather,phase,width){
    if(weather.kind==='rain'){
      const swamp=mapId==='swamp';
      c.globalAlpha=.55*this.rainAmount;c.strokeStyle=swamp?'#c0e8d5':'#bdecef';c.lineWidth=1.35;
      for(let i=0;i<190;i++){
        const x=((i*83+phase*145)%(width+90))-45,y=((i*47+phase*235)%(this.height+55))-28,length=19+(i%5)*4;
        c.beginPath();c.moveTo(x,y);c.lineTo(x-7,y+length);c.stroke();
        if(i%7===0){c.globalAlpha=.3*this.rainAmount;c.beginPath();c.moveTo(x-9,y+length+4);c.lineTo(x-3,y+length+4);c.stroke();c.globalAlpha=.55*this.rainAmount;}
      }
      c.globalAlpha=.42*this.rainAmount;c.strokeStyle='#e8ffff';c.lineWidth=2.2;
      for(let i=0;i<52;i++){
        const x=((i*131+phase*210)%(width+40))-20,y=((i*71+phase*310)%(this.height+28))-14;
        c.beginPath();c.moveTo(x,y);c.lineTo(x-10,y+24+(i%3)*6);c.stroke();
        if(i%3===0){c.globalAlpha=.5*this.rainAmount;c.beginPath();c.arc(x-10,y+28+(i%3)*6,3+(i%2),0,Math.PI*2);c.stroke();c.globalAlpha=.42*this.rainAmount;}
      }
    }else if(weather.kind==='snow'){
      const ice=mapId==='icefield';
      c.globalAlpha=(ice?.84:.7)*this.snowAmount;c.fillStyle='#f3ffff';
      for(let i=0;i<(ice?185:150);i++){
        const x=((i*97+phase*24)%(width+40))-20,y=((i*53+phase*48)%(this.height+20))-10,r=1+(i%3)*.55;
        c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
      }
      c.globalAlpha=(ice?.48:.34)*this.snowAmount;c.strokeStyle='#ffffff';c.lineWidth=1.2;
      for(let i=0;i<(ice?55:42);i++){
        const x=((i*149+phase*38)%(width+70))-35,y=((i*61+phase*22)%(this.height+35))-18;
        c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+9+(i%3)*4);c.stroke();
      }
      if(ice){
        c.globalAlpha=.2*this.snowAmount;c.strokeStyle='#ffffff';c.lineWidth=2;
        for(let i=0;i<8;i++){const x=((i*211+phase*18)%(width+160))-80;c.beginPath();c.moveTo(x,0);c.lineTo(x+70,this.height);c.stroke();}
      }
    }
  }
}
