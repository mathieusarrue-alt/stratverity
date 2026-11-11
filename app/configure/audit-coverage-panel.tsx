"use client";

import { useEffect, useState } from "react";
import type { CoverageState } from "./audit-coverage";

const labels = {
  fr: {
    title: "Couverture des données",
    invalid: "La couverture n’a pas pu être vérifiée. Relancez l’aperçu.",
    expired: "La vérification a expiré. Relancez l’aperçu pour confirmer une nouvelle période.",
    missing: "Aucune période n’est vérifiée pour cette sélection.",
    long: "Le profil longue durée n’est pas encore proposé pour cette sélection.",
    multi: "Cette sélection multi-contexte doit être vérifiée avant de pouvoir être proposée.",
    reduced: "Historique plus court que demandé",
    verified: "Période vérifiée",
    requested: "Durée demandée",
    verifiedPeriod: "Dates vérifiées (UTC, clôture de fin)",
    candles: "Bougies clôturées",
    years: "ans",
    agree: "J’accepte cette période réduite pour cette sélection.",
    agreed: "Période acceptée pour cet aperçu uniquement.",
    reset: "La confirmation précédente ne s’applique pas. Relancez l’aperçu.",
    noPayment: "Cet aperçu ne permet pas de payer.",
  },
  en: {
    title: "Data coverage",
    invalid: "Coverage could not be verified. Run the preview again.",
    expired: "Verification expired. Run the preview again to confirm a new window.",
    missing: "No period has been verified for this selection.",
    long: "The long-history profile is not yet offered for this selection.",
    multi: "This multi-context selection needs review before it can be offered.",
    reduced: "Less history than requested",
    verified: "Verified period",
    requested: "Requested duration",
    verifiedPeriod: "Verified dates (UTC, ending at candle close)",
    candles: "Closed candles",
    years: "years",
    agree: "I accept this shorter period for this selection.",
    agreed: "Period accepted for this preview only.",
    reset: "The previous confirmation does not apply. Run the preview again.",
    noPayment: "Payment is not available from this preview.",
  },
} as const;

export default function AuditCoveragePanel({ coverage, locale, reserve }: {
  coverage: CoverageState; locale: "fr" | "en"; reserve?: (receipt?: string) => Promise<void>;
}) {
  const t = labels[locale];
  const [confirmed, setConfirmed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [reservation, setReservation] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const expiresAt = "expiresAt" in coverage ? coverage.expiresAt : null;
  useEffect(() => {
    if (expiresAt === null) return;
    const timer = setTimeout(() => setExpired(true), Math.max(0, expiresAt-Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);
  if (coverage.status === "ABSENT") return null;
  const status = expired ? "EXPIRED" : coverage.status;
  const messages = {
    INVALID: t.invalid, EXPIRED: t.expired, DATA_NOT_VERIFIED: t.missing,
    PROFILE_NOT_OFFERED: t.long, MULTI_CONTEXT_REVIEW_REQUIRED: t.multi,
    RESET_UNEXPECTED_CONFIRMATION: t.reset,
  };
  const message = status in messages ? messages[status as keyof typeof messages] : null;
  return (
    <section aria-label={t.title}>
      <h3>{t.title}</h3>
      {message ? <p role="status">{message}</p> : null}
      {"window" in coverage && !expired ? <>
        <p><strong>{coverage.window.reduced ? t.reduced : t.verified}</strong></p>
        <p>{coverage.window.asset_id} · {coverage.window.timeframe.toUpperCase()}</p>
        <dl>
          <dt>{t.requested}</dt><dd>{coverage.window.target_years} {t.years}</dd>
          <dt>{t.verifiedPeriod}</dt><dd>{coverage.window.first_open.replace("T", " ")} → {coverage.window.last_close.replace("T", " ")}</dd>
          <dt>{t.candles}</dt><dd>{coverage.window.bars.toLocaleString(locale)}</dd>
        </dl>
        {status === "CONFIRM_EXACT_REDUCED_WINDOW" ? <>
          <label><input type="checkbox" checked={confirmed} onChange={event => {
            if (Date.now() >= coverage.expiresAt) setExpired(true);
            else setConfirmed(event.target.checked);
          }} /> {t.agree}</label>
          <p role="status">{confirmed ? t.agreed : ""}</p>
        </> : null}
      </> : null}
      {reserve && !expired && (coverage.status === "PRIVATE_QUOTE_POSSIBLE" ||
        coverage.status === "CONFIRM_EXACT_REDUCED_WINDOW") ? <>
        <button type="button" disabled={reservation === "busy" || reservation === "saved" ||
          (coverage.status === "CONFIRM_EXACT_REDUCED_WINDOW" && !confirmed)}
          onClick={async () => {
            if (Date.now() >= coverage.expiresAt) { setExpired(true); return; }
            if (coverage.status === "CONFIRM_EXACT_REDUCED_WINDOW" && !confirmed) return;
            setReservation("busy");
            try {
              await reserve(coverage.status === "CONFIRM_EXACT_REDUCED_WINDOW" ? coverage.receipt : undefined);
              setReservation("saved");
            } catch { setReservation("error"); }
          }}>{locale === "fr" ? "Réserver le devis (test local)" : "Reserve quote (local test)"}</button>
        <p role="status">{reservation === "saved"
          ? (locale === "fr" ? "Devis réservé. Aucun paiement." : "Quote reserved. No payment.")
          : reservation === "error" ? t.invalid : ""}</p>
      </> : null}
      <p>{t.noPayment}</p>
    </section>
  );
}
