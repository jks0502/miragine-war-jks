// Original articulated 2D characters. Shapes are rendered at 2x resolution and
// cached by animation frame, so dense armies reuse images rather than paths.
const INK='#172326';
const TEAMS=[{main:'#af3e49',hi:'#ed8b7c',dark:'#632736'},{main:'#356d9e',hi:'#88c9e6',dark:'#223c63'}];
const DOCTOR_PALETTES={
  roland:{cloak:'#d41432',cloakDark:'#6c1223',robe:'#153b9a',robeDark:'#0b214f',lining:'#ffd12a'},
  azure:{cloak:'#0057d9',cloakDark:'#053064',robe:'#eafaff',robeDark:'#80b4d4',lining:'#f7fbff'},
  north:{cloak:'#008f4c',cloakDark:'#07432f',robe:'#f1fff7',robeDark:'#6e8e99',lining:'#2edbff'},
  blackstone:{cloak:'#e85000',cloakDark:'#712700',robe:'#29211f',robeDark:'#111214',lining:'#ffc21c'},
  silvermoon:{cloak:'#6a20d0',cloakDark:'#32105d',robe:'#291050',robeDark:'#160a2d',lining:'#f5eeff'},
  mistsea:{cloak:'#00739c',cloakDark:'#00384d',robe:'#ffffff',robeDark:'#8daab4',lining:'#ffffff'}
};
export const VISUALS=[
  {role:'轻装长枪',height:94,scale:.90},
  {role:'圆盾老兵',height:65,scale:.90},
  {role:'裹尸布木乃伊',height:74,scale:1.00},
  {role:'林地弓箭手',height:82,scale:.94},
  {role:'盾剑卫士',height:66,scale:.93},
  {role:'疾行刺客',height:54,scale:.95},
  {role:'圣书修士',height:94,scale:.92},
  {role:'重甲长矛兵',height:82,scale:.99},
  {role:'棍术武僧',height:65,scale:.96},
  {role:'暗夜贵族',height:72,scale:.95},
  {role:'疾风骑兵',height:98,scale:.83},
  {role:'幽魂甲胄',height:74,scale:.97},
  {role:'奥术法师',height:99,scale:.93},
  {role:'钢铁堡垒',height:77,scale:1.04},
  {role:'猩红光刃领主',height:86,scale:1.04},
  {role:'曙光领主',height:83,scale:1.04},
  {role:'红披风秘术大师',height:88,scale:.94},
  {role:'谜影行者',height:84,scale:1.00}
];
function shape(c,fill,points,width=1.3,stroke=INK){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(width){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function curve(c,fill,path,width=1.3,stroke=INK){
  c.beginPath();for(const [op,...p] of path)c[op](...p);
  if(fill){c.fillStyle=fill;c.fill();}if(width){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,color,points,width=1.5){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function ellipse(c,fill,x,y,rx,ry,width=0,stroke=INK){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
  if(width){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
}
function gradient(c,a,b,x=-12,y=-50,x2=15,y2=-15){const g=c.createLinearGradient(x,y,x2,y2);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function gem(c,x,y,color,size=3){shape(c,color,[[x,y-size],[x+size*.8,y],[x,y+size],[x-size*.8,y]],.6);line(c,'#ffffdd',[[x,y-size+1],[x-1,y]],.8);}
function glow(c,x,y,color,r=12){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');ellipse(c,g,x,y,r,r);}
function factionMark(c,team,kind){
  const style=team.style||'roland',main=team.main,hi=team.hi;
  c.save();c.globalAlpha=.9;c.lineCap='round';
  if(style==='roland'){
    line(c,hi,[[-5,-37],[0,-40],[5,-37]],1.4);shape(c,hi,[[0,-39],[-2,-35],[2,-35]],.5);
  }else if(style==='azure'){
    c.strokeStyle=hi;c.lineWidth=1.5;c.beginPath();c.moveTo(-7,-34);c.quadraticCurveTo(-2,-30,3,-34);c.quadraticCurveTo(7,-37,9,-33);c.stroke();line(c,hi,[[1,-39],[1,-31]],1);
  }else if(style==='north'){
    line(c,hi,[[-1,-31],[-5,-37],[-8,-36],[-6,-32]],1.3);line(c,hi,[[-1,-31],[3,-37],[7,-36],[5,-32]],1.3);ellipse(c,main,0,-31,1.5,1.5,0);
  }else if(style==='blackstone'){
    shape(c,hi,[[-6,-39],[-1,-35],[-5,-30],[0,-33],[5,-30],[1,-35],[6,-39],[0,-37]],.8);line(c,main,[[0,-37],[0,-29]],1);
  }else if(style==='silvermoon'){
    c.strokeStyle=hi;c.lineWidth=2;c.beginPath();c.arc(0,-35,6,.75,5.25);c.stroke();gem(c,6,-30,hi,1.4);
  }else if(style==='mistsea'){
    line(c,hi,[[-8,-35],[-3,-32],[2,-35],[7,-32]],1.3);shape(c,hi,[[-2,-40],[2,-40],[2,-32],[-2,-32]],.6);
  }
  c.restore();
}
function dreadFactionArmor(c,team,phase,moving){
  const style=team.style||'roland',main=team.main,hi=team.hi,accent=team.accent||hi;
  const sway=moving?Math.sin(phase)*1.5:0;
  const shoulder=(points,fill,edge=hi)=>shape(c,gradient(c,fill,team.dark),points,1.1,edge);
  c.save();c.lineJoin='round';
  if(style==='roland'){
    // Crowned royal executioner: gold-edged pauldrons and a crown crest.
    shoulder([[-9,-51],[-19,-57],[-27,-51],[-24,-42],[-12,-39]],'#32151f','#e7b84e');
    shoulder([[9,-51],[19,-57],[27,-51],[24,-42],[12,-39]],'#32151f','#e7b84e');
    line(c,'#ffd36a',[[-23,-49],[-15,-48],[-12,-43]],1.4);line(c,'#ffd36a',[[23,-49],[15,-48],[12,-43]],1.4);
    shape(c,gradient(c,'#f4d36c','#9a671e'),[[-9,-74],[-7,-83],[-2,-77],[0,-86],[3,-77],[8,-83],[10,-73]],1.1,'#fff0ad');
    line(c,'#f3cf69',[[-6,-40],[0,-36],[6,-40]],1.5);gem(c,0,-36,'#ffe184',2.4);
  }else if(style==='azure'){
    // Sea republic: swept sail-like shoulder guards, rope seams and wave crest.
    shoulder([[-10,-49],[-22,-59],[-28,-54],[-24,-43],[-12,-39]],'#063d70','#c9f7ff');
    shoulder([[10,-49],[22,-59],[28,-54],[24,-43],[12,-39]],'#063d70','#c9f7ff');
    shape(c,gradient(c,'#eafcff','#087aab'),[[-12,-62],[-21,-70],[-17,-59],[-9,-56]],1,'#e2fbff');
    shape(c,gradient(c,'#eafcff','#087aab'),[[12,-62],[21,-70],[17,-59],[9,-56]],1,'#e2fbff');
    curve(c,'#d4fbff',[['moveTo',-20,-47],['quadraticCurveTo',-14,-52,-8,-47],['quadraticCurveTo',-2,-42,4,-47],['quadraticCurveTo',10,-52,18,-46]],1.6);
    for(const x of [-18,-12,12,18])ellipse(c,'#dffbff',x,-51,1.2,1.2,0);
  }else if(style==='north'){
    // Northern clans: antler crown, pale fur mantle and ice-crystal shoulders.
    shoulder([[-9,-50],[-20,-56],[-26,-50],[-23,-41],[-11,-38]],'#d7e2d9','#f4fbff');
    shoulder([[9,-50],[20,-56],[26,-50],[23,-41],[11,-38]],'#d7e2d9','#f4fbff');
    for(let i=0;i<5;i++){
      const x=-22+i*11,y=-48+(i%2)*2;
      shape(c,i%2?'#f4fbff':'#a9c3c3',[[x-3,y],[x+2,y-2],[x+4,y+3],[x,y+1]],.6,'#e8f5f4');
    }
    line(c,'#e9fbff',[[-8,-65],[-15,-71],[-17,-80],[-13,-76],[-12,-69],[-20,-73]],2.1);
    line(c,'#e9fbff',[[8,-65],[15,-71],[17,-80],[13,-76],[12,-69],[20,-73]],2.1);
    shape(c,'#72dff4',[[-22,-52],[-18,-61],[-14,-52],[-18,-48]],.8,'#d9ffff');
    shape(c,'#72dff4',[[22,-52],[18,-61],[14,-52],[18,-48]],.8,'#d9ffff');
  }else if(style==='blackstone'){
    // Blackstone: heavy furnace pauldrons, rivets, vents and ember seams.
    shoulder([[-10,-51],[-22,-57],[-29,-52],[-27,-40],[-12,-38]],'#25272b','#6f7276');
    shoulder([[10,-51],[22,-57],[29,-52],[27,-40],[12,-38]],'#25272b','#6f7276');
    for(const sign of [-1,1]){
      line(c,'#ff5318',[[sign*23,-51],[sign*23,-43]],2.2);
      for(const yy of [-52,-46])ellipse(c,'#e6a33c',sign*16,yy,1.2,1.2,0,'#494b4d');
    }
    shape(c,gradient(c,'#9d2511','#36110e'),[[-5,-76],[0,-84],[5,-76],[3,-71],[-3,-71]],1,'#ff6b1a');
    for(const y of [-42,-39,-36])line(c,y===-39?'#ff641f':'#7c3220',[[-5,y],[5,y]],1.1);
    gem(c,0,-39,'#ff9a22',2.2);
  }else if(style==='silvermoon'){
    // Silvermoon: crescent diadem, asymmetric ritual mantle and lunar inlays.
    c.strokeStyle='#e9dcff';c.lineWidth=3;c.beginPath();c.arc(0,-62,20,Math.PI*1.12,Math.PI*1.88);c.stroke();
    c.strokeStyle='#a56aff';c.lineWidth=1.3;c.beginPath();c.arc(0,-62,24,Math.PI*1.19,Math.PI*1.81);c.stroke();
    shoulder([[-9,-50],[-20,-55],[-25,-49],[-20,-40],[-11,-38]],'#342354','#dac8ff');
    shoulder([[9,-50],[20,-55],[25,-49],[20,-40],[11,-38]],'#25173d','#9e75e5');
    curve(c,'#d8c8ff',[['moveTo',-22,-45],['quadraticCurveTo',-15,-39,-7,-44],['quadraticCurveTo',1,-49,8,-43],['quadraticCurveTo',15,-39,22,-46]],1.3);
    for(const [x,y] of [[-19,-53],[-13,-42],[14,-50],[20,-43]])gem(c,x,y,'#f3ecff',1.7);
  }else if(style==='mistsea'){
    // Mistsea: white watch-tower crest, high sea-cloak collar and layered veil.
    shoulder([[-10,-52],[-20,-62],[-27,-54],[-24,-41],[-12,-37]],'#8db5c4','#f4feff');
    shoulder([[10,-52],[20,-62],[27,-54],[24,-41],[12,-37]],'#507d91','#e8fbff');
    shape(c,gradient(c,'#f6ffff','#77aabd'),[[-6,-74],[-5,-83],[0,-87],[5,-83],[6,-74]],1.1,'#ffffff');
    line(c,'#f6ffff',[[-4,-80],[4,-80]],1.2);line(c,'#efffff',[[0,-79],[0,-74]],1.1);
    curve(c,'#f2ffff',[['moveTo',-22,-47],['quadraticCurveTo',-13,-53,-6,-45],['quadraticCurveTo',1,-38,8,-45],['quadraticCurveTo',15,-53,23,-46]],1.6);
    for(const x of [-18,-12,12,18])line(c,'#c5eff7',[[x,-47],[x+sway*.25,-38]],1.1);
    shape(c,'#c8f3f8',[[-4,-35],[0,-38],[4,-35],[0,-31]],.7);
  }
  c.restore();
}
// Country skins are built from material and silhouette cues as well as color.
// Every branch below is visual-only: it never changes a unit's hit box or timing.
function factionOutfit(c,team,kind,phase,moving,attack){
  const style=team.style||'roland',drift=moving?Math.sin(phase)*1.5:0;
  c.save();c.lineCap='round';
  if(kind===14){dreadFactionArmor(c,team,phase,moving);c.restore();return;}
  if(style==='roland'){
    if(![2,8,10].includes(kind)){shape(c,team.dark,[[-16,-49],[-9,-54],[0,-51],[9,-54],[16,-49],[10,-43],[-10,-43]],.9);line(c,team.hi,[[-12,-47],[0,-50],[12,-47]],1.5);}
    if(kind===0){shape(c,team.hi,[[-5,-45],[6,-45],[8,-35],[-7,-35]],.8);line(c,team.main,[[-6,-34],[7,-34]],2);}
    else if(kind===2){line(c,team.hi,[[-8,-48],[8,-47]],2);shape(c,team.hi,[[-3,-27],[2,-27],[0,-22]],.6);}
    else if(kind===3){line(c,team.hi,[[-10,-53],[8,-52]],2);gem(c,0,-55,team.hi,1.8);}
    else if(kind===4){gem(c,0,-31,team.hi,3);line(c,team.hi,[[-6,-37],[6,-37]],1);}
    else if(kind===5){line(c,team.hi,[[-12,-38],[7,-38]],2);gem(c,0,-43,team.hi,1.5);}
    else if(kind===7){shape(c,team.hi,[[-20,-51],[-13,-59],[-5,-52],[-13,-44]],1);shape(c,team.hi,[[20,-51],[13,-59],[5,-52],[13,-44]],1);line(c,team.hi,[[-6,-29],[7,-29]],1.5);}
    else if(kind===8){for(let i=0;i<3;i++)gem(c,-7+i*5,-30,team.hi,1.2);}
    else if(kind===9){line(c,team.hi,[[-7,-48],[0,-44],[7,-48]],1.6);gem(c,0,-45,team.hi,1.5);}
    else if(kind===10){shape(c,team.hi,[[-20,-38],[-6,-43],[8,-39],[6,-31],[-9,-30]],.8);line(c,team.hi,[[21,-43],[21,-26]],1.5);}
    else if(kind===12){shape(c,team.hi,[[-4,-72],[0,-77],[4,-72],[0,-69]],.7);line(c,team.hi,[[-8,-70],[0,-76],[8,-70]],1.4);}
    else if(kind===15){shape(c,team.hi,[[-7,-68],[-3,-74],[0,-70],[3,-74],[7,-68]],.9);}
    else if(kind===16){line(c,team.hi,[[-12,-55],[0,-62],[12,-55]],1.8);shape(c,team.hi,[[-4,-63],[0,-68],[4,-63]],.7);gem(c,0,-60,team.hi,1.7);}
    else if(kind===17){shape(c,team.hi,[[-5,-47],[0,-51],[5,-47],[0,-43]],.7);}
  }else if(style==='azure'){
    if(![2,8,10].includes(kind)){curve(c,team.hi,[['moveTo',-17,-48],['quadraticCurveTo',-9,-56,0,-49],['quadraticCurveTo',9,-56,17,-48]],2);line(c,team.main,[[-13,-46],[13,-46]],2);}
    if(kind===0){curve(c,team.hi,[['moveTo',-8,-42],['quadraticCurveTo',-2,-47,4,-42],['quadraticCurveTo',8,-39,11,-42]],1.4);}
    else if(kind===2){curve(c,team.hi,[['moveTo',-9,-49],['quadraticCurveTo',0,-44,9,-49]],1.5);line(c,team.hi,[[-2,-28],[4,-25]],1.2);}
    else if(kind===3){for(let i=0;i<3;i++)line(c,team.hi,[[-10+i*2,-48],[-6+i*2,-53]],1);}
    else if(kind===4){shape(c,team.hi,[[-2,-34],[2,-34],[2,-29],[7,-29],[0,-24],[-7,-29],[-2,-29]],.7);}
    else if(kind===5){curve(c,team.hi,[['moveTo',-14,-37],['quadraticCurveTo',-3,-32,8,-37]],1.6);}
    else if(kind===7){shape(c,team.hi,[[-21,-52],[-13,-58],[-5,-51],[-12,-43]],1);shape(c,team.hi,[[21,-52],[13,-58],[5,-51],[12,-43]],1);line(c,team.hi,[[-7,-28],[7,-28]],1.3);}
    else if(kind===8){for(let i=0;i<4;i++)line(c,team.hi,[[-11+i*4,-42],[-9+i*4,-37]],1.2);}
    else if(kind===9){for(const x of [-5,5])gem(c,x,-47,team.hi,1.3);}
    else if(kind===10){shape(c,team.hi,[[-19,-37],[-7,-42],[8,-38],[6,-30],[-8,-29]],.8);line(c,team.hi,[[21,-44],[21,-26]],1.4);}
    else if(kind===12){c.strokeStyle=team.hi;c.lineWidth=1.3;c.beginPath();c.arc(0,-58,7,-1.1,1.1);c.stroke();line(c,team.hi,[[0,-65],[0,-51]],1);shape(c,team.hi,[[-10,-56],[-5,-60],[-8,-65]],.6);shape(c,team.hi,[[10,-56],[5,-60],[8,-65]],.6);}
    else if(kind===15){line(c,team.hi,[[-8,-70],[0,-74],[8,-70]],1.3);}
    else if(kind===16){c.strokeStyle=team.hi;c.lineWidth=1.3;c.beginPath();c.arc(0,-59,8,0,Math.PI*2);c.stroke();line(c,team.hi,[[0,-67],[0,-51]],1);}
    else if(kind===17){shape(c,team.hi,[[-6,-48],[0,-52],[6,-48],[0,-44]],.7);}
  }else if(style==='north'){
    if(![2,8,10].includes(kind)){ellipse(c,'#e7e1c2',0,-48,16,5,1,'#a8b79d');line(c,team.main,[[-14,-45],[14,-45]],2);}
    if(kind===0){ellipse(c,'#e7e1c2',0,-45,11,4,1,'#a8b79d');line(c,team.main,[[-9,-43],[9,-43]],2);}
    else if(kind===2){line(c,'#dcebf0',[[-8,-48],[8,-47]],1.8);gem(c,0,-27,'#dcebf0',1.6);}
    else if(kind===3){line(c,'#dcebf0',[[-10,-51],[-5,-56]],1.4);line(c,'#dcebf0',[[5,-51],[10,-56]],1.4);}
    else if(kind===4){line(c,'#b99968',[[-8,-40],[0,-35],[8,-40]],2);gem(c,0,-32,'#dcebf0',1.5);}
    else if(kind===5){curve(c,'#e7e1c2',[['moveTo',-14,-39],['quadraticCurveTo',-7,-33,0,-39],['quadraticCurveTo',7,-33,14,-39]],1.5);}
    else if(kind===7){ellipse(c,'#e7e1c2',0,-49,15,5,1,'#a8b79d');shape(c,'#cfeaf0',[[-5,-57],[0,-68],[5,-57],[0,-51]],1);shape(c,'#cfeaf0',[[-21,-51],[-27,-57],[-20,-59],[-14,-52]],.8);shape(c,'#cfeaf0',[[21,-51],[27,-57],[20,-59],[14,-52]],.8);}
    else if(kind===8){for(let i=0;i<4;i++)ellipse(c,'#d6c08c',-7+i*4,-34,1.2,1.5,0);}
    else if(kind===9){ellipse(c,'#e7e1c2',0,-48,10,3.5,1,'#a8b79d');}
    else if(kind===10){curve(c,'#e7e1c2',[['moveTo',-21,-39],['quadraticCurveTo',-7,-47,9,-40],['lineTo',7,-31],['lineTo',-10,-30],['closePath']],.8);}
    else if(kind===12){line(c,'#dcebf0',[[-5,-69],[-11,-77],[-7,-77]],1.8);line(c,'#dcebf0',[[5,-69],[11,-77],[7,-77]],1.8);line(c,'#dcebf0',[[-5,-69],[0,-78],[5,-69]],1.8);ellipse(c,'#d6c08c',0,-67,2,2,0);}
    else if(kind===15){line(c,'#dcebf0',[[-8,-70],[0,-77],[8,-70]],1.5);}
    else if(kind===16){c.strokeStyle='#dcebf0';c.lineWidth=2;c.beginPath();c.arc(0,-59,11,Math.PI,Math.PI*2);c.stroke();line(c,'#dcebf0',[[-9,-59],[-14,-66]],1.2);line(c,'#dcebf0',[[9,-59],[14,-66]],1.2);gem(c,0,-68,'#d6c08c',1.5);}
    else if(kind===17){shape(c,'#d6c08c',[[-5,-48],[0,-54],[5,-48],[0,-44]],.7);}
  }else if(style==='blackstone'){
    if(![2,8,10].includes(kind)){shape(c,'#24282b',[[-18,-50],[-12,-56],[-4,-52],[4,-52],[12,-56],[18,-50],[13,-42],[-13,-42]],1.2);line(c,team.hi,[[-13,-47],[13,-47]],2);}
    if(kind===0){shape(c,team.accent||team.hi,[[-7,-46],[7,-46],[6,-37],[-6,-37]],.8);for(const x of [-8,8])ellipse(c,team.hi,x,-40,1.1,1.1,0);}
    else if(kind===2){line(c,team.hi,[[-9,-48],[9,-47]],2);for(const x of [-5,5])ellipse(c,team.hi,x,-28,1,1,0);}
    else if(kind===3){for(const x of [-9,9])ellipse(c,team.hi,x,-41,1.2,1.2,0);line(c,team.hi,[[-8,-36],[8,-36]],1.2);}
    else if(kind===4){line(c,team.hi,[[-7,-37],[0,-33],[7,-37]],2);for(const x of [-6,6])ellipse(c,team.hi,x,-31,1,1,0);}
    else if(kind===5){line(c,team.hi,[[-10,-56],[7,-54]],2);line(c,team.hi,[[-4,-46],[5,-46]],1);}
    else if(kind===7){for(const x of [-20,20]){shape(c,'#15191b',[[x,-54],[x+(x<0?-8:8),-61],[x+(x<0?-2:2),-46]],1);ellipse(c,team.hi,x,-50,2,2,0);}line(c,team.hi,[[-8,-28],[8,-28]],1.7);line(c,team.hi,[[-6,-39],[6,-39]],1);}
    else if(kind===8){for(const x of [-8,8])line(c,team.hi,[[x,-42],[x*1.2,-31]],2);}
    else if(kind===9){line(c,team.hi,[[-8,-48],[8,-48]],2);gem(c,0,-45,team.hi,1.5);}
    else if(kind===10){shape(c,team.hi,[[-20,-40],[-8,-45],[8,-41],[8,-30],[-9,-29]],.8);for(const x of [-14,5])ellipse(c,team.hi,x,-35,1,1,0);}
    else if(kind===12){c.strokeStyle=team.hi;c.lineWidth=2;c.beginPath();c.arc(0,-57,9,0,Math.PI*2);c.stroke();shape(c,team.hi,[[-4,-72],[0,-79],[4,-72]],.8);}
    else if(kind===15){shape(c,team.hi,[[-9,-70],[-4,-79],[0,-72],[5,-79],[10,-70]],1.2);}
    else if(kind===16){for(const x of [-7,7])line(c,team.hi,[[x,-55],[x*1.5,-64]],1.4);gem(c,0,-60,team.hi,1.8);}
    else if(kind===17){shape(c,team.hi,[[-6,-48],[0,-52],[6,-48],[0,-44]],.8);}
  }else if(style==='silvermoon'){
    if(![2,8,10].includes(kind)){curve(c,team.hi,[['moveTo',-18,-51],['quadraticCurveTo',-7,-58,0,-50],['quadraticCurveTo',7,-58,18,-51]],2);curve(c,team.dark,[['moveTo',-14,-45],['quadraticCurveTo',0,-40,14,-45]],1);}
    if(kind===0){c.strokeStyle=team.hi;c.lineWidth=1.6;c.beginPath();c.arc(0,-42,6,.7,5.5);c.stroke();}
    else if(kind===2){for(let i=0;i<3;i++)line(c,team.hi,[[-7+i*5,-48],[-2+i*5,-47]],1);}
    else if(kind===3){c.strokeStyle=team.hi;c.lineWidth=1.5;c.beginPath();c.arc(0,-43,7,.7,5.5);c.stroke();}
    else if(kind===4){c.strokeStyle=team.hi;c.lineWidth=1.5;c.beginPath();c.arc(0,-33,6,.7,5.5);c.stroke();gem(c,5,-30,team.hi,1);}
    else if(kind===5){c.strokeStyle=team.hi;c.lineWidth=1.4;c.beginPath();c.arc(0,-58,7,.7,5.5);c.stroke();}
    else if(kind===7){c.strokeStyle=team.hi;c.lineWidth=2;c.beginPath();c.arc(0,-44,15,.7,5.5);c.stroke();line(c,team.hi,[[-7,-29],[7,-29]],1.2);shape(c,team.hi,[[-3,-55],[0,-61],[3,-55]],.7);}
    else if(kind===8){for(let i=0;i<4;i++)gem(c,-7+i*5,-34,team.hi,1.1);}
    else if(kind===9){c.strokeStyle=team.hi;c.lineWidth=1.7;c.beginPath();c.arc(0,-47,7,.7,5.5);c.stroke();}
    else if(kind===10){curve(c,team.hi,[['moveTo',-20,-38],['quadraticCurveTo',-5,-45,10,-39],['lineTo',8,-30],['lineTo',-10,-29],['closePath']],.8);}
    else if(kind===12){c.strokeStyle=team.hi;c.lineWidth=2;c.beginPath();c.arc(0,-59,10,.7,5.5);c.stroke();shape(c,team.hi,[[-4,-72],[0,-78],[4,-72]],.7);}
    else if(kind===15){c.strokeStyle=team.hi;c.lineWidth=2;c.beginPath();c.arc(0,-70,8,.7,5.5);c.stroke();}
    else if(kind===16){c.strokeStyle=team.hi;c.lineWidth=2;c.beginPath();c.arc(0,-59,13,.7,5.5);c.stroke();line(c,team.hi,[[-11,-59],[-15,-67]],1.2);line(c,team.hi,[[11,-59],[15,-67]],1.2);}
    else if(kind===17){c.strokeStyle=team.hi;c.lineWidth=1.4;c.beginPath();c.arc(0,-48,6,.7,5.5);c.stroke();}
  }else if(style==='mistsea'){
    if(![2,8,10].includes(kind)){shape(c,team.hi,[[-11,-55],[-5,-59],[5,-59],[11,-55],[7,-42],[-7,-42]],.8);line(c,team.main,[[-8,-47],[8,-47]],2);}
    if(kind===0){shape(c,team.hi,[[-5,-48],[5,-48],[4,-37],[-4,-37]],.7);line(c,team.hi,[[0,-46],[0,-38]],1);}
    else if(kind===2){line(c,team.hi,[[-8,-48],[8,-47]],1.8);shape(c,team.hi,[[-2,-29],[2,-29],[2,-23],[-2,-23]],.5);}
    else if(kind===3){shape(c,team.hi,[[-2,-55],[2,-55],[2,-48],[-2,-48]],.5);line(c,team.hi,[[-9,-45],[9,-45]],1);}
    else if(kind===4){shape(c,team.hi,[[-2,-39],[2,-39],[2,-28],[6,-28],[0,-24],[-6,-28],[-2,-28]],.7);}
    else if(kind===5){shape(c,team.hi,[[-5,-63],[5,-63],[3,-54],[-3,-54]],.6);line(c,team.hi,[[0,-52],[0,-44]],1);}
    else if(kind===7){shape(c,team.hi,[[-21,-53],[-13,-60],[-5,-53],[-12,-44]],1);shape(c,team.hi,[[21,-53],[13,-60],[5,-53],[12,-44]],1);shape(c,team.hi,[[-4,-45],[4,-45],[4,-25],[-4,-25]],.8);}
    else if(kind===8){for(let i=0;i<3;i++)shape(c,team.hi,[[-8+i*6,-38],[-5+i*6,-38],[-5+i*6,-31],[-8+i*6,-31]],.4);}
    else if(kind===9){shape(c,team.hi,[[-7,-51],[7,-51],[5,-43],[-5,-43]],.7);line(c,team.hi,[[-6,-42],[6,-42]],1);}
    else if(kind===10){shape(c,team.hi,[[-20,-39],[-7,-44],[9,-40],[7,-30],[-9,-29]],.8);line(c,team.hi,[[21,-44],[21,-26]],1.3);}
    else if(kind===12){shape(c,team.hi,[[-5,-76],[5,-76],[5,-63],[-5,-63]],.8);line(c,team.hi,[[0,-63],[0,-53]],1.2);}
    else if(kind===15){shape(c,team.hi,[[-4,-75],[4,-75],[4,-67],[-4,-67]],.8);line(c,team.hi,[[-7,-69],[7,-69]],1.2);}
    else if(kind===16){shape(c,team.hi,[[-6,-67],[6,-67],[6,-53],[-6,-53]],.8);line(c,team.hi,[[0,-53],[0,-45]],1.2);}
    else if(kind===17){shape(c,team.hi,[[-4,-51],[4,-51],[4,-44],[-4,-44]],.6);}
  }
  c.restore();
}
function limb(c,points,color,width=6){line(c,INK,points,width+2);line(c,color,points,width);line(c,'#f6edcf35',points.map(([x,y])=>[x-1,y-1]),1);}
function sword(c,type='sword',tint='#d9e7e5'){
  const gold=type==='royal'?'#eed796':'#c4a26b';
  if(type==='axe'){
    limb(c,[[0,10],[0,-40]],'#736046',3);
    shape(c,gradient(c,'#b0bdc0','#3d4d59'),[[-1,-35],[13,-43],[23,-31],[21,-17],[11,-20],[1,-26]],1.5);
    line(c,'#e2d8c2',[[14,-41],[22,-30],[20,-19]],2);return;
  }
  if(type==='hammer'){
    limb(c,[[0,10],[0,-34]],'#665a44',4);
    shape(c,gradient(c,'#b5c4c4','#485b68'),[[-14,-43],[13,-44],[18,-38],[13,-26],[-14,-27],[-18,-33]],1.8);
    line(c,'#e0dac2',[[-13,-40],[10,-41],[14,-37]],1.5);return;
  }
  if(type==='katana'){
    curve(c,gradient(c,'#faf1d1','#7d9caa'),[['moveTo',-2,0],['quadraticCurveTo',-1,-24,15,-48],['quadraticCurveTo',7,-20,3,0],['closePath']]);
    line(c,'#ffffffaa',[[1,-4],[5,-21],[13,-44]],1);
  }else{
    const length=type==='dagger'?24:type==='royal'?49:type==='great'?48:type==='rapier'?43:36;
    const w=type==='dagger'?3:type==='great'||type==='royal'?6:type==='rapier'?1.8:4;
    shape(c,gradient(c,tint,'#758c99'),[[-w,0],[-w,-length+8],[0,-length],[w,-length+8],[w,0]],1.1);
    shape(c,'#fffbea8c',[[0,-length+2],[-w+1,-length+9],[-w+1,-1],[0,-1]],0);
    if(type==='royal'){line(c,'#ccb169',[[0,-9],[0,-33]],1);gem(c,0,-20,'#f8d36f',2);}
  }
  shape(c,gold,[[-9,1],[-8,-2],[-3,-1],[0,-3],[3,-1],[8,-2],[9,1],[3,3],[-3,3]],1);
  limb(c,[[0,4],[0,12]],'#634940',3.5);for(let y=5;y<12;y+=3)line(c,gold,[[-2,y],[2,y-1]],.7);
  ellipse(c,gold,0,14,2.7,2.7,1);
}
function dreadSaber(c,team,variant,phase,attack,moving,runPose){
  const pulse=attack>0?Math.sin(Math.PI*Math.min(1,attack)*.95):0;
  const carry=moving&&runPose?7:0;
  // A ribbed black-metal hilt, not a steel sword: the plasma blade is the
  // defining silhouette and stays red on either side of the battlefield.
  limb(c,[[0,13+carry],[0,-4]],'#131519',5.2);
  shape(c,gradient(c,'#555a61','#17191e'),[[-4,6],[4,6],[3,15],[-3,15]],.8,'#777b80');
  for(const y of [0,4,8])line(c,y===4?'#c21b31':'#777b80',[[-3,y],[3,y]],1.1);
  const blade=c.createLinearGradient(-4,-58,4,-4);
  blade.addColorStop(0,'#ff5265');blade.addColorStop(.34,'#f10e2e');blade.addColorStop(1,'#a4001b');
  c.save();c.lineCap='round';c.shadowColor='#ff193f';c.shadowBlur=attack>0?13:7;
  c.strokeStyle='#670716';c.lineWidth=11;c.beginPath();c.moveTo(0,-4);c.lineTo(0,-55);c.stroke();
  c.strokeStyle=blade;c.lineWidth=6.4;c.beginPath();c.moveTo(0,-5);c.lineTo(0,-54);c.stroke();
  c.shadowBlur=0;c.strokeStyle='#fff1f1';c.lineWidth=1.5;c.beginPath();c.moveTo(-.2,-9);c.lineTo(-.2,-49);c.stroke();
  shape(c,gradient(c,'#d3d6d8','#4c5056'),[[-3,-1],[3,-1],[2,3],[-2,3]],.5,'#f0d5d6');
  c.restore();
  if(moving&&runPose){
    c.globalAlpha=.3;c.strokeStyle='#fa253e';c.lineWidth=2.5;c.beginPath();c.moveTo(-1,-31);c.lineTo(-9,-25);c.stroke();c.globalAlpha=1;
  }
  if(pulse>.25){c.save();c.globalAlpha=.18*pulse;c.fillStyle='#f81738';c.beginPath();c.arc(0,-6,9+pulse*3,0,Math.PI*2);c.fill();c.restore();}
}
function vampireClaw(c,team,phase=0,variant=0,attack=0){
  const skin='#d1c6cc',splay=variant===1?1.5:variant===2?-.7:0;
  shape(c,gradient(c,'#d8ccd1','#927985'),[[-4,-3],[-2,-6],[3,-5],[6,-2],[5,2],[1,4],[-4,2]],.65);
  for(let i=0;i<4;i++){
    const y=-4+i*2.2,tipX=variant===2?7+(i%2):10+(i%2)*2;
    const tipY=y+(i-1.5)*splay+Math.sin(phase+i*.8)*.45;
    limb(c,[[1,y],[5,tipY*.55],[tipX,tipY]],skin,1.8);
    shape(c,i===1?'#f2e7e2':'#c6b5bd',[[tipX-1.1,tipY-.7],[tipX+2.3,tipY-1.6],[tipX+.3,tipY+.9]],.3);
    if(attack>.1)line(c,team.main,[[tipX-1,tipY-.5],[tipX+.9,tipY-.9]],.75);
  }
  limb(c,[[0,1],[3,4],[7,5]],skin,2.1);
  if(variant===2){c.strokeStyle='#a83d59';c.lineWidth=.8;c.beginPath();c.arc(1,-1,3.2,-.9,.85);c.stroke();}
}
function spear(c,team,phase,attack,moving,guardPose=0){
  const thrust=attack>0?Math.sin(Math.PI*Math.min(1,attack)*.95)*10:0;
  const sway=moving?Math.sin(phase)*.045+(guardPose ? .19 : -.12):.02;
  c.save();c.rotate(sway);
  limb(c,[[0,12],[thrust*.35,-57]],'#674a36',3.4);
  line(c,'#b98d5b',[[-1,4],[1,-47]],1);
  shape(c,gradient(c,'#f4eee0','#889da3'),[[thrust*.35,-72],[thrust*.35-5,-57],[thrust*.35,-51],[thrust*.35+5,-57]],1.1);
  line(c,team.hi,[[thrust*.35-3,-59],[thrust*.35+3,-59]],1.2);
  if(team.style==='roland'){
    line(c,'#ffd12a',[[-.8,-44],[.8,-44]],2.4);line(c,'#ffd12a',[[-.8,-38],[.8,-38]],2.4);
    line(c,'#fff4bd',[[thrust*.35,-70],[thrust*.35,-60]],.9);
  }
  c.restore();
}
function shield(c,type,team,phase,guardPose=0,kind=-1){
  const rolandSpear=kind===7&&team.style==='roland';
  const gold=type==='royal'?'#ffd12a':rolandSpear?'#ffd12a':'#8d9d9e';
  c.save();c.translate(-11,-29);c.rotate(Math.sin(phase)*.03+guardPose*.12);
  if(type==='round'){
    ellipse(c,'#3a302b',0,0,12,15,2);ellipse(c,gradient(c,team.hi,team.dark),0,0,10,13,1,gold);
    line(c,'#9b7a54',[[-8,-7],[8,7]],2);ellipse(c,'#c8b58a',0,0,3.5,4,1);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(c,'#e0c487',Math.cos(a)*8,Math.sin(a)*11,1,1);}
  }else{
    const tower=type==='tower',w=tower?14:11,h=tower?24:18;
    shape(c,gradient(c,'#abb9b5','#3a4e59'),[[-w,-h+4],[0,-h],[w,-h+4],[w-2,h-5],[0,h],[-w+2,h-5]],1.8);
    shape(c,type==='royal'?'#e6e4cc':team.main,[[-w+3,-h+7],[0,-h+3],[w-3,-h+7],[w-4,h-7],[0,h-4],[-w+4,h-7]],1,gold);
    if(rolandSpear){
      shape(c,'#a70d2b',[[-8,-14],[0,-18],[8,-14],[6,9],[0,15],[-6,9]],.8,'#ffd12a');
      shape(c,'#ffd12a',[[-5,-9],[0,-13],[5,-9],[1,-5],[4,0],[0,5],[-4,0],[-1,-5]],.45);
      for(const y of [-20,17])line(c,'#fff0a3',[[-6,y],[6,y]],1);
    }
    line(c,gold,[[0,-h+6],[0,h-5]],2.5);line(c,gold,[[-w+5,-7],[w-5,-7]],2);
    gem(c,0,-6,type==='royal'?'#69d9db':'#e7c786',3.6);
    if(tower){for(const y of [-15,8])for(const x of [-10,10])ellipse(c,'#e0d5ac',x,y,1.3,1.3);}
  }c.restore();
}
function cape(c,team,kind,phase,moving){
  const flow=moving?(kind===9?(Math.sin(phase)<0?20:7):kind===14?(Math.sin(phase)<0?22:8):12):3,wave=Math.sin(phase)*4;
  const dreadCloaks={roland:'#210c18',azure:'#09263c',north:'#25352f',blackstone:'#101113',silvermoon:'#211332',mistsea:'#0b2934'};
  const color=kind===9?'#412a50':kind===11?'#253f4c':kind===15?'#d8d8c8':kind===14?(dreadCloaks[team.style]||'#080a0e'):team.dark;
  curve(c,gradient(c,color,kind===15?'#a9b8b3':kind===14?(team.dark||'#270810'):'#192735'),[
    ['moveTo',-5,-48],['quadraticCurveTo',-21,-47,-20-flow,-28],
    ['quadraticCurveTo',-21-flow,-11,-26-flow,-2+wave],['lineTo',-12,-6],['lineTo',-5,-1],
    ['quadraticCurveTo',6,-22,2,-44],['closePath']]);
  line(c,kind===15?'#eacb80':kind===14?'#bd1730':team.main,[[-10,-43],[-16-flow,-24],[-18-flow,-9+wave]],kind===14?3:2.3);
  if(kind===14){
    curve(c,'#ff5364',[['moveTo',-13,-36],['quadraticCurveTo',-20-flow*.55,-24,-21-flow,-11+wave],['lineTo',-14,-8]],1.25);
    line(c,team.hi,[[-16-flow*.7,-20+wave],[-21-flow,-13+wave]],.9);
    if(team.style==='roland'){
      line(c,'#f1cb68',[[-12,-42],[-23-flow*.5,-22],[-28-flow,-5+wave]],1.8);gem(c,-11,-43,'#ffe18a',1.8);
    }else if(team.style==='azure'){
      curve(c,'#d7faff',[['moveTo',-11,-42],['quadraticCurveTo',-26-flow*.55,-26,-29-flow,-7+wave]],1.7);
      line(c,'#55d9f1',[[-17,-37],[-39-flow*.7,-26],[-29-flow,-11]],1.1);
    }else if(team.style==='north'){
      line(c,'#eff8e9',[[-16,-34],[-25-flow*.6,-27],[-22-flow,-21],[-31-flow,-15],[-26-flow,-8+wave]],1.8);
      for(let i=0;i<3;i++)gem(c,-25-flow*.45-i*4,-26+i*7,'#bceafa',1.2);
    }else if(team.style==='blackstone'){
      line(c,'#ff5a1e',[[-15,-37],[-22-flow*.55,-25],[-28-flow,-10+wave]],2);
      for(let i=0;i<3;i++)ellipse(c,'#ec9b39',-18-flow*.45-i*3,-31+i*7,1.2,1.2,0);
    }else if(team.style==='silvermoon'){
      curve(c,'#c6a4ff',[['moveTo',-14,-39],['quadraticCurveTo',-24-flow*.5,-25,-27-flow,-9+wave]],1.5);
      for(let i=0;i<3;i++)gem(c,-19-flow*.35-i*4,-28+i*7,'#e6d9ff',1.4);
    }else if(team.style==='mistsea'){
      line(c,'#dffaff',[[-13,-39],[-26-flow*.7,-21],[-36-flow,-5+wave]],1.6);
      line(c,'#62c8df',[[-16,-36],[-31-flow*.55,-20],[-43-flow,-10+wave]],1.1);
    }
    if(moving&&Math.sin(phase)<0){c.globalAlpha=.4;c.strokeStyle='#ff334d';c.lineWidth=1.7;c.beginPath();c.moveTo(-27-flow,-9+wave);c.lineTo(-35-flow,-6+wave);c.stroke();c.globalAlpha=1;}
  }
  if(kind===11)for(let i=0;i<3;i++)line(c,'#76d9c780',[[-19-i*3,-6],[-22-i*3,7+Math.sin(phase+i)*4]],1.5);
}
function face(c,kind,team){
  const zombie=kind===2,skin=zombie?'#9db78a':kind===9?'#d6d3d9':kind===17?'#c2d4d4':'#e3bc98';
  ellipse(c,'#6e5144',1,-54,8.3,10,1);
  curve(c,gradient(c,skin,zombie?'#52695d':'#b98064'),[['moveTo',-5,-62],['quadraticCurveTo',7,-66,9,-57],['lineTo',11,-53],['lineTo',8,-51],['quadraticCurveTo',9,-44,2,-44],['lineTo',-5,-49],['closePath']]);
  ellipse(c,skin,-4,-54,2.2,3,0);line(c,'#432e2b',[[5,-56],[8,-55]],1.4);
  line(c,zombie?'#344b37':'#8a4e42',[[4,-48],[8,-49]],1);
  if(zombie||kind===9){glow(c,7,-55,zombie?'#bbf0a090':'#fc537c80',5);ellipse(c,zombie?'#e3ffae':'#ff496e',7,-55,1.4,1);}
  if(kind===0||kind===1){
    curve(c,kind===0?'#6e5035':'#4a3830',[['moveTo',-7,-53],['lineTo',-9,-60],['quadraticCurveTo',-1,-70,8,-63],['lineTo',11,-58],['lineTo',3,-60],['lineTo',-4,-54],['closePath']]);
    if(kind===0)line(c,team.main,[[-7,-57],[6,-60],[10,-58]],3);
    else{line(c,'#e8dac1',[[3,-52],[5,-47]],.8);shape(c,'#786354',[[-6,-50],[0,-44],[7,-45],[2,-40],[-5,-43]],.7);}
  }
}
function helmet(c,kind,team){
  if(kind===16){
    curve(c,gradient(c,'#566aa1','#252b58'),[['moveTo',-12,-50],['quadraticCurveTo',-11,-69,0,-77],['quadraticCurveTo',13,-69,13,-50],['lineTo',7,-46],['lineTo',-7,-46],['closePath']],1.5);
    line(c,'#b3d4ff',[[-8,-61],[0,-68],[8,-61]],1.7);gem(c,0,-59,'#9eeaff',3.5);return;
  }
  if(kind===14){
    c.save();
    shape(c,gradient(c,'#353940','#090b0f',-12,-73,12,-43),[[-12,-52],[-13,-64],[-7,-72],[0,-76],[8,-70],[13,-61],[10,-49],[5,-43],[-7,-44]],1.8,'#777b82');
    shape(c,'#090b0e',[[-10,-60],[-5,-65],[7,-63],[11,-59],[8,-54],[-8,-54]],.8,'#40444b');
    // Narrow red visor: the face stays fully masked even at small zoom.
    c.save();c.shadowColor='#ff1538';c.shadowBlur=8;c.strokeStyle='#ff243f';c.lineWidth=2.7;
    c.beginPath();c.moveTo(-8,-59);c.lineTo(-2,-57);c.lineTo(8,-59);c.stroke();c.restore();
    shape(c,'#16191e',[[-5,-53],[5,-53],[3,-46],[0,-44],[-4,-47]],.7,'#555a61');
    for(let i=0;i<3;i++)line(c,'#747981',[[-2+i*2,-51],[-2+i*2,-48]],.7);
    line(c,team.hi,[[-5,-69],[0,-72],[5,-69]],1.1);
    c.restore();return;
  }
  if(kind===17){
    curve(c,'#202d46',[['moveTo',-12,-49],['quadraticCurveTo',-10,-72,1,-77],['quadraticCurveTo',14,-68,12,-48],['lineTo',5,-44],['lineTo',-7,-45],['closePath']],1.5);
    line(c,'#9df3e2',[[-8,-56],[0,-63],[8,-55]],1.2);gem(c,0,-54,'#a5ffe8',3);return;
  }
  if([0,1,2,6,8,9,12].includes(kind))return;
  if(kind===5){
    curve(c,'#273849',[['moveTo',-9,-50],['lineTo',-9,-61],['quadraticCurveTo',-2,-68,7,-63],['lineTo',11,-56],['lineTo',3,-54],['lineTo',10,-50],['lineTo',4,-44],['lineTo',-7,-47],['closePath']]);
    line(c,'#eec69e',[[2,-56],[8,-56]],2);line(c,team.hi,[[-7,-61],[6,-61]],2);return;
  }
  const dark=[11,13,14].includes(kind),royal=kind===15;
  const base=royal?'#e9e6cf':dark?'#657584':'#b7c5c8',edge=royal?'#c4a165':'#667e8a';
  curve(c,gradient(c,base,dark?'#273441':'#667c89'),[['moveTo',-9,-52],['lineTo',-9,-61],['quadraticCurveTo',-1,-72,9,-63],['lineTo',12,-52],['lineTo',8,-45],['lineTo',3,-47],['lineTo',3,-57],['lineTo',-4,-57],['lineTo',-4,-48],['closePath']],1.4);
  line(c,royal?'#ffedbe':'#e5eeed',[[-6,-61],[0,-65],[6,-63]],1.5);
  line(c,'#17262e',[[4,-55],[10,-56]],2);
  if([7,11,13,14,15].includes(kind)){
    shape(c,base,[[2,-52],[11,-52],[8,-44],[2,-45]],1,edge);
    for(let i=0;i<3;i++)line(c,'#384b56',[[4+i*2,-50],[4+i*2,-46]],.7);
  }
  if(kind===3){
    shape(c,team.dark,[[-11,-56],[-13,-43],[-6,-44],[-5,-55]],1);line(c,team.hi,[[-11,-52],[-7,-52]],1);
    shape(c,'#d7b565',[[-7,-64],[-16,-69],[-14,-58],[-7,-58]],1);
    shape(c,'#efcc7f',[[5,-64],[13,-70],[12,-60],[7,-58]],1);
    line(c,team.main,[[-7,-64],[7,-64]],2.5);
  }
  if([4,7].includes(kind)){
    curve(c,team.main,[['moveTo',-3,-66],['quadraticCurveTo',-15,-77,-24,-61],['quadraticCurveTo',-11,-66,-3,-62],['closePath']],1);line(c,team.hi,[[-7,-68],[-17,-67]],1);
  }
  if(kind===11){glow(c,8,-55,'#74ffe0a0',7);line(c,'#9effe5',[[4,-55],[10,-55]],1.5);gem(c,0,-66,'#7deed8',3);}
  if(royal){
    for(const sign of [-1,1])shape(c,'#f2e4bd',[[sign*5,-63],[sign*15,-78],[sign*16,-67],[sign*13,-64],[sign*13,-59],[sign*8,-59]],1,'#b9935d');
    shape(c,'#dfbc69',[[-7,-65],[-7,-72],[-2,-68],[2,-76],[5,-68],[10,-72],[9,-64]],1);gem(c,1,-68,'#55d0d4',2.3);
  }
}
function staff(c,kind,team,phase){
  limb(c,[[0,12],[0,-52]],kind===8?'#74502f':'#8e7453',3.2);
  line(c,'#d8b16a',[[0,-43],[0,-32]],2.5);
  if(kind===8){line(c,'#c2ac77',[[0,-51],[0,-45]],4);line(c,'#c2ac77',[[0,7],[0,13]],4);return;}
  if(kind===6){
    shape(c,'#d8be81',[[-2,-53],[-2,-61],[2,-61],[2,-53],[7,-53],[7,-49],[2,-49],[2,-43],[-2,-43],[-2,-49],[-7,-49],[-7,-53]],1);
    glow(c,0,-51,'#ffe29e80',10);gem(c,0,-51,'#fff0bf',3);return;
  }
  const primary=team.glow||team.hi,core=team.style==='silvermoon'?'#a82bff':'#d5ffff';
  curve(c,null,[['moveTo',0,-41],['bezierCurveTo',-14,-45,-12,-64,0,-65],['bezierCurveTo',14,-67,18,-51,9,-47]],3,team.hi);
  glow(c,3,-56,`${primary}b8`,18);ellipse(c,team.main,3,-56,6,7,1,team.hi);ellipse(c,core,1,-59,2.3,2.4);
  for(let i=0;i<3;i++){const a=phase+i*2.1;gem(c,3+Math.cos(a)*13,-56+Math.sin(a)*8,team.hi,1.4);}
}
function humanoid(c,kind,team,phase,moving,attack,attackVariant=0){
  const heavy=[7,13,14,15,17].includes(kind),robe=[6,12,16].includes(kind),ghost=kind===11||kind===17;
  const cycle=moving?Math.sin(phase):0,atk=attack>0?Math.sin(Math.PI*Math.min(1,attack)*.95):0;
  const runPose=[4,7,8,9,12,14].includes(kind)&&moving?Math.floor((((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/Math.PI):0;
  const lean=kind===12&&moving?(runPose?.2:-.025):kind===14&&moving?(runPose?.23:-.065):kind===5?(moving?.24:.13):kind===2?.2:kind===4&&moving?(runPose ? .17 : -.025):kind===7&&moving?(runPose ? .14 : .015):kind===8&&moving?(runPose?.13:-.018):kind===9&&moving?(runPose?.22:-.025):moving?.06:0;
  const bob=moving?Math.abs(Math.sin(phase))*(kind===12?(runPose?3.3:.55):kind===14?(runPose?2.5:.45):kind===7?(runPose?1.4:.25):kind===8?(runPose?1.9:.35):kind===9?(runPose?2.2:.3):heavy?1.2:kind===4?(runPose?3.4:.5):2.1):Math.sin(phase)*.45;
  c.save();c.translate(0,-bob);c.scale(1,kind===5?.82:kind===2?.86:1);c.transform(1,0,-lean,1,-lean*23,0);
  if([9,11,14,15,17].includes(kind))cape(c,team,kind,phase,moving);
  if(kind===5){
    const wind=moving?32:15;
    curve(c,team.main,[['moveTo',-6,-48],['quadraticCurveTo',-17,-48,-wind,-41+cycle*3],['lineTo',-wind-6,-46+cycle*4],['quadraticCurveTo',-17,-51,-5,-53],['closePath']],.7);
    curve(c,team.hi,[['moveTo',-7,-50],['quadraticCurveTo',-24,-57,-wind-5,-54-cycle*2],['lineTo',-wind-10,-50],['quadraticCurveTo',-23,-54,-7,-48],['closePath']],.5);
  }
  const skin=kind===2?'#91a582':kind===9?'#d1c6cc':kind===14?'#17191d':'#d6aa87';
  const rolandSpear=kind===7&&team.style==='roland';
  const metal=kind===14?'#292d33':kind===15?'#dfddc6':ghost?'#496875':rolandSpear?'#dce8ed':heavy?'#657d8b':'#95abb3';
  const dark=kind===14?'#090b0f':kind===15?'#aaae9d':ghost?'#1c3443':rolandSpear?'#657886':heavy?'#2e404c':'#4a6571';
  const cloth=kind===14?'#121419':kind===8?'#9b6345':kind===5?'#253746':team.main;
  const stride=kind===12?(runPose?15:3):kind===14?(runPose?17:4):kind===5?14:kind===2?5:kind===4?(runPose?17:4):kind===7?(runPose?11:4):kind===8?(runPose?15:6):kind===9?(runPose?17:5):heavy?6:10;
  for(const back of [true,false]){
    const sign=back?-1:1,swing=cycle*stride*sign;
    const hip=[sign*4,-23],knee=[sign*4+swing*.55,-12-Math.max(0,-cycle*sign)*3],foot=[sign*5+swing,-1-Math.max(0,-cycle*sign)*3];
    limb(c,[hip,knee,foot],back?dark:robe?team.dark:metal,heavy?8:5.5);
    if(!robe){shape(c,back?dark:metal,[[knee[0]-3,knee[1]-3],[knee[0]+4,knee[1]-3],[foot[0]+3,foot[1]-3],[foot[0]-3,foot[1]-2]],.7);}
    shape(c,'#29353a',[[foot[0]-4,foot[1]-3],[foot[0]+3,foot[1]-3],[foot[0]+8,foot[1]],[foot[0]+6,foot[1]+2],[foot[0]-4,foot[1]+1]],1);
  }
  if(robe){
    const mageGlide=kind===12&&moving&&!runPose,hemY=mageGlide?-10:-3,hemSpread=kind===12&&moving&&runPose?6:mageGlide?-2:0;
    curve(c,gradient(c,kind===6?'#e8dfba':team.main,kind===6?'#9a9c81':team.dark),[
      ['moveTo',-9,-45],['lineTo',9,-44],['quadraticCurveTo',8,-20,16+cycle*2+hemSpread,hemY],
      ['lineTo',7+hemSpread*.55,hemY+2],['lineTo',0,hemY],['lineTo',-9,hemY+3],['lineTo',-17-hemSpread,hemY],['quadraticCurveTo',-8,-23,-9,-45],['closePath']]);
    if(mageGlide){
      c.globalAlpha=.42;c.strokeStyle='#c3b2e5';c.lineWidth=1.4;c.beginPath();
      c.moveTo(-8,-11);c.quadraticCurveTo(-22-cycle*5,-21,-30-cycle*4,-35-cycle*3);c.stroke();
      c.globalAlpha=.2;c.strokeStyle='#a7d8f2';c.beginPath();c.ellipse(0,3,15,3.5,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;
    }else if(kind===12&&moving&&runPose){
      const reach=8+Math.abs(cycle)*15;
      limb(c,[[-2,-12],[reach*.55,-7],[reach,-2]],'#4b465b',4);
      limb(c,[[2,-12],[-reach*.45,-7],[-reach,-2]],'#4b465b',4);
      shape(c,'#34404a',[[reach-3,-4],[reach+2,-4],[reach+7,-1],[reach+5,1],[reach-4,0]],.6);
      shape(c,'#34404a',[[-reach-3,-4],[-reach+2,-4],[-reach+7,-1],[-reach+5,1],[-reach-4,0]],.6);
    }
    line(c,kind===6?'#fff2c5':team.hi,[[-5,-32],[-8,-7],[-14,-4]],kind===12?2:1.5);
    shape(c,team.main,[[-3,-43],[2,-44],[6,-6],[1,-5]],.5);
    for(let i=0;i<3;i++)gem(c,2+i*.4,-21+i*5,'#dbc892',1);
  }else{
    const w=heavy?14:kind===2?13:9;
    shape(c,gradient(c,kind===8?skin:kind===5?'#455366':metal,kind===8?'#a67458':dark),[[-w,-46],[-3,-49],[w,-44],[w-2,-24],[5,-20],[-w+2,-24]],1.5);
    shape(c,cloth,[[-6,-28],[7,-28],[11,-16],[1,-18],[-7,-16]],1);
    if(kind!==8&&kind!==2){line(c,kind===14?'#b31931':'#dfede975',[[-w+3,-42],[-2,-44],[w-3,-40]],1.4);line(c,dark,[[-8,-33],[7,-33]],1.5);}
    if(kind===3){for(let i=0;i<4;i++){line(c,team.dark,[[-10,-39+i*5],[10,-39+i*5]],3);for(const x of [-6,-1,4])line(c,'#d0a269',[[x,-39+i*5],[x,-37+i*5]],.8);}}
    if(kind===0){
      // The militia carries a stitched shoulder sash and a small unit pennant
      // so the cheapest troop still reads as a coordinated spear line.
      shape(c,team.main,[[-w+2,-43],[-1,-38],[w-2,-43],[w-3,-37],[-w+3,-37]],.7);
      line(c,team.hi,[[-w+1,-40],[w-1,-40]],1.4);
      for(const x of [-6,5])ellipse(c,'#d4a965',x,-30,1,1.4,0);
    }
    if(kind===2){
      shape(c,team.dark,[[-13,-44],[-8,-47],[-8,-34],[-2,-30],[-10,-29],[-12,-20],[-17,-26]],1);
      for(let i=0;i<4;i++)line(c,'#425447',[[-2,-39+i*3],[7,-38+i*3]],1);
      line(c,'#bdc6a6',[[-7,-41],[6,-29]],2);
    }
    if(kind===8){for(let i=0;i<9;i++){const a=i/8*Math.PI;ellipse(c,'#684b32',Math.cos(a)*8,-44+Math.sin(a)*8,1.9,2,1,'#43372c');}shape(c,team.main,[[-8,-43],[-4,-46],[10,-28],[6,-26]],.7);}
    if(kind===9){gem(c,1,-33,'#a93858',2.5);line(c,'#e5d9c7',[[-4,-38],[2,-34],[6,-39]],1.1);}
    if(ghost){for(const yy of [-41,-33]){line(c,'#83d8cf',[[-4,yy],[0,yy-3],[4,yy],[0,yy+3]],1.2);}glow(c,0,-38,'#78f8da40',12);}
    if(heavy){
      for(const sign of [-1,1])shape(c,gradient(c,metal,dark),[[sign*8,-47],[sign*17,-49],[sign*22,-41],[sign*17,-36],[sign*9,-40]],1.4);
      line(c,kind===15?'#e2bc6c':'#adbfc1',[[-18,-45],[-12,-45]],1.5);
      if(rolandSpear){
        for(const sign of [-1,1])shape(c,'#ffd12a',[[sign*15,-47],[sign*21,-58],[sign*22,-43]],1,'#8b142c');
        line(c,'#ffd12a',[[-8,-47],[8,-47]],2.2);line(c,'#fff3b0',[[-7,-43],[7,-43]],.9);
      }
      if(kind===14){
        for(const sign of [-1,1]){
          shape(c,gradient(c,'#444850','#111318'),[[sign*8,-48],[sign*17,-51],[sign*23,-45],[sign*18,-38],[sign*10,-39]],1.2,'#111318');
          line(c,'#dc233b',[[sign*12,-46],[sign*19,-44]],1.5);
        }
        shape(c,gradient(c,'#24272d','#101216'),[[-8,-39],[0,-42],[8,-39],[6,-25],[0,-22],[-7,-25]],.7,'#7f1429');
        line(c,'#eb2941',[[0,-38],[0,-27]],1.5);gem(c,0,-34,team.accent||team.hi,2.2);
        for(const y of [-30,-27])line(c,'#5d6067',[[-4,y],[4,y]],.7);
      }
      if(kind===15){shape(c,'#bf9d5e',[[-8,-42],[0,-38],[9,-42],[6,-36],[0,-34],[-6,-36]],.7);gem(c,0,-37,'#74dedd',3);}
    }
    line(c,'#493c30',[[-11,-25],[10,-25]],3);ellipse(c,'#d8b87b',1,-25,2,2.3,1);
  }
  face(c,kind,team);helmet(c,kind,team);
  if(kind===6){
    curve(c,'#e0d9b8',[['moveTo',-11,-48],['quadraticCurveTo',-17,-61,-4,-70],['quadraticCurveTo',7,-71,12,-60],['lineTo',5,-62],['lineTo',-5,-60],['lineTo',-6,-48],['closePath']],1.4);
    line(c,'#fff1c8',[[-9,-51],[-10,-61],[-3,-67]],1.5);
  }
  if(kind===12){
    curve(c,gradient(c,team.main,team.dark),[['moveTo',-14,-63],['quadraticCurveTo',-7,-78,0,-86],['lineTo',7,-77],['lineTo',10,-63],['closePath']],1.2,team.hi);
    ellipse(c,team.dark,0,-62,17,4.5,1.2,team.hi);line(c,team.hi,[[-10,-66],[9,-66]],2);gem(c,2,-66,team.glow||'#ffffff',2.5);
    shape(c,'#d7d6c7',[[2,-49],[9,-50],[7,-43],[3,-37],[-1,-45]],.8);
  }
  if(kind===16){
    curve(c,'#343a77',[['moveTo',-11,-45],['quadraticCurveTo',-7,-59,2,-63],['quadraticCurveTo',13,-56,11,-44],['lineTo',5,-39],['lineTo',-5,-40],['closePath']],1.2);
    for(const sign of [-1,1]){line(c,'#a9eaff',[[sign*7,-32],[sign*14,-25]],1.5);gem(c,sign*16,-23,'#9eeaff',2.5);}
  }
  if(kind===17){
    for(const sign of [-1,1]){line(c,'#85f0df',[[sign*7,-37],[sign*14,-28]],1.7);gem(c,sign*16,-26,'#a5ffe8',2.5);}
  }
  if(kind===9){
    shape(c,'#742c51',[[-8,-47],[-17,-58],[-13,-40],[-7,-34]],1);
    shape(c,'#aa5266',[[6,-47],[14,-58],[12,-41],[6,-35]],1);
    curve(c,'#252535',[['moveTo',-8,-55],['lineTo',-6,-64],['quadraticCurveTo',5,-71,11,-60],['lineTo',5,-62],['lineTo',0,-58],['lineTo',-4,-59],['closePath']]);
  }
  // Front arm and weapon use a separate joint instead of rotating the entire body.
  const armX=kind===5?10:9,armY=-40;
  if(kind===2){
    limb(c,[[8,-40],[16,-31-atk*8],[24+atk*5,-30]],skin,7);
    for(let i=0;i<3;i++)line(c,'#d4ce9f',[[22+i*2,-32],[26+i*2,-28]],1.5);
    limb(c,[[-10,-39],[-17,-25],[-12,-19]],'#6a836a',6);
  }else{
    const reach=kind===9?atk*(attackVariant===2?3:7):atk*6;
    const hand=[17+reach,-29-atk*(attackVariant===2?3:7)];
    limb(c,[[armX,armY],[13,-32],hand],robe?team.main:kind===8?skin:metal,heavy?7:5.5);ellipse(c,skin,...hand,3.1,3.2,1);
    c.save();c.translate(hand[0],hand[1]);
    if([6,8,12,16].includes(kind)){
      const monkSwing=attackVariant===0?-.38+atk*.9:attackVariant===1?1.1-atk*2.2:-1.55+atk*2.95;
      const mageSwing=attackVariant===0?.05+atk*.55:attackVariant===1?1.05-atk*2:-1.05+atk*1.85;
      c.rotate(kind===8?(attack>0?monkSwing:moving?(runPose?-.72+cycle*.1:.16+cycle*.08):.35+cycle*.28):kind===12?(attack>0?mageSwing:moving?(runPose?-.72+cycle*.12:.34+cycle*.08):.12+Math.sin(phase)*.08):.12+atk*.25);staff(c,kind,team,phase);
    }else if(kind===0){
      c.rotate(moving?.5:.25+atk*.7);limb(c,[[0,20],[0,-50]],'#8b6945',2.5);shape(c,'#c9d7d4',[[0,-61],[-4,-47],[0,-49],[4,-47]],1);line(c,team.main,[[1,-45],[10,-43],[5,-40]],3);
      shape(c,team.main,[[2,-46],[14,-51],[11,-42]],.8);line(c,team.hi,[[4,-46],[12,-47]],1);
    }else if(kind===9){
      const swings=[-.2+atk*.45,-1.05+atk*1.7,1.05-atk*2.2];
      c.rotate(attack>0?swings[attackVariant%3]:moving?(runPose?-.48+cycle*.15:.5+cycle*.1):.1+Math.sin(phase)*.08);
      vampireClaw(c,team,phase,attackVariant,attack);
    }else{
      const dreadSwings=[1.22,-.95+atk*2.2,1.8-atk*3.5];
      c.rotate(kind===14&&attack>0?dreadSwings[attackVariant%3]:kind===14&&moving?(runPose?-1.08+cycle*.14:1.02+cycle*.08):attack>0?-.9+atk*2.4:kind===4&&moving?(runPose?-.28+cycle*.34:.38+cycle*.12):kind===7&&moving?(runPose?-.18+cycle*.12:.02+cycle*.06):kind===5?1.3:moving?.22+cycle*(heavy?.18:.42):.06);
      if(kind===7)spear(c,team,phase,attack,moving,runPose);
      else if(kind===14)dreadSaber(c,team,attackVariant,phase,attack,moving,runPose);
      else sword(c,kind===3?'katana':kind===5?'dagger':kind===13?'hammer':kind===15?'royal':'sword',ghost?'#a6fae4':'#e5eeee');
    }
    c.restore();
    if([1,4,7,13,15].includes(kind))shield(c,kind===1?'round':[7,13].includes(kind)?'tower':kind===15?'royal':'kite',team,phase,kind===4&&moving?(runPose?1.8:-1.4):kind===7&&moving?(runPose?1.2:-.9):0,kind);
    else if(kind===6||kind===12||kind===16){
      limb(c,[[-8,-40],[-15,-28],[-7,-27]],team.dark,5);
      shape(c,kind===6?'#e9d9af':kind===16?'#5869a5':'#715680',[[-19,-34],[-9,-36],[-1,-33],[-2,-21],[-11,-24],[-20,-22]],1.3);
      line(c,'#ab8d60',[[-10,-35],[-11,-25]],1);for(let i=0;i<3;i++)line(c,'#ae9771',[[-17,-31+i*2],[-13,-32+i*2]],.6);
    }else if(kind===5){c.save();c.translate(-9,-25);c.rotate(-1.4+cycle*.15);sword(c,'dagger');c.restore();}
    else if(kind===9){
      limb(c,[[-8,-41],[-12,-31],[-7-cycle*2,-25]],dark,5.5);
      c.save();c.translate(-7-cycle*2,-25);c.scale(-.62,.62);vampireClaw(c,team,phase+Math.PI,attackVariant,attack);c.restore();
    }else if(kind===14){
      limb(c,[[-8,-41],[-13,-32],[-16,-29]],dark,6);shape(c,metal,[[-20,-31],[-15,-33],[-11,-30],[-13,-25],[-19,-26]],.7,'#656a72');
      line(c,team.hi,[[-18,-29],[-14,-28]],1.1);
    }else limb(c,[[-8,-41],[-12,-31],[-6-cycle*2,-25]],kind===8?skin:dark,5.5);
  }
  factionOutfit(c,team,kind,phase,moving,attack);factionMark(c,team,kind);c.restore();
}
function cavalry(c,team,phase,moving,attack){
  const north=team.style==='north',horseCoat=north?'#f4fbff':'#b5936b',horseShade=north?'#8caab5':'#715139';
  const stride=moving?Math.sin(phase):0,fly=moving?Math.max(0,Math.sin(phase*2))*3:0;
  // Dust hangs behind the mount, never ahead of its travel direction.
  if(moving){for(let i=0;i<5;i++){
    const p=((phase/(Math.PI*2)+i*.21)%1+1)%1;
    ellipse(c,north?`rgba(150,234,255,${.32*(1-p)})`:`rgba(220,203,159,${.22*(1-p)})`,-27-p*29,1-p*8,4+p*7,2+p*3);
  }line(c,'#e4e4c638',[[-56,-16],[-40,-16]],1);line(c,'#e4e4c628',[[-63,-24],[-49,-24]],1);}
  c.save();c.translate(0,-fly);
  // Four articulated legs, with diagonal pairs in different phases.
  for(const back of [true,false])for(const front of [false,true]){
    const offset=back?Math.PI:0,angle=moving?Math.sin(phase+offset+(front?.8:0)):0;
    const hipX=front?20:-22,kneeX=hipX+angle*12+(front?5:-4),hoofX=hipX+angle*23+(front?6:-6);
    const hip=[hipX,-27],knee=[kneeX,-13-Math.max(0,-angle)*6],hoof=[hoofX,-1-Math.max(0,-angle)*10];
    limb(c,[hip,knee,hoof],north?(back?'#607b82':'#d1e5e9'):(back?'#493f37':'#907052'),front?4.5:5.5);
    line(c,north?(back?'#91b5bd':'#f5ffff'):(back?'#787766':'#d6cbb0'),[[knee[0],knee[1]+5],hoof],3);
    shape(c,'#262f32',[[hoof[0]-3,hoof[1]-3],[hoof[0]+3,hoof[1]-3],[hoof[0]+5,hoof[1]+1],[hoof[0]-3,hoof[1]+1]],1);
  }
  curve(c,north?'#f7ffff':'#2d3033',[['moveTo',-26,-35],['bezierCurveTo',-42,-40,-40,-22,-58,-24+stride*3],['quadraticCurveTo',-43,-31,-34,-19],['lineTo',-28,-28],['closePath']],1.2,north?'#badfe7':INK);
  curve(c,gradient(c,horseCoat,horseShade,-10,-42,4,-19),[
    ['moveTo',-31,-31],['bezierCurveTo',-33,-43,-13,-46,4,-40],['quadraticCurveTo',17,-40,22,-38],
    ['lineTo',31,-59],['quadraticCurveTo',39,-64,43,-56],['lineTo',51,-47],['lineTo',54,-43],
    ['quadraticCurveTo',53,-36,45,-39],['lineTo',37,-45],['lineTo',32,-25],
    ['quadraticCurveTo',24,-14,9,-22],['quadraticCurveTo',-6,-16,-22,-24],['quadraticCurveTo',-33,-21,-31,-31],['closePath']],1.8);
  curve(c,north?'#ffffff7a':'#d7bc8a70',[['moveTo',-25,-38],['quadraticCurveTo',-8,-44,12,-35],['quadraticCurveTo',-11,-35,-25,-30],['closePath']],0);
  curve(c,north?'#eafaff':'#423a33',[['moveTo',28,-40],['lineTo',31,-59],['quadraticCurveTo',22,-59,22,-51],['lineTo',17,-39],['lineTo',22,-44],['lineTo',20,-34],['closePath']],1,north?'#8bbec9':'#423a33');
  shape(c,north?'#d8f4ff':'#987755',[[32,-59],[31,-68],[37,-60]],1);shape(c,north?'#f7ffff':'#c4a377',[[38,-59],[39,-66],[42,-57]],1);
  ellipse(c,'#101f24',43,-51,1.6,1.5);ellipse(c,'#eff0d1',42.7,-51.5,.6,.6);
  ellipse(c,'#554338',50,-42,1.4,1.2);line(c,'#d7d0a5',[[37,-55],[42,-44],[51,-45]],1.5);
  if(north){
    line(c,'#f5ffff',[[34,-59],[32,-66],[28,-69],[30,-64],[27,-62]],1.7);
    line(c,'#f5ffff',[[34,-59],[37,-66],[42,-68],[39,-63],[43,-61]],1.7);
    gem(c,35,-60,'#2edbff',2.2);
  }
  curve(c,null,[['moveTo',43,-44],['quadraticCurveTo',17,-35,3,-47]],1.2,'#392d29');
  // Saddle cloth and belly straps make rider and horse one connected silhouette.
  shape(c,gradient(c,team.hi,team.dark),[[-20,-39],[7,-39],[9,-21],[-8,-18],[-21,-24]],1.2,north?'#f1fff7':'#172326');
  line(c,north?'#f1fff7':'#e3c487',[[-19,-27],[-8,-21],[7,-24]],1.6);
  shape(c,north?'#deeff2':'#503d32',[[-14,-41],[6,-42],[10,-37],[-16,-36]],1.2,north?'#668b93':'#172326');
  line(c,north?'#008f4c':'#624b36',[[-2,-35],[-1,-21]],3);gem(c,-9,-29,north?'#2edbff':'#e6d899',3);
  // Bent rider legs, forward seat, swept cloak, level lance.
  limb(c,[[-4,-42],[7,-29],[1,-22]],north?'#0a5d3d':'#485e6c',6);shape(c,north?'#173d35':'#37454e',[[-2,-26],[4,-25],[9,-22],[8,-19],[-3,-20]],1);
  line(c,'#bca67a',[[0,-26],[0,-19],[7,-19]],1);
  const lean=moving?5:1;
  c.save();c.translate(lean,-15);if(moving)c.transform(1,0,-.18,1,-5,0);
  curve(c,team.dark,[['moveTo',-9,-44],['quadraticCurveTo',-30,-46,-40,-38+stride*3],['lineTo',-26,-30],['lineTo',-13,-29],['closePath']],1);
  line(c,team.hi,[[-15,-42],[-29,-38]],1.5);
  shape(c,gradient(c,north?'#edfaff':'#b1c2c4',north?'#6f8991':'#425865'),[[-12,-44],[0,-50],[9,-44],[3,-29],[-8,-26],[-15,-31]],1.4,north?'#f1fff7':'#172326');
  line(c,team.main,[[-9,-44],[-3,-30]],5);
  if(north){
    // Frost-pelt collar and antler stitching make the northern cavalry
    // recognizable at a glance even when the green saddle cloth is small.
    for(let i=0;i<5;i++)ellipse(c,i%2?'#f1fff7':'#c8e8ee',-12+i*4,-48-(i%2)*2,2.2,3,0);
    line(c,'#008f4c',[[-8,-45],[-3,-51],[1,-45],[5,-51],[9,-45]],1.5);
  }
  c.save();c.translate(2,-3);face(c,4,team);helmet(c,4,team);c.restore();
  limb(c,[[4,-44],[12,-39],[24,-41]],'#91a9b4',5);ellipse(c,'#dec09b',24,-41,3,3,1);
  c.save();c.translate(21+(attack?Math.sin(attack*Math.PI)*9:0),-42);c.rotate(moving?-.08+Math.sin(phase)*.14:-.27);
  limb(c,[[-21,0],[48,0]],'#b59b6a',2.5);shape(c,'#e4ece4',[[59,0],[46,-3],[48,0],[46,3]],1);
  curve(c,team.main,[['moveTo',33,1],['lineTo',20,2],['lineTo',14,8+stride*2],['lineTo',32,5],['closePath']],.6);
  c.restore();factionOutfit(c,team,10,phase,moving,attack);factionMark(c,team,10);c.restore();c.restore();
}
const cache=new Map();
function mummy(c,team,phase,moving,attack){
  const gait=moving?Math.sin(phase):0,attackT=attack>0?Math.min(1,1-attack/.25):0;
  const attackPulse=Math.sin(attackT*Math.PI),reach=attackPulse*34;
  c.save();c.translate(0,moving?-Math.abs(gait)*1.35:0);c.rotate(moving?gait*.035:0);
  // Stiff, forward-reaching steps echo the classic lawn-defense zombie gait:
  // one leg drags while the other lurches ahead, with a small shoulder sway.
  limb(c,[[-5,-27],[-5+gait*4,-14],[-5+gait*8,0]],'#c6b68b',8);
  limb(c,[[5,-27],[5-gait*3,-13],[5-gait*7,1]],'#a99a76',8);
  for(const sign of [-1,1])for(let k=0;k<5;k++)line(c,'#796d54',[[sign*5-4,-24+k*5],[sign*5+4,-22+k*5]],1);
  shape(c,gradient(c,'#e7dbb4','#958767'),[[-11,-48],[8,-47],[13,-24],[-10,-23]],1.4);
  for(let k=0;k<7;k++)line(c,k%2?'#f2e8c9':'#887957',[[-10,-46+k*3.5],[10,-43+k*3.5]],2);
  ellipse(c,'#d9cba2',0,-59,9,12,1.4);
  for(let k=0;k<5;k++)line(c,'#8f8064',[[-8,-67+k*4],[8,-65+k*4]],1.5);
  line(c,'#292f27',[[0,-59],[8,-58]],4);line(c,'#a5ffbd',[[2,-59],[7,-58]],1.5);
  // The wrappings stay folded around the forearms while idle. Both arms hang
  // forward in the walk cycle, and only the attack frame unfurls tendrils.
  const arms=[[-9,-45,18+gait*4,-34-gait*2],[8,-44,23-gait*3,-32+gait*2]];
  for(const [sx,sy,baseX,baseY] of arms){
    const handX=baseX+attackPulse*reach*.42,handY=baseY-attackPulse*4;
    limb(c,[[sx,sy],[(sx+handX)*.5,sy+7],[handX,handY]],'#d9cba2',6);
    for(let k=0;k<3;k++)line(c,'#84775c',[[sx,-42+k*3],[handX-3,-44+k*3]],1);
    if(attackPulse>.02){
      const tipX=baseX+reach,tipY=baseY-6+Math.sin(phase+baseX)*5-attackPulse*7;
      curve(c,null,[['moveTo',handX,handY],['bezierCurveTo',baseX+reach*.45,-50-attackPulse*12,baseX+reach*.72,-9+attackPulse*8,tipX,tipY]],3.6,'#e9dbaf');
      c.globalAlpha=.45+.45*attackPulse;c.strokeStyle=team.hi;c.lineWidth=1.35;c.beginPath();c.moveTo(handX,handY);c.bezierCurveTo(baseX+reach*.45,-50-attackPulse*12,baseX+reach*.72,-9+attackPulse*8,tipX,tipY);c.stroke();c.globalAlpha=1;
      ellipse(c,team.hi,tipX,tipY,2.1+attackPulse*1.5,2.1+attackPulse*1.5,0);
    }
  }
  line(c,team.main,[[-11,-40],[10,-37]],3);factionOutfit(c,team,2,phase,moving,attack);factionMark(c,team,2);c.restore();
}
function archer(c,team,phase,moving,attack){
  const runPose=moving?Math.floor((phase/(Math.PI*2))*2)%2:0;
  const cycle=moving?Math.sin(phase):0,step=runPose? -cycle:cycle,draw=attack?Math.sin(attack*Math.PI)*9:0;
  const bob=moving?Math.abs(cycle)*1.2:0,bowLift=moving?(runPose?-5:2):0;
  c.save();c.translate(runPose?1:-1,-bob);c.rotate(moving?(runPose?-.025:.035):0);
  // Pose A plants the forward foot while keeping the bow low; pose B lifts
  // the bow and transfers weight to the recovery leg. Both keep a stable,
  // human centre of gravity instead of twisting the whole silhouette.
  limb(c,[[-5,-24],[-5+step*5,-12],[-4+step*9,0]],'#3b4b54',5.5);
  limb(c,[[5,-24],[5-step*3,-13],[5-step*7,1]],'#26383f',5.5);
  shape(c,'#1b292f',[[-8,-7],[7,-7],[10,-1],[7,2],[-8,2]],1.1);
  c.save();c.translate(-11,-36+bowLift*.2);c.rotate(runPose?.1:-.04);
  shape(c,'#4e3c32',[[-5,-9],[3,-7],[5,13],[-3,15]],.9);
  for(let i=0;i<3;i++)line(c,team.hi,[[-1+i*1.5,-10],[-3+i*1.5,-17]],1.1);
  c.restore();
  shape(c,gradient(c,team.main,team.dark),[[-13,-51],[8,-51],[12,-25],[8,-18],[-8,-18],[-14,-27]],1.4);
  line(c,team.hi,[[-9,-38],[8,-36]],2);line(c,'#b58a58',[[-8,-25],[8,-24]],2);
  ellipse(c,'#d5a57e',0,-61,8,10,1);
  curve(c,gradient(c,'#33464e','#18262c'),[['moveTo',-9,-59],['quadraticCurveTo',-7,-75,2,-78],['quadraticCurveTo',12,-73,10,-60],['lineTo',5,-55],['lineTo',-5,-56],['closePath']],1.2);
  line(c,'#d8e5d6',[[-7,-61],[6,-62]],1.2);
  shape(c,'#573b32',[[-12,-40],[-7,-43],[-2,-20],[-7,-19]],1);
  for(let i=0;i<3;i++)line(c,'#d0b16e',[[-10+i*2,-39],[-7+i*2,-45]],1);
  const bowX=19+(runPose?3:0),bowY=-35+bowLift,drawHandX=13+draw,drawHandY=-37-draw*.35+bowLift*.45;
  limb(c,[[7,-44],[12,-38],[bowX,bowY]],'#d5a57e',4.8);ellipse(c,'#d5a57e',bowX,bowY,2.8,3,1);
  limb(c,[[-7,-43],[4,-39],[drawHandX,drawHandY]],'#d5a57e',4.5);ellipse(c,'#d5a57e',drawHandX,drawHandY,2.6,2.8,1);
  c.save();c.translate(bowX,bowY);c.rotate((runPose?-.27:.04)+draw*.012);
  const bowGrip=2;
  curve(c,null,[['moveTo',bowGrip,-25],['quadraticCurveTo',bowGrip+17,0,bowGrip,25]],2,'#a77b51');
  line(c,'#ded1ae',[[bowGrip,-25],[bowGrip,25]],1);
  const arrowEnd=27+draw;
  line(c,'#b28e61',[[bowGrip-2,0],[arrowEnd,0]],2);
  shape(c,'#e5e9d7',[[arrowEnd,0],[arrowEnd-8,-3],[arrowEnd-6,0],[arrowEnd-8,3]],.6);
  line(c,team.hi,[[bowGrip-4,-1],[bowGrip-9,-5]],1.4);line(c,team.hi,[[bowGrip-4,1],[bowGrip-9,5]],1.4);
  c.restore();
  line(c,team.main,[[-9,-19],[8,-18]],2);factionOutfit(c,team,3,phase,moving,attack);factionMark(c,team,3);c.restore();
}
function doctor(c,team,phase,moving,attack,attackVariant=0){
  const palette=DOCTOR_PALETTES[team.style]||DOCTOR_PALETTES.roland;
  const runPose=moving?Math.floor((((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/Math.PI):0;
  const cycle=moving?Math.sin(phase):0,stride=moving?(runPose?14:3):0,swing=cycle*stride;
  c.save();c.translate(runPose?cycle*1.6:0,Math.sin(phase)*(runPose?1.7:.7)+(moving&&!runPose?-2:0));
  c.rotate(moving&&runPose?-.12:0);
  c.save();c.globalAlpha=.3;c.fillStyle=team.hi;c.shadowColor=team.glow||team.hi;c.shadowBlur=runPose?14:9;c.beginPath();c.ellipse(0,runPose?5:2,runPose?17:20,runPose?3:4,0,0,Math.PI*2);c.fill();c.restore();
  curve(c,gradient(c,palette.cloak,palette.cloakDark),[['moveTo',-10,-58],['lineTo',-21-(runPose?9:0),-71],['lineTo',-25-(runPose?13:0),-48],['quadraticCurveTo',-36-(runPose?17:0),-17,-32-swing,-3],['lineTo',15,-8],['quadraticCurveTo',12,-38,9,-56],['closePath']],1.5,palette.lining);
  if(moving){c.globalAlpha=.44;c.strokeStyle=team.hi;c.lineWidth=1.5;c.beginPath();c.moveTo(-17,-29);c.quadraticCurveTo(-31-(runPose?14:0),-22-cycle*5,-39-(runPose?18:0),-16-cycle*8);c.stroke();c.globalAlpha=1;}
  for(const sign of [-1,1]){
    const kneeX=sign*5+swing*sign,footX=sign*6-swing*sign,kneeY=runPose?-12-Math.max(0,-cycle*sign)*4:-16,footY=runPose?0:-7;
    limb(c,[[sign*5,-26],[kneeX,kneeY],[footX,footY]],'#263d54',7);line(c,'#67462e',[[footX,-8],[footX,footY]],7);
  }
  shape(c,gradient(c,palette.robe,palette.robeDark),[[-12,-53],[10,-52],[13,-17],[0,-12],[-13,-18]],1.3,palette.lining);
  curve(c,gradient(c,palette.cloak,palette.cloakDark),[['moveTo',-13,-27],['quadraticCurveTo',-20,-12,-10,0],['lineTo',0,-5],['lineTo',10,0],['quadraticCurveTo',20,-12,13,-27],['closePath']],1.1,palette.lining);
  line(c,palette.lining,[[-7,-48],[5,-23]],2);line(c,'#493b35',[[-12,-27],[12,-25]],5);
  ellipse(c,'#d8aa87',0,-64,8,11,1);
  curve(c,'#302c2b',[['moveTo',-8,-62],['lineTo',-9,-73],['quadraticCurveTo',0,-82,9,-70],['lineTo',7,-66],['lineTo',3,-72],['lineTo',-4,-71],['closePath']]);
  line(c,'#d2d3cc',[[-8,-71],[-7,-64]],2);line(c,'#d2d3cc',[[8,-71],[7,-64]],2);
  line(c,'#302c2b',[[-6,-59],[-2,-58],[0,-59],[2,-58],[6,-59]],1.7);
  curve(c,gradient(c,'#51413c','#252b34'),[['moveTo',-4,-57],['quadraticCurveTo',0,-55,4,-57],['lineTo',3,-53],['quadraticCurveTo',1,-50,0,-50],['quadraticCurveTo',-2,-52,-3,-54],['closePath']],.7);
  shape(c,'#40332e',[[0,-57],[6,-57],[4,-52],[1,-54]],.6);
  // An original Eye-like relic sits on his chest; the old reference silhouette
  // stays intact while the metal setting and inlaid stone read at game scale.
  c.strokeStyle=palette.lining;c.lineWidth=1.5;c.beginPath();c.arc(0,-47,6.2,0,Math.PI*2);c.stroke();
  line(c,palette.lining,[[-6,-53],[0,-43],[7,-52]],1);gem(c,0,-47,team.glow||'#76e9a9',3.2);
  line(c,palette.lining,[[-10,-50],[-7,-47],[-10,-44]],1.1);line(c,palette.lining,[[10,-50],[7,-47],[10,-44]],1.1);
  for(const sign of [-1,1]){
    const activeHand=attackVariant===2?-1:1;
    const active=sign===activeHand;
    const hx=sign*(attack?(active?30+(attackVariant===3?10:attackVariant===0?6:0):16):22+(moving&&runPose?5:0));
    const hy=attack?(active?(attackVariant===1?-39:attackVariant===0?-45:-42):-32):-34;
    limb(c,[[sign*10,-49],[sign*17,-37],[hx,hy]],palette.robeDark,6);ellipse(c,'#d8aa87',hx,hy,3,3);
    c.save();c.translate(hx+sign*4,hy);c.rotate(phase*.4+(attack?attackVariant*.5:0));
    c.strokeStyle=attack&&active?palette.lining:team.hi;c.lineWidth=1.7;
    const handRadius=attack?(active?(attackVariant===1?15:attackVariant===3?19:12):5):5;
    if(!attack||!active){c.beginPath();c.arc(0,0,handRadius,0,Math.PI*2);c.stroke();}
    else if(attackVariant===0){
      // Three open runes sit at the caster's knuckles before their golden
      // bands extend into the battlefield.
      for(const [start,end] of [[-.4,1.2],[1.7,3.1],[3.5,5.5]]){c.beginPath();c.arc(0,0,handRadius,start,end);c.stroke();}
      line(c,'#fff0b2',[[-4,0],[4,0]],1);
    }else if(attackVariant===1){
      for(const radius of [9,15,19]){c.beginPath();c.arc(0,0,radius,-2.7,2.7);c.stroke();}
      for(let i=0;i<5;i++){const a=-1.8+i*.9;line(c,'#fff0b2',[[Math.cos(a)*10,Math.sin(a)*10],[Math.cos(a)*17,Math.sin(a)*17]],1);}
    }else if(attackVariant===2){
      c.beginPath();c.ellipse(0,0,16,6,sign*.6,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,0,7,16,-sign*.5,0,Math.PI*2);c.stroke();
    }else{
      for(const radius of [10,17,22]){c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
      for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,'#fff0b2',[[Math.cos(a)*12,Math.sin(a)*12],[Math.cos(a)*22,Math.sin(a)*22]],1);}
    }
    c.restore();
  }
  line(c,palette.lining,[[-9,-24],[9,-22]],2.2);factionOutfit(c,team,16,phase,moving,attack);factionMark(c,team,16);c.restore();
}
function detailOverlay(c,kind,team,phase,moving,attack,attackVariant=0){
  const hit=attack>0?Math.sin(Math.PI*Math.min(1,attack)*.95):0;
  // Small material cues keep silhouettes readable when units overlap at scale.
  if(kind===0){
    line(c,'#c8a56b',[[-5,-43],[4,-41]],1.2);line(c,'#e5d4a0',[[-9,-20],[7,-19]],1);
    const thrust=attack>0?Math.sin(Math.PI*Math.min(1,attack)*.95):0;
    if(attack){c.globalAlpha=.7;c.strokeStyle=team.hi;c.lineWidth=1.5;c.beginPath();c.arc(13+thrust*8,-31,6+thrust*3,-1.1,1.1);c.stroke();c.globalAlpha=1;}
    if(moving)for(let i=0;i<2;i++)line(c,team.hi,[[-13-i*3,-8],[ -19-i*4,-6+i*2]],1);
  }else if(kind===1){
    line(c,'#d9be79',[[-8,-38],[7,-39]],1.4);line(c,'#6f8590',[[-4,-31],[4,-31]],1);
  }else if(kind===4){
    // Rivets and a leather sword belt make the shield soldier distinct from heavy.
    for(const x of [-7,7])ellipse(c,'#e8d19a',x,-37,1,1,0);
    line(c,'#5d4437',[[-8,-24],[6,-22]],2);line(c,'#d2bb86',[[0,-25],[3,-18]],1);
    if(moving){c.globalAlpha=.45;c.strokeStyle='#fff0b0';c.lineWidth=1.2;c.beginPath();c.arc(13,-32,11,-1.1+.2*Math.sin(phase),-.35+.2*Math.sin(phase));c.stroke();c.globalAlpha=1;}
  }else if(kind===5){
    // Twin blade glints and a short afterimage emphasize speed rather than bulk.
    if(moving){c.globalAlpha=.22;line(c,team.hi,[[-19,-42],[-33,-39]],3);line(c,team.main,[[-16,-30],[-31,-24]],2);c.globalAlpha=1;}
    c.save();c.translate(-12,-29);c.rotate(-1.1+Math.sin(phase)*.08);sword(c,'dagger',team.hi);c.restore();
    if(hit){c.globalAlpha=.65;line(c,'#e8f3da',[[15,-37],[28,-46]],1.5);c.globalAlpha=1;}
  }else if(kind===7){
    // Heavy armor reads through plate seams, a neck guard and shield boss.
    line(c,'#c9d6d0',[[-10,-43],[8,-42]],1.7);line(c,'#405865',[[0,-44],[0,-26]],1.5);
    for(const x of [-14,14]){ellipse(c,'#d8c58d',x,-42,1.5,1.5,0);ellipse(c,'#d8c58d',x,-31,1.2,1.2,0);}
    if(hit){c.globalAlpha=.7;for(const x of [-16,16])line(c,'#fff1b0',[[x,-41],[x+(x<0?-8:8),-47]],1.8);c.globalAlpha=1;}
    if(moving){c.globalAlpha=.3;c.strokeStyle='#dce9e2';c.lineWidth=2;c.beginPath();c.arc(15,-30,9,-.9,.15);c.stroke();c.globalAlpha=1;}
  }else if(kind===8){
    // Prayer beads and wrapped forearms show the monk's flexible defense.
    for(let i=0;i<5;i++){const a=i/4*Math.PI;ellipse(c,'#d5b56f',-2+Math.cos(a)*8,-38+Math.sin(a)*7,1.3,1.3,0);}
    line(c,team.hi,[[-14,-21],[-6,-18],[3,-20]],1.5);
    if(hit){
      c.globalAlpha=.6;c.strokeStyle=team.hi;c.lineWidth=1.8;
      if(attackVariant===0){c.beginPath();c.moveTo(14,-32);c.lineTo(27,-39);c.stroke();}
      else if(attackVariant===1){c.beginPath();c.arc(17,-30,12,-1.35,.55);c.stroke();}
      else{c.beginPath();c.arc(16,-30,9,-.95,.95);c.stroke();c.beginPath();c.arc(16,-30,13,-.55,.55);c.stroke();}
      c.globalAlpha=1;
    }
    if(moving){
      const monkRunPose=Math.floor((((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/Math.PI);
      c.globalAlpha=.36;c.strokeStyle=team.hi;c.lineWidth=1.4;c.beginPath();
      if(monkRunPose)c.arc(15,-30,13,-1.5+.25*Math.sin(phase),.35+.25*Math.sin(phase));
      else c.arc(15,-30,10,-1.05,.1);
      c.stroke();c.globalAlpha=1;
    }
  }else if(kind===9){
    // A pale aristocratic collar and blood-red marks identify the vampire.
    shape(c,'#e7e0d2',[[-5,-52],[1,-43],[7,-52],[4,-55],[-1,-51],[-4,-55]],.6);
    for(let i=0;i<3;i++)line(c,'#d34c68',[[10+i*2,-30],[16+i*2,-27]],1.2);
    if(attack){
      c.save();c.globalAlpha=.66;c.strokeStyle=attackVariant===1?'#ff8295':'#e55672';c.lineWidth=1.35;
      if(attackVariant===0){c.beginPath();c.moveTo(15,-31);c.quadraticCurveTo(21,-34-hit*4,26,-32-hit*5);c.stroke();}
      else if(attackVariant===1){for(let i=0;i<3;i++){const yy=-36+i*4;c.beginPath();c.moveTo(17,yy);c.quadraticCurveTo(23,yy-3-hit*3,27,yy-5-hit*3);c.stroke();}}
      else{for(let i=0;i<3;i++){const t=(phase*.25+i/3)%1;ellipse(c,'#ff9dad',18+t*8,-28-Math.sin(t*Math.PI)*7,1.2,1.5,0);}}
      c.restore();
    }
    if(moving){c.globalAlpha=.28;c.strokeStyle=team.hi;c.lineWidth=1.4;c.beginPath();c.moveTo(-14,-36);c.quadraticCurveTo(-24,-32,-31,-26);c.stroke();c.globalAlpha=1;}
  }else if(kind===11){
    for(let i=0;i<3;i++){const a=phase+i*2.1;line(c,'#8bfff0',[[Math.cos(a)*10,-38+Math.sin(a)*8],[Math.cos(a)*16,-38+Math.sin(a)*12]],1.2);}
  }else if(kind===12){
    // The silvermoon mage uses a bright violet spellbook, moon glyphs and
    // cold-silver sparks, clearly separated from the Doctor's gold relics.
    c.save();c.translate(8,-37);c.rotate(-.12+Math.sin(phase)*.05);
    shape(c,team.main,[[-8,-8],[4,-6],[8,4],[-5,6]],1,team.hi);
    line(c,team.hi,[[-4,-4],[4,1]],1);line(c,team.glow||team.hi,[[-3,1],[4,-2]],1);c.restore();
    if(team.style==='silvermoon'){
      c.strokeStyle=team.hi;c.lineWidth=1.2;c.beginPath();c.arc(7,-52,3.4,-1.2,1.8);c.stroke();
      for(const [sx,sy] of [[-2,-59],[14,-58],[19,-48]])gem(c,sx,sy,team.hi,1.5);
    }
    for(let i=0;i<4;i++){const a=phase*.7+i*Math.PI/2;gem(c,10+Math.cos(a)*(team.style==='silvermoon'?16:13),-54+Math.sin(a)*(team.style==='silvermoon'?12:10),team.glow||team.hi,team.style==='silvermoon'?2:1.8);}
    if(attack){
      const pulse=Math.sin(attack*Math.PI),style=attackVariant%3;c.save();c.globalAlpha=.8*pulse;c.strokeStyle=team.glow||team.hi;c.lineWidth=1.7;
      if(style===0){c.beginPath();c.arc(20,-48,5+pulse*4,-.8,1.4);c.stroke();}
      else if(style===1){c.translate(20,-48);c.rotate(phase*2);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;c.beginPath();c.moveTo(Math.cos(a)*4,Math.sin(a)*4);c.lineTo(Math.cos(a)*10,Math.sin(a)*10);c.stroke();}}
      else{c.beginPath();c.ellipse(13,-46,12+pulse*3,5,-.45,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(13,-46,7,12+pulse*3,.45,0,Math.PI*2);c.stroke();}
      c.restore();
    }
  }else if(kind===14){
    // Obsidian plates, a faction seal, and a live crimson emitter slit.
    line(c,'#636871',[[-8,-40],[0,-36],[9,-40]],1.7);line(c,'#da1834',[[0,-34],[0,-21]],1.4);
    for(const x of [-11,11]){line(c,'#777b82',[[x,-43],[x,-37]],1);gem(c,x,-43,team.hi,1.25);}
    if(hit){
      c.save();c.globalAlpha=.8*hit;c.shadowColor='#ff1739';c.shadowBlur=7;c.strokeStyle='#ff2b46';c.lineWidth=2;
      if(attackVariant===0){c.beginPath();c.moveTo(15,-31);c.lineTo(34,-36);c.stroke();}
      else if(attackVariant===1){c.beginPath();c.moveTo(15,-47);c.lineTo(26,-34);c.lineTo(16,-22);c.stroke();c.beginPath();c.moveTo(25,-48);c.lineTo(17,-37);c.stroke();}
      else{c.beginPath();c.arc(18,-33,22+hit*7,-2.4,1.1);c.stroke();c.strokeStyle='#fff0f2';c.lineWidth=1;c.beginPath();c.arc(18,-33,15+hit*4,-2.1,.5);c.stroke();gem(c,24,-35,'#ff304a',2.2);}
      c.shadowBlur=0;
      c.restore();
    }
    if(moving){
      const pose=Math.floor((((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/Math.PI);
      c.globalAlpha=pose?.52:.28;c.strokeStyle='#ff3048';c.lineWidth=pose?2.3:1.5;c.beginPath();
      if(pose)c.moveTo(13,-38);else c.arc(17,-31,11,-.9,.15);
      if(pose)c.lineTo(25,-31);c.stroke();c.globalAlpha=1;
    }
  }else if(kind===15){
    // High lord has clean gold plate edges and a deliberate, heavy strike pose.
    line(c,'#fff4c6',[[-9,-44],[-3,-47],[5,-45],[10,-41]],1.5);line(c,'#c69d52',[[0,-35],[0,-22]],1.2);
    for(const x of [-7,7])gem(c,x,-31,'#6fe0df',1.5);
    if(hit){c.globalAlpha=.8;line(c,'#fff0a3',[[8,-28],[21,-43]],2.5);c.globalAlpha=1;}
    if(moving){c.globalAlpha=.3;c.strokeStyle='#fff0ae';c.lineWidth=1.8;c.beginPath();c.arc(17,-31,11,-.75,.05);c.stroke();c.globalAlpha=1;}
  }else if(kind===16){
    // Doctor Strange's relics orbit the body even between attacks.
    for(let i=0;i<3;i++){const a=phase*.9+i*Math.PI*2/3;gem(c,Math.cos(a)*18,-35+Math.sin(a)*13,i===1?'#ffcf68':'#73e8cf',2);}
    if(attack){c.globalAlpha=.5;c.strokeStyle='#ffcf76';c.lineWidth=1.5;c.beginPath();c.arc(0,-39,22,-phase,1.6-phase);c.stroke();c.globalAlpha=1;}
  }else if(kind===17){
    // The mystery unit stays faceless and star-marked until its random roll resolves.
    ellipse(c,'#d7fff0',2,-57,1.4,1.4,0);line(c,'#9af8df',[[-6,-44],[6,-44]],1.2);
    if(moving){c.globalAlpha=.24;line(c,'#9af8df',[[-20,-30],[-32,-26]],2);c.globalAlpha=1;}
  }
}
function frame(kind,side,mode,index,team=TEAMS[side],attackVariant=0){
  const visualVariant=[8,9,12,14,16].includes(kind)&&mode==='attack'?attackVariant:0;
  const key=`${kind}/${side}/${mode}/${index}/${team.style||'default'}/${team.main}/${team.hi}/${team.dark}/${team.glow||''}/${visualVariant}`;if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=240;
  const c=canvas.getContext('2d');c.scale(2,2);c.translate(84,104);c.lineJoin='round';c.lineCap='round';
  const phase=index/(mode==='run'?12:4)*Math.PI*2,attack=mode==='attack'?(index+.5)/8:0;
  if(kind===10)cavalry(c,team,phase,mode==='run',attack);
  else if(kind===2)mummy(c,team,phase,mode==='run',attack);
  else if(kind===3)archer(c,team,phase,mode==='run',attack);
  else if(kind===16)doctor(c,team,phase,mode==='run',attack,visualVariant);
  else humanoid(c,kind,team,phase,mode==='run',attack,visualVariant);
  if(kind!==10&&kind!==2&&kind!==3&&kind!==16)detailOverlay(c,kind,team,phase,mode==='run',attack,visualVariant);
  cache.set(key,canvas);return canvas;
}
export function sprite(c,kind,side,x,y,scale=1,phase=0,attack=0,heading=side?-1:1,alpha=1,moving=false,team=null,attackVariant=0){
  const mode=attack>0?'attack':moving?'run':'idle';
  const index=mode==='attack'?Math.min(7,Math.floor((1-attack/.25)*8)):Math.floor(((phase%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*(moving?12:4));
  const source=frame(kind,side,mode,Math.max(0,index),team||TEAMS[side],attackVariant);
  c.save();c.globalAlpha=alpha;c.translate(x,y);c.scale(scale*heading,scale);c.imageSmoothingEnabled=true;
  c.drawImage(source,-84,-104,192,120);c.restore();
}
export function portrait(c,kind,side,team=null){
  const {width,height}=c.canvas;c.clearRect(0,0,width,height);
  const scale=kind===10?width/147:height/(VISUALS[kind].height+10);
  sprite(c,kind,side,width*.47,height-5,scale,0,0,1,1,false,team);
}
