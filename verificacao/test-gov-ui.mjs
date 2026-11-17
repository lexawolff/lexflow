import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
// Exige Node >= 22.13 (stripTypeScriptTypes). Normaliza CRLF (checkout no Windows).
const read = p => readFileSync(new URL(p, root), 'utf8').replace(/\r\n/g, '\n');
// Exercita a lógica real do componente com hooks, relógio e rede controlados.
let source=read('src/features/clients/components/tabs/gov-tab.tsx');
source=source.slice(source.indexOf('  const [password'),source.indexOf('\n  return (\n'));
const script=stripTypeScriptTypes('function Component(){'+source+';return {handlePassword,copyLogin,clearSensitive};}');
function harness() {
 const values=[],refs=[],effects=[],timers=new Map(),listeners=new Map(),writes=[],reports=[];
 let si=0,ri=0,now=1000,id=0,active=true,focused=true,shown=true,resolve,reject;
 let nextPromise=Promise.resolve('senha');
 const panel={hasAttribute:()=>!active,getAttribute:()=>active?'active':'inactive'};
 const root={closest:()=>panel};
 const context={
  useState:initial=>{let i=si++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=v];},
  useRef:initial=>{let i=ri++;if(!(i in refs))refs[i]={current:initial};return refs[i];},
  useCallback:f=>f,useEffect:f=>effects.push(f),usePathname:()=>'/clientes/a',
  clientId:'a',hasGovPassword:true,govLogin:'login',
  setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i),
  Date:{now:()=>now},document:{get visibilityState(){return shown?'visible':'hidden'},hasFocus:()=>focused,
    addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)},
  window:{addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)},
  navigator:{clipboard:{writeText:async v=>writes.push(v)}},
  MutationObserver:class {constructor(f){context.observer=f}observe(){}disconnect(){}},
  revealGovPassword:async (_id,mode)=>{context.lastPurpose=mode;const password=await nextPromise;return password?{password,accessId:'audit-1'}:null},
  reportGovPasswordCopy:async id=>reports.push(id),
 };
 vm.createContext(context);vm.runInContext(script,context);
 let api=context.Component();refs[0].current=root;const cleanup=effects[0]();
 return {values,writes,reports,cleanup,context,
  render(){si=0;ri=0;api=context.Component();return api;},
  pending(){nextPromise=new Promise((res,rej)=>{resolve=res;reject=rej})},
  resolve(v){resolve(v)},reject(){reject(new Error('segredo interno'))},
  tick(ms){now+=ms;for(const [i,t] of [...timers])if(t.at<=now){timers.delete(i);t.f()}},
  leave(){active=false;context.observer()},
  hide(){shown=false;listeners.get('visibilitychange')()},
  blur(){focused=false;listeners.get('blur')()},
 };
}
let h=harness();await h.render().handlePassword('reveal');assert.equal(h.values[0],'senha');h.tick(30000);assert.equal(h.values[0],null);
h=harness();await h.render().handlePassword('reveal');await h.render().handlePassword('reveal');assert.equal(h.values[0],null);
h=harness();await h.render().handlePassword('copy');assert.deepEqual(h.writes,['senha']);assert.equal(h.values[0],null);
for(const action of ['leave','hide','blur','cleanup']){
 h=harness();h.pending();let p=h.render().handlePassword('reveal');h[action]();h.resolve('senha');await p;assert.equal(h.values[0],null);
}
h=harness();h.pending();let p=h.render().handlePassword('copy');h.leave();h.resolve('senha');await p;assert.equal(h.writes.length,0);
h=harness();h.pending();p=h.render().handlePassword('reveal');h.tick(30000);h.resolve('senha');await p;assert.equal(h.values[0],null);
h=harness();h.pending();p=h.render().handlePassword('reveal');h.reject();await p;assert.equal(h.values[0],null);assert.ok(h.values[3]);assert.ok(!h.values[3].includes('segredo interno'));
console.log('PASS: revelar, ocultar, expirar, copiar sem revelar, saída da aba/janela, desmontagem, respostas atrasadas e falha de rede.');

h=harness();await h.render().handlePassword('copy');assert.equal(h.context.lastPurpose,'copy');assert.deepEqual(h.reports,['audit-1']);
h=harness();await h.render().handlePassword('reveal');assert.equal(h.context.lastPurpose,'reveal');assert.equal(h.reports.length,0);
h=harness();h.context.navigator.clipboard.writeText=async()=>{throw new Error('clipboard denied')};await h.render().handlePassword('copy');assert.equal(h.reports.length,0);assert.equal(h.values[0],null);
h=harness();h.context.reportGovPasswordCopy=async()=>{throw new Error('offline')};await h.render().handlePassword('copy');assert.equal(h.writes.length,1);assert.ok(h.values[3].startsWith('Senha copiada, mas'));
h=harness();h.pending();p=h.render().handlePassword('copy');h.leave();h.resolve('senha');await p;assert.equal(h.reports.length,0);assert.equal(h.writes.length,0);
console.log('PASS: propósito de liberação, relato só após copiar, falha de clipboard, aviso de confirmação perdida e resposta tardia.');
