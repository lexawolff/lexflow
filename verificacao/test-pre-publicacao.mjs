// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa funções reais com dependências simuladas; não acessa o banco.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const root = resolve(process.argv[2] || '.');
const requireFromProject = createRequire(resolve(root, 'package.json'));
const typescript = requireFromProject('typescript');
function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { ...deps, console, FormData });
}
const normalized = x => JSON.parse(JSON.stringify(x));
const { buildTimelineAccessWhere: filter } = load('features/timeline/data/timeline-access.ts', ['buildTimelineAccessWhere']);
function visible(where, event) {
  return where.AND[0].type.in.includes(event.type) &&
    (event.entityType === null || where.AND[1].OR[1].entityType.in.includes(event.entityType));
}
const none = {canViewCases:false,canViewAgenda:false,canViewDocuments:false,canViewFinance:false};
test('lista projeta apenas campos necessários e mantém escritório', async () => {
  let query;
  const source = {id:'c',name:'Teste',cpf:'000',phone:null,whatsapp:null,city:null,state:null,_count:{cases:0},govLogin:'segredo',govPasswordEncrypted:'cifra',income:999};
  const {getClients} = load('features/clients/services/get-clients.ts', ['getClients'], {
    requireWorkspacePermission: async p => {assert.equal(p,'CLIENT_VIEW'); return {workspace:{id:'w'}};},
    prisma:{client:{
      count:async q => {assert.equal(q.where.workspaceId,'w'); return 1;},
      findMany:async q => {query=q; return [Object.fromEntries(Object.keys(q.select).map(k=>[k,source[k]]))];},
    }},
  });
  const {clients:rows}=await getClients();
  assert.equal(query.where.workspaceId,'w');
  assert.deepEqual(Object.keys(rows[0]).sort(),['id','name','cpf','phone','whatsapp','city','state','_count'].sort());
});
test('sem autorização a lista não consulta banco', async () => {
  const {getClients}=load('features/clients/services/get-clients.ts',['getClients'],{requireWorkspacePermission:async()=>{throw Error('negado');},prisma:{}});
  await assert.rejects(getClients,/negado/);
});
test('histórico bloqueia eventos de módulos negados, inclusive entidades divergentes', () => {
  const where=filter(none);
  for (const [type,entityType] of [['DOCUMENT_UPLOADED','DOCUMENT'],['DOCUMENT_UPLOADED',null],['FINANCIAL_PAID','FINANCIAL'],['SYSTEM','DOCUMENT'],['TASK_CREATED','TASK'],['CASE_CREATED','CASE']]) {
    assert.equal(visible(where,{type,entityType}),false);
  }
  assert.equal(visible(where,{type:'CLIENT_CREATED',entityType:'CLIENT'}),true);
});
test('histórico libera somente módulo autorizado', () => {
  const where=filter({...none,canViewFinance:true});
  assert.equal(visible(where,{type:'FINANCIAL_PAID',entityType:'FINANCIAL'}),true);
  assert.equal(visible(where,{type:'DOCUMENT_UPLOADED',entityType:'DOCUMENT'}),false);
});
test('chamador não amplia permissões no dashboard', async () => {
  let query;
  const {getClientDashboard}=load('features/clients/services/get-client-dashboard.ts',['getClientDashboard'],{
    requireWorkspacePermission:async()=>({workspace:{id:'w'},membership:{role:'VIEWER'}}),
    hasPermission:()=>false, buildTimelineAccessWhere:filter,
    clientDashboardBaseSelect:{id:true,timelineEvents:{orderBy:{createdAt:'desc'}}},
    serializePrisma:x=>x,
    prisma:{client:{findFirst:async q=>{assert.equal(query,undefined);query=q;return{id:'c'};}}},
  });
  const result=await getClientDashboard('c',{canViewGov:true,canViewFinance:true,canViewDocuments:true,canViewAgenda:true});
  assert.equal(result.govLogin,null); assert.equal(result.hasGovPassword,false);assert.equal(result.income,null);
  assert.equal(query.where.workspaceId,'w');
  assert.equal(visible(query.select.timelineEvents.where,{type:'DOCUMENT_UPLOADED',entityType:'DOCUMENT'}),false);
});
test('logs não contêm mensagens, tokens ou dados de resposta',()=>{
  const {safeErrorSummary}=load('lib/security/safe-error.ts',['safeErrorSummary']);
  assert.deepEqual(normalized(safeErrorSummary({message:'token',code:'ETIMEDOUT',config:{headers:{Authorization:'secret'}},response:{status:401,data:'secret'}})),{status:401,code:'ETIMEDOUT'});
  assert.deepEqual(normalized(safeErrorSummary({code:'secret',response:{status:999}})),{status:null,code:null});
  assert.deepEqual(normalized(safeErrorSummary(null)),{status:null,code:null});
});
test('cadastro público em produção fica fechado sem SIGNUP_ENABLED e não acessa Auth/banco',async()=>{
  const {isSignupEnabled}=load('features/auth/lib/signup.ts',['isSignupEnabled'],{process:{env:{NODE_ENV:'production'}},LEGAL_CONTACT_EMAIL:'contato@example.com'});
  const {signUpAction}=load('features/auth/actions/signup.ts',['signUpAction'],{isSignupEnabled,createClient:async()=>{throw Error('não deveria acessar o Supabase');}});
  assert.match((await signUpAction({},new FormData())).error,/não está disponível/);
});
const UserRole={OWNER:'OWNER',ADMIN:'ADMIN',LAWYER:'LAWYER',INTERN:'INTERN',FINANCIAL:'FINANCIAL',VIEWER:'VIEWER'};
function team({requesterRole='OWNER',targetRole='LAWYER',work=0,owners=2,self=false,targetExists=true,failDelete=false}={}) {
  const effects=[];
  const tx={
    $queryRaw:async(strings,...values)=>{const sql=strings.join('?');effects.push(sql.includes('Workspace')?'workspace-lock':'target-lock');
      assert.match(sql,/FOR UPDATE/);
      if(sql.includes('Workspace')){assert.equal(values[0],'w');return[{id:'w'}];}
      assert.equal(values[1],'w');return targetExists?[{id:'target',userId:self?'actor':'other',role:targetRole}]:[];
    },
    membership:{findFirst:async()=>({id:'actor-member',role:requesterRole}),count:async()=>owners,
      update:async q=>{assert.equal(q.where.workspaceId,'w');effects.push('role-update');},
      delete:async q=>{assert.equal(q.where.workspaceId,'w');if(failDelete)throw Error('fail');effects.push('delete');}},
    workItem:{count:async q=>{assert.equal(q.where.assignedToMembershipId,'target');return work;}},
    googleCalendarConnection:{updateMany:async q=>{assert.equal(q.where.workspaceId,'w');assert.equal(q.where.userId,'other');assert.equal(q.data.refreshTokenEncrypted,'');assert.equal(q.data.syncToGoogle,false);assert.equal(q.data.syncFromGoogle,false);effects.push('disconnect');}},
  };
  const deps={UserRole,hasPermission:(r,p)=>p==='TEAM_MANAGE'&&['OWNER','ADMIN'].includes(r),
    requireWorkspacePermission:async()=>({workspace:{id:'w'},membership:{userId:'actor',role:'OWNER'}}),
    prisma:{$transaction:async fn=>fn(tx)},revalidatePath:()=>{},console:{error:()=>{}}};
  const actions=load('features/settings/actions/team-actions.ts',['updateMemberRoleAction','removeMemberAction'],deps);
  const form=new FormData();form.set('membershipId','target');form.set('role','ADMIN');
  return{actions,form,effects};
}
for(const [name,config] of [
  ['preserva trabalhos ativos ou concluídos',{work:1}],
  ['revalida permissão dentro da transação',{requesterRole:'LAWYER'}],
  ['impede ADMIN remover OWNER',{requesterRole:'ADMIN',targetRole:'OWNER'}],
  ['preserva último OWNER',{targetRole:'OWNER',owners:1}],
  ['impede remoção própria',{self:true}],
  ['recusa alvo ausente de escritório',{targetExists:false}],
])test(name,async()=>{const {actions,form,effects}=team(config);assert.equal((await actions.removeMemberAction(form)).success,false);assert.ok(!effects.includes('delete'));assert.ok(!effects.includes('disconnect'));});
test('remoção permitida desativa integração antes da exclusão',async()=>{
  const {actions,form,effects}=team();assert.equal((await actions.removeMemberAction(form)).success,true);
  assert.deepEqual(effects,['workspace-lock','target-lock','disconnect','delete']);
});
test('ADMIN não promove OWNER',async()=>{
  const {actions,form,effects}=team({requesterRole:'ADMIN'});form.set('role','OWNER');
  assert.equal((await actions.updateMemberRoleAction(form)).success,false);assert.ok(!effects.includes('role-update'));
});
test('demissão de OWNER reconta sob bloqueio',async()=>{
  const {actions,form,effects}=team({targetRole:'OWNER',owners:1});
  assert.equal((await actions.updateMemberRoleAction(form)).success,false);assert.ok(!effects.includes('role-update'));
});
