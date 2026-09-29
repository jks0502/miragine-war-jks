import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {root} from './environment.mjs';
const size=64,pixels=Buffer.alloc(size*size*4);
function poly(points,color){
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }
    if(inside)pixels.set(color,(y*size+x)*4);
  }
}
poly([[7,3],[57,3],[61,8],[61,49],[32,63],[3,49],[3,8]],[36,50,37,255]);
poly([[8,6],[56,6],[58,10],[58,47],[32,59],[6,47],[6,10]],[211,181,108,255]);
poly([[11,9],[53,9],[55,12],[55,45],[32,56],[9,45],[9,12]],[44,59,43,255]);
poly([[17,17],[28,31],[17,48],[9,31]],[219,98,85,255]);
poly([[47,17],[56,31],[47,48],[36,31]],[92,164,218,255]);
poly([[30,9],[34,9],[35,34],[31,42],[28,34]],[229,234,200,255]);
poly([[30,13],[32,9],[32,37],[30,34]],[255,250,210,255]);
poly([[22,37],[41,37],[41,42],[22,42]],[229,193,111,255]);
poly([[29,40],[34,40],[34,50],[29,50]],[194,147,72,255]);
function crc32(buf){let c=0xffffffff;for(const byte of buf){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const b=Buffer.concat([Buffer.from(type),data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc32(b));return Buffer.concat([head,b,tail]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
const raw=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)pixels.copy(raw,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=size;header[7]=size;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);
fs.writeFileSync(path.join(root,'desktop','icon.ico'),Buffer.concat([header,png]));
fs.writeFileSync(path.join(root,'desktop','icon.png'),png);
