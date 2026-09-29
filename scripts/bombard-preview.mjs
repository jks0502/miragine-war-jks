import {createRequire} from 'node:module';
import {root,localEnvironment} from './environment.mjs';
import {_electron} from 'playwright';
const require=createRequire(import.meta.url);
const app=await _electron.launch({executablePath:require('electron'),args:[root],cwd:root,env:localEnvironment()});
try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.game);
  await page.click('#multi-btn');await page.click('#faction-start');
  await page.evaluate(()=>{
    const b=window.game.battle,r=window.game.renderer;b.paused=true;
    r.follow=false;r.setCamera(2400);
    b.effects=[{type:'bombard',x:3040,y:250,side:0,width:1100,height:500,missiles:24,flight:1.8,stagger:.22,life:5.5,max:7}];
  });
  await page.waitForTimeout(100);
  await page.locator('#battle').screenshot({path:root+'/artifacts/bombard-preview.png'});
}finally{await app.close();}
