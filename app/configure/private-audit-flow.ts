/** Local metadata and status orchestration only. Never an identity/payment grant. */
import { checkoutPrivateAudit, privateAuditLocalMode, statusPrivateAudit } from "./private-audit-client";
import type { PrivateAuditQuote } from "./private-audit-client";

const KEY="stratverity.private-audit.ui.v1";
const MAX_BYTES=64*1024;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA=/^[a-f0-9]{64}$/;
const SESSION=/^cs_[A-Za-z0-9_]{1,252}$/;
const IDEMPOTENCY=/^[A-Za-z0-9._:-]{16,255}$/;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const fail=()=>{throw new Error("Invalid private Audit local context");};
const freeze=<T>(v:T):T=>{if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};

export type AuditTransaction=Readonly<{schema:"private-audit-ui@1";attempt:string;scope:Record<string,unknown>;
  quote:PrivateAuditQuote;revision:number;idempotency_key:string;initiated:boolean;checkout_session_id:string|null}>;
export type ContextStorage=Pick<Storage,"getItem"|"setItem">;

export function privateAuditCheckoutUiMode(){
  return privateAuditLocalMode()&&process.env.NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL==="1";
}

function scopeValid(v:unknown):v is Record<string,unknown>{
  if(!exact(v,["schema_version","scope_id","product","offer_family","commercial_unit","strategies","contexts",
    "audit_options","scan_options","optimizer_options","pricing_status"])||v.schema_version!=="0.1.0"
    ||v.scope_id!=="scope-preview"||v.product!=="AUDIT"||typeof v.offer_family!=="string"||!["BASE","CUSTOM","MATRIX"].includes(v.offer_family)
    ||v.commercial_unit!=="STRATEGY_ASSET_TIMEFRAME_CONTEXT"||v.pricing_status!=="TO_BE_DEFINED"
    ||v.scan_options!==null||v.optimizer_options!==null||!Array.isArray(v.strategies)||v.strategies.length!==1
    ||!Array.isArray(v.contexts)||v.contexts.length!==1)return false;
  const s=v.strategies[0],c=v.contexts[0],o=v.audit_options;
  if(!exact(s,["strategy_version_id","sha256"])||typeof s.strategy_version_id!=="string"||!ID.test(s.strategy_version_id)
    ||typeof s.sha256!=="string"||!SHA.test(s.sha256)||!exact(c,["strategy_version_id","asset_id","timeframe"])
    ||c.strategy_version_id!==s.strategy_version_id||typeof c.asset_id!=="string"||!["BINANCE:BTCUSDT","BINANCE:ETHUSDT"].includes(c.asset_id)
    ||typeof c.timeframe!=="string"||!["15m","1h","4h","1d","1w"].includes(c.timeframe)
    ||!exact(o,["depth","historical_windows","stress_scenarios","parameter_variants","human_review"])||o.human_review!==false)return false;
  const tuple=o.depth==="ESSENTIAL"||o.depth==="PREMIUM"?[1,1,1]:o.depth==="CUSTOM"?[3,3,5]:null;
  return !!tuple&&[o.historical_windows,o.stress_scenarios,o.parameter_variants].every((x,i)=>x===tuple[i]);
}

function parse(v:unknown):AuditTransaction{
  if(!exact(v,["schema","attempt","scope","quote","revision","idempotency_key","initiated","checkout_session_id"])
    ||v.schema!=="private-audit-ui@1"||typeof v.attempt!=="string"||!ID.test(v.attempt)||!scopeValid(v.scope)
    ||typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<0
    ||typeof v.idempotency_key!=="string"||!IDEMPOTENCY.test(v.idempotency_key)||typeof v.initiated!=="boolean"
    ||!(v.checkout_session_id===null||typeof v.checkout_session_id==="string"&&SESSION.test(v.checkout_session_id))
    ||(!v.initiated&&v.checkout_session_id!==null))return fail();
  const q=v.quote;
  if(!exact(q,["authorization","scope_fingerprint","quote_sha256","pricing_version","expires_at","price"])
    ||q.authorization!==false||typeof q.scope_fingerprint!=="string"||!SHA.test(q.scope_fingerprint)
    ||typeof q.quote_sha256!=="string"||!SHA.test(q.quote_sha256)||q.pricing_version!=="launch-v0.3"
    ||typeof q.expires_at!=="string"||!/(?:Z|\+00:00)$/.test(q.expires_at)||!Number.isFinite(Date.parse(q.expires_at))
    ||!exact(q.price,["currency","cadence","due_today_ex_vat_cents"])||q.price.currency!=="eur"||q.price.cadence!=="ONE_TIME"
    ||typeof q.price.due_today_ex_vat_cents!=="number"||!Number.isSafeInteger(q.price.due_today_ex_vat_cents)
    ||q.price.due_today_ex_vat_cents<0)return fail();
  return freeze(v as AuditTransaction);
}

function list(storage:ContextStorage):AuditTransaction[]{
  const raw=storage.getItem(KEY);if(raw===null)return [];
  if(new TextEncoder().encode(raw).length>MAX_BYTES)return fail();
  const values:unknown=JSON.parse(raw);
  if(!Array.isArray(values)||values.length>8)return fail();
  const parsed=values.map(parse);if(new Set(parsed.map(t=>t.attempt)).size!==parsed.length)return fail();
  return parsed;
}

