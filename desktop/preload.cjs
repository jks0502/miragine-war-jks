const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  fullscreen:()=>ipcRenderer.invoke('toggle-fullscreen'),
  quit:()=>ipcRenderer.invoke('quit')
});
