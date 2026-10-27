import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {TYPE_BY_ID} from "../wrld-home-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const js=read("wrld-house-creator.mjs"),html=read("index.html");
const method=js.match(/function checkBackup\(input\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(method,"Backup input validator must exist");
const checkBackup=runInNewContext(method+"\ncheckBackup",{TEMPLATE_BY_ID:{garage:{},starter:{}},TYPE_BY_ID,Error,tr:(en)=>en,Set,Number,Math});
test("Exported house JSON format keeps furniture but excludes account credentials",()=>{
 const data={template:"garage",name:"My garage",items:[{id:"item-1",type:"car",x:0,z:0,rot:0}]};
 const validated=checkBackup(data);assert.deepEqual(JSON.parse(JSON.stringify(validated)),data);
 assert.doesNotMatch(js,/JSON\.stringify\(\{format:"fleki-wrld-house",version:1,.*owner/);
 assert.match(js,/exportBackupFile/);
 assert.match(js,/restoreLocalPackage/);
});
test("Malformed backup files are rejected rather than silently overwriting a home",()=>{
 for(const sample of [
  {name:"House",template:"unknown",items:[]},
  {name:"",template:"garage",items:[]},
  {name:"My garage",template:"garage",items:[{id:"a",type:"untrusted",x:0,z:0,rot:0}]},
  {name:"My garage",template:"garage",items:[{id:"a",type:"car",x:999,z:0,rot:0}]},
  {name:"My garage",template:"garage",items:[{id:"a",type:"car",x:0,z:0,rot:0},{id:"a",type:"car",x:1,z:0,rot:0}]},
 ])assert.throws(()=>checkBackup(sample));
});
test("All local backup and cloud buttons are accessible and versioned",()=>{
 for(const id of ["houseSaveCloudButton","houseRestoreCloudButton","houseRestorePublishedButton","houseExportBackup","houseImportBackupButton","houseImportBackupFile","houseRestoreLocalBackup"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/wrld-house-creator\.mjs\?v=8/);
 assert.match(html,/wrld-home-creator\.css\?v=8/);
 assert.match(js,/backupLocal\(\)/);
 assert.match(js,/stopCloudSync\(\)/);
 assert.match(js,/65536/);
});
