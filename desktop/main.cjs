const {app,BrowserWindow,ipcMain,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
// Keep all writable Electron paths next to this project / portable executable.
const root=app.isPackaged?path.dirname(process.execPath):path.resolve(__dirname,'..');
const data=path.join(root,'userdata');
const temp=path.join(root,'.tmp');
for(const p of [data,temp,path.join(data,'logs'),path.join(data,'crashes')])fs.mkdirSync(p,{recursive:true});
process.env.TEMP=temp;process.env.TMP=temp;
app.setPath('userData',data);app.setPath('sessionData',path.join(data,'session'));
app.setPath('temp',temp);app.setPath('crashDumps',path.join(data,'crashes'));
app.setAppLogsPath(path.join(data,'logs'));
app.commandLine.appendSwitch('disk-cache-dir',path.join(data,'cache'));
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-background-networking');
let window;
app.whenReady().then(()=>{
  Menu.setApplicationMenu(null);
  window=new BrowserWindow({width:1280,height:920,minWidth:900,minHeight:660,
    title:'米拉奇战记 · 经典重制',backgroundColor:'#18251c',show:false,
    icon:path.join(__dirname,'icon.ico'),
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}
  });
  window.loadFile(path.join(__dirname,'..','index.html'));
  window.once('ready-to-show',()=>window.show());
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  window.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
  window.webContents.on('before-input-event',(event,input)=>{
    if(input.type==='keyDown'&&input.key==='F11'){event.preventDefault();window.setFullScreen(!window.isFullScreen());}
  });
});
ipcMain.handle('toggle-fullscreen',()=>{window.setFullScreen(!window.isFullScreen());return window.isFullScreen();});
ipcMain.handle('quit',()=>app.quit());
app.on('window-all-closed',()=>app.quit());
