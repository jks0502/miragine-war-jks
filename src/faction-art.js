// Shared flat national flags used by the faction picker and faction cards.
// Every field is drawn at the canvas aspect ratio, which is kept at 3:2 by the UI.
function polygon(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function star(c,cx,cy,r1,r2,n=5,rotation=-Math.PI/2){
  const points=[];
  for(let i=0;i<n*2;i++){
    const angle=rotation+i*Math.PI/n,r=i%2===0?r1:r2;
    points.push([cx+Math.cos(angle)*r,cy+Math.sin(angle)*r]);
  }
  polygon(c,c.fillStyle,points);
}
function palette(style){
  return {
    roland:{field:'#AE1232',primary:'#FFC72C',secondary:'#FFFFFF'},
    azure:{field:'#0052A5',primary:'#00A6BE',secondary:'#FFFFFF'},
    north:{field:'#006B3C',primary:'#FFCD00',secondary:'#FFFFFF'},
    blackstone:{field:'#000000',primary:'#F26522',secondary:'#CFD6DC'},
    silvermoon:{field:'#4C008A',primary:'#FFFFFF',secondary:'#FFFFFF'},
    mistsea:{field:'#2A6F97',primary:'#8ECAE6',secondary:'#FFFFFF'}
  }[style]||{field:'#304936',primary:'#D8C27A',secondary:'#FFFFFF'};
}
function drawFlagField(c,style,w,h){
  const colors=palette(style),{field,primary,secondary}=colors;
  c.fillStyle=field;c.fillRect(0,0,w,h);
  if(style==='roland'){
    c.fillStyle=primary;c.fillRect(0,0,w*.205,h);
    for(const [x,y] of [[w*.61,h*.27],[w*.49,h*.63],[w*.73,h*.63]]){c.fillStyle=primary;star(c,x,y,Math.min(w,h)*.12,Math.min(w,h)*.05);}
  }else if(style==='azure'){
    c.fillStyle=secondary;c.fillRect(0,h/3,w,h/3);
    polygon(c,primary,[[0,0],[w*.38,h/2],[0,h]]);
    c.fillStyle=secondary;star(c,w*.14,h/2,Math.min(w,h)*.12,Math.min(w,h)*.045,8);
  }else if(style==='north'){
    c.fillStyle=primary;c.fillRect(w*.23,0,w*.19,h);c.fillRect(0,h*.355,w,h*.29);
    c.fillStyle=secondary;c.fillRect(w*.265,0,w*.125,h);c.fillRect(0,h*.405,w,h*.19);
  }else if(style==='blackstone'){
    polygon(c,secondary,[[0,h*.27],[w*.27,0],[w,h*.73],[w*.73,h],[0,h*.27]]);
    polygon(c,primary,[[0,h*.34],[w*.30,0],[w,h*.66],[w*.70,h],[0,h*.34]]);
  }else if(style==='silvermoon'){
    c.fillStyle=secondary;c.fillRect(0,0,w*.175,h);
    const cx=w*.62,cy=h*.5,r=Math.min(w,h)*.26;
    c.fillStyle=secondary;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
    c.fillStyle=field;c.beginPath();c.arc(cx+r*.45,cy-r*.18,r*1.07,0,Math.PI*2);c.fill();
    c.fillStyle=secondary;star(c,w*.81,h*.33,Math.min(w,h)*.105,Math.min(w,h)*.04);
  }else if(style==='mistsea'){
    const band=h/5;
    c.fillStyle=secondary;c.fillRect(0,band,w,band);c.fillRect(0,band*3,w,band);
    c.fillStyle=primary;c.fillRect(0,band*2,w,band);
    c.fillStyle='#003049';c.fillRect(0,0,w*.38,h*.6);
    c.fillStyle=secondary;star(c,w*.19,h*.3,Math.min(w,h)*.16,Math.min(w,h)*.06,8);
  }
}
export function drawNationalFlag(canvas,faction){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.save();c.imageSmoothingEnabled=false;
  drawFlagField(c,faction.castleStyle,w,h);
  c.restore();
}
