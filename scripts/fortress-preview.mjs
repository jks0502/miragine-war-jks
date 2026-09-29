import {createRequire} from 'node:module';
import {root,localEnvironment} from './environment.mjs';
import {_electron} from 'playwright';
const require=createRequire(import.meta.url);
const app=await _electron.launch({executablePath:require('electron'),args:[root],cwd:root,env:localEnvironment()});
try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.game);
  await page.click('#multi-btn');await page.click('#faction-start');
  await page.evaluate(()=>{
    const b=window.game.battle,r=window.game.renderer;b.paused=true;r.follow=false;
    r.setCamera(0);r.draw(b);
  });
  await page.locator('#battle').screenshot({path:root+'/artifacts/castle-preview.png'});
  await page.evaluate(()=>{const b=window.game.battle,r=window.game.renderer;r.setCamera(b.teams[0].camp.x-640);r.draw(b);});
  await page.locator('#battle').screenshot({path:root+'/artifacts/wall-preview.png'});
}finally{await app.close();}
