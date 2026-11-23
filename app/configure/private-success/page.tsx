"use client";
import {Suspense,useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import {useI18n} from "../../i18n/I18nProvider";
import {privateAuditCheckoutUiMode,privateReturnContext,pollPrivateAudit} from "../private-audit-flow";
import styles from "../scope-configurator.module.css";
import PrivateReportDownload from "../private-report-download";

const messages={
  fr:{title:"Suivi privé de votre audit",inactive:"Ce retour privé local est désactivé.",checking:"Vérification authentifiée en cours…",
    missing:"Le contexte local de cette tentative est absent ou invalide. Reprenez la même tentative depuis ce navigateur.",
    pending:"Traitement en cours. L’URL seule ne confirme aucun paiement.",ready:"Le rapport est prêt côté serveur. La réception d’un email n’est pas vérifiée.",
    review:"Cette tentative nécessite une vérification. Ne créez pas un second paiement.",
    limit:"Le suivi automatique est terminé. Le traitement peut continuer côté serveur. Revenez vérifier cette même tentative.",
    unavailable:"Le statut n’a pas pu être confirmé. Reprenez cette même tentative plus tard.",back:"Retour au configurateur"},
  en:{title:"Private audit status",inactive:"This local private return is disabled.",checking:"Checking authenticated status…",
    missing:"Local context for this attempt is missing or invalid. Resume the same attempt in this browser.",
    pending:"Processing. The URL alone does not confirm any payment.",ready:"The report is ready on the server. Email receipt has not been verified.",
    review:"This attempt needs review. Do not create a second payment.",
    limit:"Automatic status checks have ended. Server processing may continue. Check this same attempt again later.",
    unavailable:"Status could not be confirmed. Check this same attempt again later.",back:"Back to configurator"},
} as const;

function PrivateAuditSuccessInner(){
  const {locale}=useI18n(),text=messages[locale==="fr"?"fr":"en"];
  type Phase="checking"|"inactive"|"missing"|"pending"|"ready"|"review"|"limit"|"unavailable";
  const query=useSearchParams().toString();
  const [view,setView]=useState<{query:string;phase:Phase}>({query,phase:"checking"});
  const generation=useRef(0),enabled=privateAuditCheckoutUiMode();
  useEffect(()=>{
    const sequence=++generation.current;let polling:ReturnType<typeof pollPrivateAudit>|undefined;
    const setPhase=(phase:Phase)=>setView({query,phase});
    const current=()=>generation.current===sequence&&new URLSearchParams(window.location.search).toString()===query&&!window.location.hash;
    if(!enabled||window.location.hostname!=="127.0.0.1"){setPhase("inactive");return;}
    setPhase("checking");
    const changedHash=()=>{generation.current++;polling?.stop();setPhase("missing");};
    window.addEventListener("hashchange",changedHash);
    try{
      if(window.location.hash)throw new Error("Unexpected return fragment");
      const context=privateReturnContext(query,window.sessionStorage);
      polling=pollPrivateAudit(context.transaction,context.session,()=>{if(current())setPhase("pending");},{current});
      void polling.finished.then(reason=>{if(current()&&reason!=="stopped")setPhase(reason);});
    }catch{setPhase("missing");}
    return()=>{generation.current++;polling?.stop();window.removeEventListener("hashchange",changedHash);};
  },[enabled,query]);
  return <main className={styles.page}><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/>
    <section className={styles.intro}><div><h1>{text.title}</h1><div className={styles.privacyNote}>
      <p role="status">{text[enabled?(view.query===query?view.phase:"checking"):"inactive"]}</p></div>
      {enabled&&view.query===query&&view.phase==="ready"?<PrivateReportDownload key={query} search={query} locale={locale==="fr"?"fr":"en"}/>:null}
      <p><a href="/configure">{text.back}</a></p></div></section></main>;
}
export default function PrivateAuditSuccess(){return <Suspense fallback={<main/>}><PrivateAuditSuccessInner/></Suspense>;}
