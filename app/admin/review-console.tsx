"use client";

import { useState } from "react";
import styles from "./review-console.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

type Draft = {
  draft_id: string;
  strategy_version_id: string;
  asset_id: string;
  timeframe: string;
  review_decision: "PENDING" | "APPROVED" | "REJECTED";
  verdict_summary: { status: string; pass_count: number; fail_count: number };
};

type Detail = Draft & {
  report_json_sha256: string;
  report_html_sha256: string;
  qualification_decision: string;
  payment_status: string;
  report: Record<string, unknown>;
};

export default function AdminReviewConsole() {
  const [adminSecret, setAdminSecret] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState(
    "Le secret reste uniquement en mémoire pendant l’ouverture de cette page.",
  );
  const [busy, setBusy] = useState(false);

  const adminFetch = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${adminSecret}`,
        ...(init.headers ?? {}),
      },
    });
    const result = (await response.json()) as {
      detail?: { message?: string; code?: string };
      [key: string]: unknown;
    };
    if (!response.ok) {
      throw new Error(result.detail?.message ?? result.detail?.code ?? "ADMIN_REQUEST_FAILED");
    }
    return result;
  };

  const loadQueue = async () => {
    setBusy(true);
    try {
      const result = await adminFetch("/v1/admin/audit-drafts");
      setDrafts(result.audit_drafts as Draft[]);
      setMessage("File de revue chargée. Aucun jeton client n’est visible ici.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Console indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const openDraft = async (draftId: string) => {
    setBusy(true);
    try {
      const result = (await adminFetch(`/v1/admin/audit-drafts/${draftId}`)) as Detail;
      setDetail(result);
      setNote("");
      setMessage("Les deux empreintes ont été vérifiées avant cet affichage.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Brouillon indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/v1/admin/audit-drafts/${detail.draft_id}/decisions`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          reason_code: decision === "APPROVED" ? "HUMAN_REVIEW_PASS" : "HUMAN_REVIEW_REJECT",
          note,
          expected_report_json_sha256: detail.report_json_sha256,
          expected_report_html_sha256: detail.report_html_sha256,
        }),
      });
      setMessage(
        decision === "APPROVED"
          ? "Rapport approuvé. Le client peut maintenant réclamer son accès."
          : "Brouillon rejeté définitivement. Une nouvelle commande sera nécessaire.",
      );
      setDetail(null);
      await loadQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Décision non enregistrée.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <header>
        <span>STRATVERITY · CONTRÔLE HUMAIN</span>
        <h1>File de revue des audits payés</h1>
        <p>{message}</p>
      </header>
      <section className={styles.secretPanel}>
        <label>
          Secret administrateur temporaire
          <input
            type="password"
            autoComplete="off"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
          />
        </label>
        <button disabled={busy || adminSecret.length < 32} onClick={loadQueue} type="button">
          {busy ? "Vérification…" : "Charger la file"}
        </button>
      </section>
      <section className={styles.workspace}>
        <aside>
          <h2>Brouillons</h2>
          {drafts.map((draft) => (
            <button key={draft.draft_id} onClick={() => openDraft(draft.draft_id)} type="button">
              <strong>{draft.strategy_version_id}</strong>
              <span>{draft.asset_id} · {draft.timeframe}</span>
              <em>{draft.review_decision}</em>
            </button>
          ))}
          {!drafts.length && <p>Aucun brouillon chargé.</p>}
        </aside>
        <article>
          {detail ? (
            <>
              <span>{detail.qualification_decision} · {detail.payment_status}</span>
              <h2>{detail.strategy_version_id} — {detail.asset_id} · {detail.timeframe}</h2>
              <dl>
                <div><dt>JSON</dt><dd>{detail.report_json_sha256}</dd></div>
                <div><dt>HTML</dt><dd>{detail.report_html_sha256}</dd></div>
              </dl>
              <pre>{JSON.stringify(detail.report, null, 2)}</pre>
              {detail.review_decision === "PENDING" && (
                <div className={styles.decisionPanel}>
                  <label>
                    Note interne bornée
                    <textarea maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <button disabled={busy} onClick={() => decide("APPROVED")} type="button">Approuver les octets affichés</button>
                  <button className={styles.reject} disabled={busy} onClick={() => decide("REJECTED")} type="button">Rejeter définitivement</button>
                </div>
              )}
            </>
          ) : (
            <p>Sélectionnez un brouillon pour examiner le rapport et ses empreintes.</p>
          )}
        </article>
      </section>
    </main>
  );
}
