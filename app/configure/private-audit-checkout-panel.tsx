"use client";
import {useEffect,useRef,useState} from "react";
import type {ReactNode} from "react";
import {sendAuditTransaction,loadAuditTransaction} from "./private-audit-flow";
import type {AuditTransaction,ContextStorage} from "./private-audit-flow";
const browserStorage=()=>window.sessionStorage;

export default function PrivateAuditCheckoutPanel({transaction,locale,contract,label,current,navigate,
  storage=browserStorage,send=fetch}: {
  transaction:AuditTransaction;locale:"fr"|"en";contract:object;label:ReactNode;current:()=>boolean;
  navigate:(url:string)=>void;storage?:()=>ContextStorage;send?:typeof fetch;
}){
  const [accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [attempted,setAttempted]=useState(transaction.initiated),[expired,setExpired]=useState(false);
  const busyRef=useRef(false),mounted=useRef(false),generation=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;};},[]);
  useEffect(()=>{
    if(attempted){setExpired(false);return;}
    const timer=setTimeout(()=>{
      try{const saved=loadAuditTransaction(storage(),transaction.attempt);
        if(saved?.initiated)setAttempted(true);else setExpired(true);
      }catch{setExpired(true);}
    },Math.max(0,Date.parse(transaction.quote.expires_at)-Date.now()));
    return()=>clearTimeout(timer);
  },[attempted,transaction,storage]);
  const fr=locale==="fr",context=(transaction.scope.contexts as {asset_id:string;timeframe:string}[])[0];
  const strategy=(transaction.scope.strategies as {strategy_version_id:string}[])[0];
  const depth=(transaction.scope.audit_options as {depth:string}).depth;
  const pay=async()=>{
    if(!accepted||busyRef.current||!mounted.current||!current())return;
    const sequence=generation.current;busyRef.current=true;setBusy(true);setNotice("");
    try{
      const result=await sendAuditTransaction(storage(),transaction,contract,send);
      // The core has persisted the original session even when selection changed.
      if(mounted.current&&sequence===generation.current&&current())navigate(result.checkout_url);
    }catch{
      if(mounted.current&&sequence===generation.current&&current()){
        try{if(loadAuditTransaction(storage(),transaction.attempt)?.initiated)setAttempted(true);}catch{/* No authority inferred. */}
        setNotice(fr?"Préparation non confirmée. Reprenez cette même tentative, sans créer une nouvelle demande."
          :"Preparation could not be confirmed. Retry this same attempt rather than creating a new request.");
      }
    }finally{
      busyRef.current=false;if(mounted.current&&sequence===generation.current)setBusy(false);
    }
  };
  return <section aria-label={fr?"Paiement privé local":"Local private checkout"}>
    <h3>{fr?"Devis privé réservé":"Reserved private quote"}</h3>
    <p>{context.asset_id} · {context.timeframe.toUpperCase()} · {depth} · {strategy.strategy_version_id}</p>
    <p>{new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"}).format(transaction.quote.price.due_today_ex_vat_cents/100)} {fr?"HT, TVA calculée au paiement":"excluding VAT, tax calculated at checkout"}</p>
    <p>{fr?"Tentative":"Attempt"} : {transaction.attempt}</p>
    {transaction.checkout_session_id?<a referrerPolicy="no-referrer" href={`/configure/private-success?${new URLSearchParams({attempt:transaction.attempt,session_id:transaction.checkout_session_id})}`}>
      {fr?"Vérifier le statut de cette tentative":"Check this attempt’s status"}</a>:null}
    <label><input type="checkbox" checked={accepted} disabled={busy}
      onChange={e=>setAccepted(e.target.checked)}/>{label}</label>
    <button type="button" disabled={!accepted||busy||expired&&!attempted} onClick={pay}>
      {busy?(fr?"Préparation…":"Preparing…"):(attempted
        ?(fr?"Reprendre cette tentative":"Resume this attempt"):(fr?"Continuer vers le paiement privé":"Continue to private checkout"))}</button>
    <p role="status">{notice}</p>
    {expired&&!attempted?<p role="status">{fr?"Devis expiré pour une nouvelle préparation.":"Quote expired for a new preparation."}</p>:null}
  </section>;
}
