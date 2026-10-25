"use strict";
const {app,BrowserWindow,Menu}=require("electron");
const path=require("node:path");
let win;
function createWindow(){
 win=new BrowserWindow({
  title:"Fleki Authenticator",width:500,height:800,minWidth:390,minHeight:550,
  backgroundColor:"#0e0e15",autoHideMenuBar:true,
  webPreferences:{
   nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,
   allowRunningInsecureContent:false,webviewTag:false,nativeWindowOpen:false
  }
 });
 // No remote scripts, navigation, external links or node integration.
 win.webContents.setWindowOpenHandler(()=>({action:"deny"}));
 win.webContents.on("will-navigate",(event,url)=>{
  if(!url.startsWith("file://"))event.preventDefault();
  else event.preventDefault(); // the app never navigates away from its local shell
 });
 win.webContents.session.setPermissionRequestHandler((_wc,permission,callback,details)=>{
  const videoOnly=permission==="media"&&details?.mediaTypes?.includes("video")&&!details?.mediaTypes?.includes("audio");
  callback(Boolean(videoOnly&&details.requestingUrl?.startsWith("file://")));
 });
 Menu.setApplicationMenu(null);
 void win.loadFile(path.join(__dirname,"assets","index.html"));
}
app.whenReady().then(()=>{createWindow();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
