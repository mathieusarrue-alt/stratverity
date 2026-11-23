"use client";
import {useEffect,useRef,useState} from "react";
import {downloadPrivateAudit,privateAuditReportUiMode} from "./private-audit-client";
import {privateReturnContext} from "./private-audit-flow";

/** Explicit attachment only. The report is never interpreted by the application. */
export default function PrivateReportDownload({search,locale,send=fetch}:{search:string;locale:"fr"|"en";send?:typeof fetch}){
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const active=useRef(false),busyRef=useRef(false),request=useRef<AbortController|null>(null);
  const objectUrls=useRef(new Set<string>());
  useEffect(()=>{active.current=true;return()=>{active.current=false;request.current?.abort();
    objectUrls.current.forEach(url=>URL.revokeObjectURL(url));objectUrls.current.clear();};},[]);
  const enabled=privateAuditReportUiMode(),fr=locale==="fr";
  const current=()=>active.current&&enabled&&window.location.hostname==="127.0.0.1"&&!window.location.hash
    &&new URLSearchParams(window.location.search).toString()===search;
  const download=async()=>{
    if(busyRef.current||!current())return;
    busyRef.current=true;setBusy(true);setNotice("");const controller=new AbortController();request.current=controller;
    try{
      const{transaction,session}=privateReturnContext(search,window.sessionStorage);
      const bytes=await downloadPrivateAudit(transaction.attempt,transaction.scope,session,send,
        AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]));
      if(!current()||controller.signal.aborted)return;
      const url=URL.createObjectURL(new Blob([bytes],{type:"application/octet-stream"}));objectUrls.current.add(url);
      const link=document.createElement("a");link.href=url;link.download="stratverity-audit.html";link.referrerPolicy="no-referrer";
      try{document.body.appendChild(link);link.click();}finally{link.remove();
        setTimeout(()=>{URL.revokeObjectURL(url);objectUrls.current.delete(url);},0);}
      if(current())setNotice(fr?"Le fichier a été préparé pour le téléchargement.":"The file has been prepared for download.");
    }catch{if(current())setNotice(fr?"Le rapport n’a pas pu être récupéré. Revérifiez cette même tentative, sans nouveau paiement."
      :"The report could not be retrieved. Check this same attempt again without another payment.");}
    finally{busyRef.current=false;if(active.current)setBusy(false);if(request.current===controller)request.current=null;}
  };
  if(!enabled)return null;
  return <section aria-label={fr?"Rapport privé":"Private report"}><button type="button" disabled={busy} onClick={download}>
    {busy?(fr?"Préparation du fichier…":"Preparing file…"):(fr?"Télécharger mon rapport":"Download my report")}</button>
    <p role="status">{notice}</p></section>;
}