const identity=(t:AuditTransaction)=>JSON.stringify({...t,initiated:false,checkout_session_id:null});
export function createAuditTransaction(attempt:string,scope:object,quote:PrivateAuditQuote,revision:number,key:string){
  return parse(JSON.parse(JSON.stringify({schema:"private-audit-ui@1",attempt,scope,quote,revision,
    idempotency_key:key,initiated:false,checkout_session_id:null})));
}
export function loadAuditTransaction(storage:ContextStorage,attempt:string){
  if(!ID.test(attempt))return fail();
  return list(storage).find(t=>t.attempt===attempt)??null;
}
export function listAuditTransactions(storage:ContextStorage):readonly AuditTransaction[]{
  return Object.freeze(list(storage));
}
/** Probe this namespace before uploading a new source; never evict a pending attempt. */
export function preflightNewAuditTransaction(storage:ContextStorage){
  const all=list(storage);if(all.length>=8)return fail();
  const raw=JSON.stringify(all);storage.setItem(KEY,raw);
  if(storage.getItem(KEY)!==raw)return fail();
}
export function saveAuditTransaction(storage:ContextStorage,value:AuditTransaction){
  const t=parse(JSON.parse(JSON.stringify(value))),all=list(storage),index=all.findIndex(x=>x.attempt===t.attempt);
  if(index>=0){const old=all[index];if(identity(old)!==identity(t)||old.initiated&&!t.initiated
    ||old.checkout_session_id!==null&&old.checkout_session_id!==t.checkout_session_id)return fail();all[index]=t;}
  else{if(all.length>=8)return fail();all.push(t);}
  const raw=JSON.stringify(all);if(new TextEncoder().encode(raw).length>MAX_BYTES)return fail();
  storage.setItem(KEY,raw);return t;
}

export async function sendAuditTransaction(storage:ContextStorage,expected:AuditTransaction,contract:object,
  send:typeof fetch=fetch,now=Date.now){
  const stored=loadAuditTransaction(storage,expected.attempt);
  if(!stored||identity(stored)!==identity(expected))return fail();
  const at=now();if(!Number.isFinite(at)||!stored.initiated&&Date.parse(stored.quote.expires_at)<=at)return fail();
  const initiated=saveAuditTransaction(storage,{...stored,initiated:true});
  const result=await checkoutPrivateAudit(initiated.attempt,initiated.scope,initiated.quote,contract,
    initiated.idempotency_key,send,now,{allowExpiredRetry:stored.initiated});
  saveAuditTransaction(storage,{...initiated,checkout_session_id:result.checkout_session_id});
  return result;
}

export function privateReturnContext(search:string,storage:ContextStorage){
  const query=new URLSearchParams(search);
  if([...query.keys()].some(k=>k!=="attempt"&&k!=="session_id")||query.getAll("attempt").length!==1
    ||query.getAll("session_id").length!==1)return fail();
  const attempt=query.get("attempt")!,session=query.get("session_id")!;
  if(!ID.test(attempt)||!SESSION.test(session))return fail();
  const t=loadAuditTransaction(storage,attempt);
  if(!t||!t.initiated||t.checkout_session_id!==null&&t.checkout_session_id!==session)return fail();
  return {transaction:t,session};
}

type Status=Awaited<ReturnType<typeof statusPrivateAudit>>;
export function pollPrivateAudit(t:AuditTransaction,session:string,onStatus:(s:Status)=>void,
  options:{send?:typeof fetch;current?:()=>boolean;intervalMs?:number;timeoutMs?:number}={}){
  const stop=new AbortController(),current=()=>!stop.signal.aborted&&(options.current?.()??true);
  const interval=options.intervalMs??2500,timeout=options.timeoutMs??20000;
  if(!Number.isFinite(interval)||interval<0||interval>10000||!Number.isFinite(timeout)||timeout<1||timeout>20000)return fail();
  const wait=()=>new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);stop.signal.removeEventListener("abort",done);resolve();};
    const timer=setTimeout(done,interval);stop.signal.addEventListener("abort",done,{once:true});});
  const finished=(async()=>{
    for(let count=0;count<24;count++){
      if(!current())return "stopped";
      const request=new AbortController(),abort=()=>request.abort(),timer=setTimeout(abort,timeout);
      stop.signal.addEventListener("abort",abort,{once:true});
      let status:Status;
      try{status=await statusPrivateAudit(t.attempt,t.scope,session,
        (input,init)=>(options.send??fetch)(input,{...init,signal:request.signal}));}
      catch{return current()?"unavailable":"stopped";}
      finally{clearTimeout(timer);stop.signal.removeEventListener("abort",abort);}
      if(!current())return "stopped";onStatus(status);if(!current())return "stopped";
      if(status.report_ready)return "ready";
      if(["PAYMENT_FAILED","EXPIRED","REVIEW_REQUIRED"].includes(status.checkout_status)||status.job_status==="DEAD_LETTER")return "review";
      if(count<23)await wait();
    }
    return "limit";
  })();
  return {stop:()=>stop.abort(),finished};
}
