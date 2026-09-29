// V1.2.1 keeps the selected map fixed while cycling through a small, readable
// weather set. Weather is visual-only so the existing unit balance and counter
// triangle remain unchanged; accumulation and particles are rendered by the
// dedicated weather renderer.
export const WEATHER_BY_ID=Object.freeze({
  clear:Object.freeze({id:'clear',name:'晴朗',kind:'clear',description:'光线稳定，能见度良好。'}),
  rain:Object.freeze({id:'rain',name:'小雨',kind:'rain',description:'细雨持续落下，地表反射出冷光。'}),
  snow:Object.freeze({id:'snow',name:'小雪',kind:'snow',description:'细雪斜落，冰原泛起微弱白雾。'})
});
export const WEATHER_CYCLE_SECONDS=70;
export const MAPS=Object.freeze([
  Object.freeze({
    id:'grassland',name:'米拉奇平原',short:'草地',
    description:'开阔的草地与旧战车道，适合作为标准战场。',
    terrain:'grassland',weather:['clear','rain'],
    colors:Object.freeze({base:'#839c4f',mid:'#789148',minimap:'#748e48',accent:'#d8bf7c'})
  }),
  Object.freeze({
    id:'swamp',name:'灰雾沼泽',short:'沼泽',
    description:'苔地、浅水与腐木交错，远处常年笼着低雾。',
    terrain:'swamp',weather:['rain','clear'],
    colors:Object.freeze({base:'#526d59',mid:'#3e5a4d',minimap:'#4d6b5a',accent:'#9bb995'})
  }),
  Object.freeze({
    id:'icefield',name:'霜境冰原',short:'冰原',
    description:'雪原、冰脊与远方雪山，冷光让每一步都清晰可见。',
    terrain:'icefield',weather:['clear','snow'],
    colors:Object.freeze({base:'#a9c4c8',mid:'#8caab4',minimap:'#8daeb8',accent:'#e3f3f2'})
  })
]);
export const MAP_BY_ID=Object.freeze(Object.fromEntries(MAPS.map(map=>[map.id,map])));
export function weatherAt(mapId='grassland',time=0){
  const map=MAP_BY_ID[mapId]||MAP_BY_ID.grassland;
  const index=Math.floor(Math.max(0,time)/WEATHER_CYCLE_SECONDS)%map.weather.length;
  return WEATHER_BY_ID[map.weather[index]]||WEATHER_BY_ID.clear;
}
