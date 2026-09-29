import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {root,localEnvironment} from './environment.mjs';

localEnvironment();
const {chromium}=await import('playwright');
const webRoot=path.join(root,'dist','web');
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=path.resolve(webRoot,relative);
  if(!file.startsWith(webRoot+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){
    response.writeHead(404);response.end('Not found');return;
  }
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,deviceScaleFactor:2});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));

try{
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.game?.screen==='menu');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('web-app')),true);
  assert.equal(await page.locator('#quit-btn').evaluate(node=>node.classList.contains('hidden')),true);
  const manifest=await page.evaluate(()=>fetch('manifest.webmanifest').then(response=>response.json()));
  assert.equal(manifest.display,'fullscreen');
  assert.equal(manifest.orientation,'landscape');

  await page.tap('#single-btn');
  await page.tap('[data-difficulty="normal"]');
  await page.tap('#map-continue');
  await page.tap('#faction-start');
  await page.waitForFunction(()=>window.game?.screen==='battle');
  await page.tap('#roster0 [data-unit-id="swordsman"]');
  assert.equal(await page.evaluate(()=>window.game.battle.teams[0].selected),Number(await page.locator('#roster0 [data-unit-id="swordsman"]').getAttribute('data-unit')));

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.game?.screen==='menu');
  assert.equal((await page.locator('h1').textContent()).trim(),'米拉奇战记');
  assert.deepEqual(errors,[]);

  const output=path.join(root,'artifacts');
  fs.mkdirSync(output,{recursive:true});
  await page.screenshot({path:path.join(output,'ipad-web.png'),fullPage:true});
  console.log(JSON.stringify({checks:['iPad landscape viewport loads','touch navigation starts a match','unit cards respond to touch','installed web app reloads fully offline'],errors},null,2));
}finally{
  await context.setOffline(false).catch(()=>{});
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
