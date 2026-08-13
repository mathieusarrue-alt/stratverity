"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "../scope-configurator.module.css";
import { useI18n } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

type StrategyStatus = {
  strategy_version_id: string;
  expected_sha256: string;
  source_received: boolean;
  evidence_count: number;
  context_count: number;
  audit_draft_count: number;
  qualification_id: string | null;
  qualification_status:
    | "NOT_STARTED"
    | "STATIC_PASS"
    | "REVIEW_REQUIRED"
    | "STATIC_REJECTED";
};

type ServiceContext = {
  strategy_version_id: string;
  asset_id: string;
  timeframe: string;
};

type OrderStatus = {
  payment_status: string;
  order_id: string | null;
  order_status: string;
  product: "AUDIT" | "SCAN";
  scope_fingerprint: string;
  contexts: ServiceContext[];
  strategies: StrategyStatus[];
  entitlement_status: "NOT_CREATED";
  worker_status: "NOT_DISPATCHED";
};

type PageState =
  | "checking"
  | "pending"
  | "paid"
  | "ready"
  | "qualified"
  | "draft"
  | "review"
  | "blocked"
  | "error";

export default function CheckoutReturnPage() {
  const { t } = useI18n();
  const [pageState, setPageState] = useState<PageState>("checking");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [messageKey, setMessageKey] = useState<MessageKey>("success.initial");
  const message = t(messageKey);
  const [sessionId, setSessionId] = useState("");
  const [ownerToken, setOwnerToken] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [artifactRole, setArtifactRole] = useState<
    "STRATEGY_SOURCE" | "BACKTEST_EVIDENCE"
  >("STRATEGY_SOURCE");
  const [artifact, setArtifact] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [qualifying, setQualifying] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [openingReport, setOpeningReport] = useState(false);
  const [approvedReportHtml, setApprovedReportHtml] = useState("");
  const [contextKey, setContextKey] = useState("");
  const [sourceTimezone, setSourceTimezone] = useState("UTC");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [currency, setCurrency] = useState("USD");
  const [commissionPercent, setCommissionPercent] = useState("0.1");
  const [slippageTicks, setSlippageTicks] = useState("0");

  const loadStatus = useCallback(
    async (stripeSession: string, browserOwner: string) => {
      const response = await fetch(`${API_URL}/v1/orders/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_session_id: stripeSession,
          owner_token: browserOwner,
        }),
      });
      if (!response.ok) throw new Error("ORDER_STATUS_UNAVAILABLE");
      const result = (await response.json()) as OrderStatus;
      setStatus(result);
      setStrategyId((current) =>
        current || result.strategies[0]?.strategy_version_id || "",
      );
      setContextKey((current) => {
        if (current) return current;
        const first = result.contexts[0];
        return first
          ? `${first.strategy_version_id}|${first.asset_id}|${first.timeframe}`
          : "";
      });
      if (result.order_status === "DRAFT_AWAITING_HUMAN_REVIEW") {
        setPageState("draft");
        setMessageKey("success.msg.draft");
      } else if (result.order_status === "READY_FOR_QUALIFICATION") {
        setPageState("ready");
        setMessageKey("success.msg.ready");
      } else if (result.order_status === "STATIC_QUALIFIED_AWAITING_APPROVAL") {
        setPageState("qualified");
        setMessageKey("success.msg.qualified");
      } else if (result.order_status === "HUMAN_REVIEW_REQUIRED") {
        setPageState("review");
        setMessageKey("success.msg.review");
      } else if (result.order_status === "QUALIFICATION_BLOCKED") {
        setPageState("blocked");
        setMessageKey("success.msg.blocked");
      } else if (result.order_id) {
        setPageState("paid");
        setMessageKey("success.msg.paid");
      } else {
        setPageState("pending");
        setMessageKey("success.msg.pending");
      }
      return result;
    },
    [],
  );

  useEffect(() => {
    let stopped = false;
    const initializeAndPoll = async () => {
      await Promise.resolve();
      const stripeSession =
        new URLSearchParams(window.location.search).get("session_id") ?? "";
      const browserOwner = stripeSession
        ? sessionStorage.getItem(`stratverity.order-owner:${stripeSession}`) ?? ""
        : "";
      if (!stripeSession || !browserOwner) {
        setPageState("error");
        setMessageKey("success.msg.session");
        return;
      }
      setSessionId(stripeSession);
      setOwnerToken(browserOwner);
      for (let attempt = 0; attempt < 8 && !stopped; attempt += 1) {
        try {
          const result = await loadStatus(stripeSession, browserOwner);
          if (result.order_id) return;
        } catch {
          if (attempt === 7 && !stopped) {
            setPageState("error");
            setMessageKey("success.msg.confirmUnavailable");
            return;
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
    };
    void initializeAndPoll();
    return () => {
      stopped = true;
    };
  }, [loadStatus]);

  const chooseArtifact = (event: ChangeEvent<HTMLInputElement>) => {
    setArtifact(event.target.files?.[0] ?? null);
  };

  const submitArtifact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!status?.order_id || !artifact || !strategyId) return;
    setUploading(true);
    setMessageKey("success.msg.inspecting");
    try {
      const body = new FormData();
      body.set("artifact", artifact);
      body.set("checkout_session_id", sessionId);
      body.set("owner_token", ownerToken);
      body.set("strategy_version_id", strategyId);
      body.set("artifact_role", artifactRole);
      if (artifactRole === "BACKTEST_EVIDENCE") {
        const selected = status.contexts.find(
          (context) =>
            `${context.strategy_version_id}|${context.asset_id}|${context.timeframe}` ===
            contextKey,
        );
        if (!selected) throw new Error("PURCHASED_CONTEXT_REQUIRED");
        body.set(
          "evidence_context_json",
          JSON.stringify({
            schema_version: "0.1.0",
            evidence_kind: "TRADES_CSV",
            asset_id: selected.asset_id,
            timeframe: selected.timeframe,
            source_timezone: sourceTimezone,
            initial_capital: Number(initialCapital),
            currency: currency.trim().toUpperCase(),
            commission_percent: Number(commissionPercent),
            slippage_ticks: Number(slippageTicks),
            declared_metrics: {},
          }),
        );
      }
      const response = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/submissions`,
        { method: "POST", body },
      );
      const result = (await response.json()) as {
        detail?: { code?: string; message?: string };
      };
      if (!response.ok) {
        throw new Error(result.detail?.message ?? result.detail?.code ?? "UPLOAD_FAILED");
      }
      setArtifact(null);
      await loadStatus(sessionId, ownerToken);
    } catch (error) {
      setPageState("error");
      setMessageKey(error instanceof Error && error.message === "PURCHASED_CONTEXT_REQUIRED" ? "success.msg.contextRequired" : "success.msg.uploadFailed");
    } finally {
      setUploading(false);
    }
  };

  const qualifyOrder = async () => {
    if (!status?.order_id || !sessionId || !ownerToken) return;
    setQualifying(true);
    setMessageKey("success.msg.qualifying");
    try {
      const response = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/qualifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkout_session_id: sessionId,
            owner_token: ownerToken,
          }),
        },
      );
      const result = (await response.json()) as {
        detail?: { code?: string; message?: string };
      };
      if (!response.ok) {
        throw new Error(
          result.detail?.message ?? result.detail?.code ?? "QUALIFICATION_FAILED",
        );
      }
      await loadStatus(sessionId, ownerToken);
    } catch {
      setPageState("error");
      setMessageKey("success.msg.qualificationUnavailable");
    } finally {
      setQualifying(false);
    }
  };

  const generateAuditDraft = async () => {
    if (!status?.order_id || !sessionId || !ownerToken) return;
    setGeneratingDraft(true);
    setMessageKey("success.msg.drafting");
    try {
      const response = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/audit-drafts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkout_session_id: sessionId,
            owner_token: ownerToken,
          }),
        },
      );
      const result = (await response.json()) as {
        detail?: { code?: string; message?: string };
      };
      if (!response.ok) {
        throw new Error(
          result.detail?.message ?? result.detail?.code ?? "AUDIT_DRAFT_FAILED",
        );
      }
      await loadStatus(sessionId, ownerToken);
    } catch {
      setPageState("error");
      setMessageKey("success.msg.draftUnavailable");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const openApprovedReport = async () => {
    if (!status?.order_id || !sessionId || !ownerToken) return;
    const draftId = status.strategies.find((strategy) => strategy.audit_draft_count > 0);
    if (!draftId) return;
    setOpeningReport(true);
    setMessageKey("success.msg.checkingApproval");
    try {
      const draftsResponse = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/audit-reports/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkout_session_id: sessionId, owner_token: ownerToken }),
        },
      );
      if (!draftsResponse.ok) throw new Error("AUDIT_DRAFT_UNAVAILABLE");
      const drafts = (await draftsResponse.json()) as {
        reports: Array<{ draft_id: string; review_decision: string }>;
      };
      const draft = drafts.reports.find(
        (report) => report.review_decision === "APPROVED",
      );
      if (!draft) throw new Error("AUDIT_DRAFT_UNAVAILABLE");
      const accessResponse = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/audit-reports/${draft.draft_id}/access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkout_session_id: sessionId, owner_token: ownerToken }),
        },
      );
      const access = (await accessResponse.json()) as {
        access_token?: string;
        detail?: { message?: string; code?: string };
      };
      if (!accessResponse.ok || !access.access_token) {
        throw new Error(
          access.detail?.message ?? access.detail?.code ?? "AUDIT_REPORT_NOT_APPROVED",
        );
      }
      const reportResponse = await fetch(
        `${API_URL}/v1/paid-audit-reports/${draft.draft_id}`,
        { headers: { Authorization: `Bearer ${access.access_token}` } },
      );
      if (!reportResponse.ok) throw new Error("AUDIT_REPORT_UNAVAILABLE");
      setApprovedReportHtml(await reportResponse.text());
      setMessageKey("success.msg.reportOpened");
    } catch {
      setMessageKey("success.msg.reportUnavailable");
    } finally {
      setOpeningReport(false);
    }
  };

  return (
    <main className={`${styles.page} ${styles.successPage}`}>
      <section className={styles.successCard} data-premium-surface>
        <span>{t("success.badge")}</span>
        <h1>
          {approvedReportHtml
            ? t("success.title.approved")
            : pageState === "ready"
            ? t("success.title.ready")
            : pageState === "draft"
              ? t("success.title.draft")
            : pageState === "qualified"
              ? t("success.title.qualified")
              : pageState === "review"
                ? t("success.title.review")
                : pageState === "blocked"
                  ? t("success.title.blocked")
            : pageState === "paid"
              ? t("success.title.paid")
              : t("success.title.pending")}
        </h1>
        <p>{message}</p>

        {status?.order_id && (
          <div className={styles.orderProof}>
            <dl>
              <div>
                <dt>{t("success.order")}</dt>
                <dd>{status.order_id.slice(0, 26)}…</dd>
              </div>
              <div>
                <dt>{t("success.state")}</dt>
                <dd>{approvedReportHtml ? "REPORT_APPROVED" : status.order_status}</dd>
              </div>
              <div>
                <dt>{t("success.execution")}</dt>
                <dd>{status.worker_status}</dd>
              </div>
            </dl>
          </div>
        )}

        {status?.order_id && ["paid", "qualified", "error"].includes(pageState) && (
          <form className={styles.orderUpload} onSubmit={submitArtifact}>
            <h2>{t("success.uploadTitle")}</h2>
            {pageState === "qualified" && (
              <p>{t("success.qualifiedHelp")}</p>
            )}
            <label>
              {t("success.strategy")}
              <select value={strategyId} onChange={(event) => setStrategyId(event.target.value)}>
                {status.strategies.map((strategy) => (
                  <option key={strategy.strategy_version_id} value={strategy.strategy_version_id}>
                    {strategy.strategy_version_id} {strategy.source_received ? t("success.sourceReceived") : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("success.fileType")}
              <select
                value={artifactRole}
                onChange={(event) =>
                  setArtifactRole(
                    event.target.value as "STRATEGY_SOURCE" | "BACKTEST_EVIDENCE",
                  )
                }
              >
                <option value="STRATEGY_SOURCE">{t("success.strategyCode")}</option>
                <option value="BACKTEST_EVIDENCE">{t("success.backtestEvidence")}</option>
              </select>
            </label>
            <label>
              {t("success.file")}
              <input
                type="file"
                required
                onChange={chooseArtifact}
                accept={
                  artifactRole === "STRATEGY_SOURCE"
                    ? ".pine,.py,.ipynb,.zip"
                    : ".csv,.html,.json,.txt,.zip"
                }
              />
            </label>
            {artifactRole === "BACKTEST_EVIDENCE" && (
              <>
                <label>
                  {t("success.purchasedContext")}
                  <select value={contextKey} onChange={(event) => setContextKey(event.target.value)}>
                    {status.contexts
                      .filter((context) => context.strategy_version_id === strategyId)
                      .map((context) => {
                        const key = `${context.strategy_version_id}|${context.asset_id}|${context.timeframe}`;
                        return <option key={key} value={key}>{context.asset_id} · {context.timeframe}</option>;
                      })}
                  </select>
                </label>
                <label>
                  {t("success.timezone")}
                  <input value={sourceTimezone} onChange={(event) => setSourceTimezone(event.target.value)} required />
                </label>
                <label>
                  {t("success.initialCapital")}
                  <input type="number" min="0.01" step="0.01" value={initialCapital} onChange={(event) => setInitialCapital(event.target.value)} required />
                </label>
                <label>
                  {t("success.currency")}
                  <input minLength={3} maxLength={10} value={currency} onChange={(event) => setCurrency(event.target.value)} required />
                </label>
                <label>
                  {t("success.commission")}
                  <input type="number" min="0" max="100" step="0.001" value={commissionPercent} onChange={(event) => setCommissionPercent(event.target.value)} required />
                </label>
                <label>
                  {t("success.slippage")}
                  <input type="number" min="0" step="1" value={slippageTicks} onChange={(event) => setSlippageTicks(event.target.value)} required />
                </label>
              </>
            )}
            <button disabled={uploading || !artifact} type="submit">
              {uploading ? t("success.inspecting") : t("success.uploadWithoutExecution")}
            </button>
            <p>{t("success.uploadHelp")}</p>
          </form>
        )}

        {status?.order_id && pageState === "ready" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{t("success.qualifyTitle")}</h2>
            <p>{t("success.qualifyBody")}</p>
            <button disabled={qualifying} type="button" onClick={qualifyOrder}>
              {qualifying ? t("success.qualifying") : t("success.qualifyAction")}
            </button>
          </div>
        )}

        {status?.order_id && pageState === "qualified" && status.product === "AUDIT" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{t("success.draftTitle")}</h2>
            <p>{t("success.draftBody")}</p>
            <button disabled={generatingDraft} type="button" onClick={generateAuditDraft}>
              {generatingDraft ? t("success.calculating") : t("success.draftAction")}
            </button>
          </div>
        )}

        {status?.order_id && pageState === "draft" && !approvedReportHtml && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{t("success.humanTitle")}</h2>
            <p>{t("success.humanBody")}</p>
            <button disabled={openingReport} type="button" onClick={openApprovedReport}>
              {openingReport ? t("success.checking") : t("success.openApproved")}
            </button>
          </div>
        )}

        {approvedReportHtml && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{t("success.deliveredTitle")}</h2>
            <p>{t("success.deliveredBody")}</p>
            <iframe
              className={styles.approvedReport}
              sandbox=""
              srcDoc={approvedReportHtml}
              title={t("success.iframeTitle")}
            />
          </div>
        )}

        {status?.strategies.some(
          (strategy) => strategy.qualification_status !== "NOT_STARTED",
        ) && (
          <div className={styles.orderProof}>
            <dl>
              {status.strategies.map((strategy) => (
                <div key={strategy.strategy_version_id}>
                  <dt>{strategy.strategy_version_id}</dt>
                  <dd>{strategy.qualification_status}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p>
          <strong>{t("success.safetyStrong")}</strong>{" "}
          {t("success.safetyBody")}
        </p>
        <Link href="/configure">{t("success.back")}</Link>
      </section>
    </main>
  );
}
