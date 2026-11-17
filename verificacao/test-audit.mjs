import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
function load(path, context) {
 const js=stripTypeScriptTypes(read(path)).replace(/^import[\s\S]*?from\s+"[^"]+";\s*/gm,'').replace(/export /g,'');
 vm.runInContext(js,context);
}
function harness() {
 const state={clients:[{id:'c1',workspaceId:'w1',govLogin:'login-antigo',govPasswordEncrypted:'cifra'}],logs:[],permissions:['GOV_VIEW','GOV_MANAGE','CLIENT_CREATE','CLIENT_EDIT'],failAudit:false};
 const match=(row,where)=>Object.entries(where).every(([k,v])=>k==='createdAt'?row[k]>=v.gte:k==='NOT'?row.id!==v.id:row[k]===v);
 const db={client:{
  findFirst:async ({where})=>state.clients.find(c=>match(c,where))??null,
  create:async ({data})=>{const c={...data,id:'c2'};state.clients.push(c);return c},
  update:async ({where,data})=>{const c=state.clients.find(c=>match(c,where));assert.ok(c);Object.assign(c,data);return c},
 },auditLog:{
  create:async ({data})=>{if(state.failAudit)throw new Error('audit failure');const r={...data,id:'a'+(state.logs.length+1),createdAt:new Date()};state.logs.push(r);return r},
  findFirst:async ({where})=>state.logs.find(c=>match(c,where))??null,
  upsert:async ({where,create,update})=>{assert.equal(Object.keys(update).length,0);const existing=state.logs.find(c=>match(c,where));return existing??db.auditLog.create({data:create})},
 },$queryRaw:async (strings,...args)=>{
  assert.ok(strings.join('?').includes('FOR UPDATE'));
  assert.equal(args[0],'c1');assert.equal(args[1],'w1');
  return state.clients.filter(c=>c.id===args[0]&&c.workspaceId===args[1]).map(c=>({govLogin:c.govLogin}));
 },$transaction:async fn=>{
  const backup=structuredClone(state);
  try{return await fn(db)}catch(e){state.clients=backup.clients;state.logs=backup.logs;throw e}
 }};
 const ctx=vm.createContext({
  prisma:db,Date,console,ActionError:class ActionError extends Error{},
  Vault:{encrypt:s=>'cifrado:'+s,decrypt:()=> 'senha-secreta'},
  requireWorkspacePermission:async p=>{if(!state.permissions.includes(p))throw new Error('denied');return {workspace:{id:'w1'},membership:{userId:'u1',role:'OWNER'}}},
  hasPermission:(_role,p)=>state.permissions.includes(p),
  clientSchema:{safeParse:data=>({success:true,data})},
  revalidatePath:()=>{},redirect:()=>{},
 });
 for(const p of ['src/lib/security/audit.ts','src/features/clients/actions/reveal-gov-password.ts','src/features/clients/actions/report-gov-password-copy.ts','src/features/clients/actions/create-client.ts','src/features/clients/actions/update-client.ts'])load(p,ctx);
 return {state,ctx,db};
}
const form=(data={})=>new Map(Object.entries({name:'Cliente Teste',...data}));
let h=harness();const access=await h.ctx.revealGovPassword('c1','reveal');assert.equal(access.password,'senha-secreta');assert.equal(h.state.logs[0].action,'GOV_PASSWORD_RELEASED_FOR_REVEAL');assert.ok(!JSON.stringify(h.state.logs).includes('senha-secreta'));assert.ok(!JSON.stringify(h.state.logs).includes('login-antigo'));
h=harness();h.state.failAudit=true;await assert.rejects(h.ctx.revealGovPassword('c1','copy'));assert.equal(h.state.logs.length,0);
h=harness();h.state.permissions=[];await assert.rejects(h.ctx.revealGovPassword('c1'));assert.equal(h.state.logs.length,0);
h=harness();h.state.clients[0].workspaceId='w2';await assert.rejects(h.ctx.revealGovPassword('c1'));assert.equal(h.state.logs.length,0);
h=harness();h.state.clients[0].govPasswordEncrypted=null;assert.equal(await h.ctx.revealGovPassword('c1'),null);assert.equal(h.state.logs.length,0);
h=harness();await assert.rejects(h.ctx.revealGovPassword('c1','invalid'));assert.equal(h.state.logs.length,0);
h=harness();let a=await h.ctx.revealGovPassword('c1','copy');await h.ctx.reportGovPasswordCopy(a.accessId);await h.ctx.reportGovPasswordCopy(a.accessId);assert.equal(h.state.logs.length,2);assert.equal(h.state.logs[1].parentEventId,a.accessId);assert.equal(h.state.logs[1].action,'GOV_PASSWORD_COPY_REPORTED');
for(const property of ['actorUserId','workspaceId','action','createdAt']){
 h=harness();a=await h.ctx.revealGovPassword('c1','copy');h.state.logs[0][property]=property==='createdAt'?new Date(Date.now()-6*60_000):'invalid';
 await assert.rejects(h.ctx.reportGovPasswordCopy(a.accessId));assert.equal(h.state.logs.length,1);
}
h=harness();await h.ctx.createClientImpl(form({govPassword:'nova-senha'}));assert.equal(h.state.logs[0].action,'GOV_CREDENTIAL_CREATED');assert.equal(h.state.clients.length,2);
h=harness();h.state.failAudit=true;await assert.rejects(h.ctx.createClientImpl(form({govPassword:'nova-senha'})));assert.equal(h.state.clients.length,1);assert.equal(h.state.logs.length,0);
h=harness();await h.ctx.createClientImpl(form());assert.equal(h.state.logs.length,0);
h=harness();h.state.permissions=h.state.permissions.filter(p=>p!=='GOV_MANAGE');await h.ctx.createClientImpl(form({govPassword:'forjada',govLogin:'forjado'}));assert.equal(h.state.clients[1].govPasswordEncrypted,null);assert.equal(h.state.clients[1].govLogin,null);assert.equal(h.state.logs.length,0);
h=harness();await h.ctx.updateClientImpl('c1',form({govPassword:'nova-senha'}));assert.equal(h.state.logs[0].action,'GOV_CREDENTIAL_UPDATED');assert.equal(h.state.clients[0].govPasswordEncrypted,'cifrado:nova-senha');
h=harness();h.state.failAudit=true;await assert.rejects(h.ctx.updateClientImpl('c1',form({govPassword:'nova-senha'})));assert.equal(h.state.clients[0].govPasswordEncrypted,'cifra');assert.equal(h.state.logs.length,0);
h=harness();await h.ctx.updateClientImpl('c1',form({govLogin:'login-antigo',govPassword:''}));assert.equal(h.state.logs.length,0);assert.equal(h.state.clients[0].govPasswordEncrypted,'cifra');
h=harness();await h.ctx.updateClientImpl('c1',form({govLogin:''}));assert.equal(h.state.logs.length,1);assert.equal(h.state.clients[0].govLogin,null);
h=harness();h.state.permissions=h.state.permissions.filter(p=>p!=='GOV_MANAGE');await h.ctx.updateClientImpl('c1',form({govLogin:'forjado',govPassword:'forjada'}));assert.equal(h.state.clients[0].govLogin,'login-antigo');assert.equal(h.state.clients[0].govPasswordEncrypted,'cifra');assert.equal(h.state.logs.length,0);
console.log('PASS: ações reais com banco simulado — autorização, escritório, liberação condicionada ao log, correlação/expiração/repetição de cópia, rollback de cadastro/edição e ausência de segredos nos logs.');
