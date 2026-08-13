"use client";

import { useState } from "react";
import styles from "./review-console.module.css";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

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
  const { t } = useI18n();
  const [adminSecret, setAdminSecret] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [note, setNote] = useState("");
  const [messageKey, setMessageKey] = useState<MessageKey>("admin.initial");
  const message = t(messageKey);
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
      setMessageKey("admin.queueLoaded");
    } catch {
      setMessageKey("admin.consoleUnavailable");
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
      setMessageKey("admin.hashesVerified");
    } catch {
      setMessageKey("admin.draftUnavailable");
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
      setMessageKey(decision === "APPROVED" ? "admin.approved" : "admin.rejected");
      setDetail(null);
      await loadQueue();
    } catch {
      setMessageKey("admin.decisionFailed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <header>
        <span>{t("admin.badge")}</span>
        <h1>{t("admin.title")}</h1>
        <p>{message}</p>
      </header>
      <section className={styles.secretPanel} data-premium-surface>
        <label>
          {t("admin.secret")}
          <input
            type="password"
            autoComplete="off"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
          />
        </label>
        <button disabled={busy || adminSecret.length < 32} onClick={loadQueue} type="button">
          {busy ? t("admin.checking") : t("admin.loadQueue")}
        </button>
      </section>
      <section className={styles.workspace}>
        <aside data-premium-surface>
          <h2>{t("admin.drafts")}</h2>
          {drafts.map((draft) => (
            <button key={draft.draft_id} onClick={() => openDraft(draft.draft_id)} type="button">
              <strong>{draft.strategy_version_id}</strong>
              <span>{draft.asset_id} · {draft.timeframe}</span>
              <em>{draft.review_decision}</em>
            </button>
          ))}
          {!drafts.length && <p>{t("admin.noDraft")}</p>}
        </aside>
        <article data-premium-surface>
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
                    {t("admin.note")}
                    <textarea maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <button disabled={busy} onClick={() => decide("APPROVED")} type="button">{t("admin.approve")}</button>
                  <button className={styles.reject} disabled={busy} onClick={() => decide("REJECTED")} type="button">{t("admin.reject")}</button>
                </div>
              )}
            </>
          ) : (
            <p>{t("admin.selectDraft")}</p>
          )}
        </article>
      </section>
    </main>
  );
}
