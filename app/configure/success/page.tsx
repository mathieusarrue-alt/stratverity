"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "../scope-configurator.module.css";
import { useI18n } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

const BACKTEST_EVIDENCE_ACCEPT = ".csv,.html,.json,.txt,.zip";
const POLL_MS = 3500;
const MAX_POLLS = 24;

type StrategyStatus = {
  strategy_version_id: string;
  expected_sha256: string;
  source_received: boolean;
  evidence_count: number;
  context_count: number;
  audit_draft_count: number;
  qualification_id: string | null;
  qualification_status: string;
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
  entitlement_status?: string;
  worker_status?: string;
  delivery_status?: string;
};

type AutoDeliverResponse = {
  order_id?: string;
  status?: string;
  delivery_status?: string;
  report_html?: string | null;
  report_url?: string | null;
  message?: string;
  detail?: { code?: string; message?: string } | string;
};

type PageState =
  | "booting"
  | "delivering"
  | "delivered"
  | "pending_evidence"
  | "stuck"
  | "error";

type StepId = "paid" | "pipeline" | "report";

function stepIndex(state: PageState): number {
  if (state === "delivered") return 3;
  if (state === "pending_evidence") return 2;
  if (state === "delivering" || state === "booting") return 1;
  return 1;
}

function isTerminalDelivered(orderStatus: string, deliveryStatus?: string) {
  const s = `${deliveryStatus || ""} ${orderStatus || ""}`.toUpperCase();
  return (
    s.includes("DELIVERED") ||
    s.includes("REPORT_APPROVED") ||
    s.includes("AVAILABLE_PENDING_REPORT")
  );
}

export default function CheckoutReturnPage() {
  const { t, locale } = useI18n();
  const fr = locale === "fr";
  const [pageState, setPageState] = useState<PageState>("booting");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [messageKey, setMessageKey] = useState<MessageKey>("success.initial");
  const [detailMessage, setDetailMessage] = useState("");
  const message = detailMessage || t(messageKey);
  const [sessionId, setSessionId] = useState("");
  const [ownerToken, setOwnerToken] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [approvedReportHtml, setApprovedReportHtml] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(0);
  const stoppedRef = useRef(false);

  const mapDeliveryState = useCallback(
    (orderStatus: string, deliveryStatus?: string, workerStatus?: string) => {
      const s = (deliveryStatus || orderStatus || "").toUpperCase();
      const w = (workerStatus || "").toUpperCase();

      if (s.includes("DELIVERED") || s.includes("REPORT_APPROVED")) {
        setPageState("delivered");
        setDetailMessage(
          fr ? "Votre rapport d’audit est prêt." : "Your audit report is ready.",
        );
        return;
      }
      if (s.includes("PENDING_REPORT") || s.includes("PENDING_EVIDENCE")) {
        setPageState("pending_evidence");
        setDetailMessage(
          fr
            ? "Rapport disponible. Vous pouvez joindre un export backtest (optionnel)."
            : "Report available. You can attach a backtest export (optional).",
        );
        return;
      }
      if (s.includes("AWAITING_SUBMISSION") || w === "NOT_DISPATCHED") {
        setPageState("delivering");
        setDetailMessage(
          fr
            ? "Paiement reçu. Préparation de l’audit sur vos données…"
            : "Payment received. Preparing the audit on your data…",
        );
        return;
      }
      setPageState("delivering");
      setDetailMessage(
        fr ? "Génération du rapport en cours…" : "Generating your report…",
      );
    },
    [fr],
  );

  const loadStatus = useCallback(
    async (checkoutSessionId: string, browserOwner: string) => {
      const response = await fetch(`${API_URL}/v1/orders/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_session_id: checkoutSessionId,
          owner_token: browserOwner,
        }),
      });
      const result = (await response.json()) as OrderStatus;
      if (!response.ok) return null;
      setStatus(result);
      return result;
    },
    [],
  );

  const runAutoDeliver = useCallback(
    async (orderId: string, checkoutSessionId: string, browserOwner: string) => {
      try {
        const response = await fetch(
          `${API_URL}/v1/orders/${orderId}/auto-deliver`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkout_session_id: checkoutSessionId,
              owner_token: browserOwner,
            }),
          },
        );
        const result = (await response.json()) as AutoDeliverResponse;
        if (response.ok) {
          if (result.report_html) setApprovedReportHtml(result.report_html);
                    if (result.report_url) {
                      // report_url est relatif (/report/{id}) -> URL publique absolue.
                      setShareUrl(`https://www.stratverity.com${result.report_url}`);
                    }
          const delivery =
            result.delivery_status || result.status || "DELIVERED";
          mapDeliveryState(delivery, delivery);
        }
        return result;
      } catch {
        return null;
      }
    },
    [mapDeliveryState],
  );

  useEffect(() => {
    stoppedRef.current = false;
    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId =
      params.get("session_id") || params.get("checkout_session_id") || "";
    if (!checkoutSessionId) {
      setPageState("error");
      setMessageKey("success.msg.session");
      return;
    }
    setSessionId(checkoutSessionId);
    const stored =
      sessionStorage.getItem(`stratverity.order-owner:${checkoutSessionId}`) ||
      "";
    setOwnerToken(stored);
    if (!stored) {
      setPageState("error");
      setDetailMessage(
        fr
          ? "Session navigateur incomplète. Reprenez depuis /configure dans le même navigateur."
          : "Browser session incomplete. Restart from /configure in the same browser.",
      );
      return;
    }

    const tick = async () => {
      if (stoppedRef.current) return;
      pollRef.current += 1;
      setPollCount(pollRef.current);

      const order = await loadStatus(checkoutSessionId, stored);
      if (!order?.order_id) {
        setPageState("delivering");
        setDetailMessage(
          fr ? "Confirmation du paiement en cours…" : "Confirming payment…",
        );
      } else if (!isTerminalDelivered(order.order_status, order.delivery_status)) {
        await runAutoDeliver(order.order_id, checkoutSessionId, stored);
        const refreshed = await loadStatus(checkoutSessionId, stored);
        if (refreshed) {
          mapDeliveryState(
            refreshed.order_status,
            refreshed.delivery_status,
            refreshed.worker_status,
          );
        }
      } else {
        mapDeliveryState(
          order.order_status,
          order.delivery_status,
          order.worker_status,
        );
      }

      const latest = await loadStatus(checkoutSessionId, stored);
      const done =
        latest &&
        isTerminalDelivered(latest.order_status, latest.delivery_status);

      if (done) {
        stoppedRef.current = true;
        return;
      }

      if (pollRef.current >= MAX_POLLS) {
        stoppedRef.current = true;
        setPageState("stuck");
        setDetailMessage(
          fr
            ? "La génération prend plus de temps que prévu. Votre paiement est enregistré — réessayez ou contactez le support avec l’ID de commande."
            : "Generation is taking longer than expected. Your payment is recorded — retry or contact support with your order ID.",
        );
        return;
      }

      window.setTimeout(() => void tick(), POLL_MS);
    };

    void tick();
    return () => {
      stoppedRef.current = true;
    };
  }, [fr, loadStatus, mapDeliveryState, runAutoDeliver]);

  const onEvidenceChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setEvidence(file);
  };

  const uploadEvidence = async (event: FormEvent) => {
    event.preventDefault();
    if (!status?.order_id || !evidence || !sessionId || !ownerToken) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("checkout_session_id", sessionId);
      body.set("owner_token", ownerToken);
      body.set("artifact_role", "BACKTEST_EVIDENCE");
      body.set("file", evidence);
      if (status.strategies[0]?.strategy_version_id) {
        body.set(
          "strategy_version_id",
          status.strategies[0].strategy_version_id,
        );
      }
      const response = await fetch(
        `${API_URL}/v1/orders/${status.order_id}/submissions`,
        { method: "POST", body },
      );
      if (!response.ok) {
        setPageState("error");
        setDetailMessage(
          fr ? "Échec de l’envoi de l’export." : "Evidence upload failed.",
        );
        setUploading(false);
        return;
      }
      setEvidence(null);
      setPageState("delivering");
      await runAutoDeliver(status.order_id, sessionId, ownerToken);
    } catch {
      setPageState("error");
      setDetailMessage(fr ? "Erreur réseau." : "Network error.");
    } finally {
      setUploading(false);
    }
  };

  const retryDelivery = async () => {
    if (!status?.order_id || !ownerToken || !sessionId) return;
    pollRef.current = 0;
    stoppedRef.current = false;
    setPageState("delivering");
    setDetailMessage(
      fr ? "Nouvelle tentative de génération…" : "Retrying generation…",
    );
    await runAutoDeliver(status.order_id, sessionId, ownerToken);
    const refreshed = await loadStatus(sessionId, ownerToken);
    if (refreshed) {
      mapDeliveryState(
        refreshed.order_status,
        refreshed.delivery_status,
        refreshed.worker_status,
      );
    }
  };

  const copyShare = async () => {
      // JAMAIS window.location.href (peut contenir session_id Stripe). Seul un
      // shareUrl public (/report/{id}) est copiable.
      if (!shareUrl) return;
      try {
              await navigator.clipboard.writeText(shareUrl);
              setDetailMessage(fr ? "Lien copié." : "Link copied.");
            } catch {
              setDetailMessage(fr ? "Impossible de copier." : "Could not copy.");
            }
          };

  const activeStep = stepIndex(pageState);
  const steps: { id: StepId; label: string }[] = [
    { id: "paid", label: fr ? "Paiement" : "Payment" },
    { id: "pipeline", label: fr ? "Audit" : "Audit" },
    { id: "report", label: fr ? "Rapport" : "Report" },
  ];

  const title =
    pageState === "delivered"
      ? fr
        ? "Rapport prêt"
        : "Report ready"
      : pageState === "pending_evidence"
        ? fr
          ? "Presque terminé"
          : "Almost done"
        : pageState === "stuck"
          ? fr
            ? "Toujours en cours"
            : "Still processing"
          : pageState === "error"
            ? fr
              ? "Un problème est survenu"
              : "Something went wrong"
            : fr
              ? "Préparation de votre audit"
              : "Preparing your audit";

  return (
    <main className={`${styles.page} ${styles.successPage}`}>
      <section className={styles.successHero}>
        <span className={styles.eyebrow}>{t("success.badge")}</span>
        <h1>{title}</h1>
        <p className={styles.successLead} aria-live="polite">
          {message}
        </p>

        <ol className={styles.successSteps} aria-label={fr ? "Progression" : "Progress"}>
          {steps.map((step, i) => {
            const n = i + 1;
            const done = activeStep > n || pageState === "delivered";
            const current = activeStep === n && pageState !== "delivered";
            return (
              <li
                key={step.id}
                className={
                  done
                    ? styles.successStepDone
                    : current
                      ? styles.successStepCurrent
                      : styles.successStepTodo
                }
              >
                <span className={styles.successStepDot} aria-hidden="true">
                  {done ? "✓" : n}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.successBody}>
        {status?.order_id ? (
          <div className={styles.orderProof} data-premium-surface>
            <dl>
              <div>
                <dt>{fr ? "Commande" : "Order"}</dt>
                <dd title={status.order_id}>{status.order_id.slice(0, 22)}…</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {pageState === "delivered"
                    ? "DELIVERED"
                    : pageState === "pending_evidence"
                      ? "PENDING_REPORT"
                      : status.order_status}
                </dd>
              </div>
              <div>
                <dt>Worker</dt>
                <dd>{status.worker_status || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {(pageState === "booting" || pageState === "delivering") && (
          <div className={styles.successWait} data-premium-surface>
            <div className={styles.successOrbit} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <h2>{fr ? "Analyse en cours" : "Analysis running"}</h2>
            <p>
              {fr
                ? "Nous confrontons votre stratégie aux données de marché. Cela peut prendre de quelques secondes à deux minutes selon le périmètre."
                : "We are running your strategy against market data. This can take a few seconds to about two minutes depending on scope."}
            </p>
            <div className={styles.successPulseBar} aria-hidden="true">
              <span style={{ width: `${Math.min(95, 12 + pollCount * 4)}%` }} />
            </div>
            <small>
              {fr
                ? `Étape ${Math.min(pollCount, MAX_POLLS)} / ${MAX_POLLS}`
                : `Step ${Math.min(pollCount, MAX_POLLS)} / ${MAX_POLLS}`}
            </small>
          </div>
        )}

        {pageState === "stuck" && (
          <div className={styles.successWait} data-premium-surface>
            <h2>{fr ? "Toujours en traitement" : "Still processing"}</h2>
            <p>{message}</p>
            <p>
              {fr
                ? "Votre carte a bien été débitée. Aucune action n’est requise de votre côté pour l’instant."
                : "Your card was charged successfully. No action is required from you right now."}
            </p>
            <button
              type="button"
              className={styles.checkoutButton}
              onClick={() => void retryDelivery()}
            >
              {fr ? "Relancer la génération" : "Retry generation"}
            </button>
          </div>
        )}

        {pageState === "pending_evidence" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{fr ? "Export backtest (optionnel)" : "Backtest export (optional)"}</h2>
            <p>
              {fr
                ? "Joignez un CSV / HTML TradingView pour enrichir la comparaison. Ce n’est pas un re-upload du code source."
                : "Attach a TradingView CSV / HTML to enrich the comparison. This is not a strategy source re-upload."}
            </p>
            <form onSubmit={uploadEvidence}>
              <label className={styles.filePicker}>
                <input
                  accept={BACKTEST_EVIDENCE_ACCEPT}
                  onChange={onEvidenceChosen}
                  type="file"
                />
                <strong>
                  {evidence
                    ? evidence.name
                    : fr
                      ? "Choisir un export"
                      : "Choose an export"}
                </strong>
              </label>
              <button disabled={uploading || !evidence} type="submit">
                {uploading
                  ? fr
                    ? "Envoi…"
                    : "Uploading…"
                  : fr
                    ? "Envoyer"
                    : "Upload"}
              </button>
            </form>
          </div>
        )}

        {pageState === "delivered" && (
          <div className={styles.orderUpload} data-premium-surface>
                      <h2>{fr ? "Votre rapport" : "Your report"}</h2>
                      {shareUrl ? (
                        <>
                          <p>
                            {fr
                              ? "Partagez le rapport public vérifié."
                              : "Share the verified public report."}
                          </p>
                          <div className={styles.successShareRow}>
                            <button type="button" onClick={() => void copyShare()}>
                              {fr ? "Copier le lien" : "Copy link"}
                            </button>
                            <a
                              className={styles.checkoutButton}
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                "StratVerity audit — proof, not storytelling",
                              )}&url=${encodeURIComponent(shareUrl)}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Share X
                            </a>
                            <a
                              className={styles.checkoutButton}
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Voir l’audit — ${shareUrl} — StratVerity`,
                              )}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </>
                      ) : (
                        <p>
                          {fr
                            ? "Disponible dès que le rapport public est prêt."
                            : "Available as soon as the public report is ready."}
                        </p>
                      )}
            {approvedReportHtml ? (
              <iframe
                className={styles.approvedReport}
                sandbox=""
                srcDoc={approvedReportHtml}
                title={fr ? "Rapport d’audit" : "Audit report"}
              />
            ) : (
              <p>
                {fr
                  ? "Statut livré. Si le rapport n’apparaît pas ici, utilisez le lien e-mail ou relancez."
                  : "Marked delivered. If the report is missing here, use the email link or retry."}
              </p>
            )}
          </div>
        )}

        {pageState === "error" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{fr ? "Incident" : "Issue"}</h2>
            <p>{message}</p>
            {status?.order_id && ownerToken ? (
              <button type="button" onClick={() => void retryDelivery()}>
                {fr ? "Réessayer" : "Retry"}
              </button>
            ) : null}
          </div>
        )}

        <p className={styles.successFoot}>
          <Link href="/configure">{t("success.back")}</Link>
          {" · "}
          <Link href="/contact">{fr ? "Support" : "Support"}</Link>
        </p>
        <p className={styles.disclaimer}>
          {fr
            ? "Un backtest (labo ou broker) ne garantit pas les performances futures. Les marchés évoluent ; l’audit valide la logique et le risque, pas un rendement."
            : "A backtest (lab or broker) does not guarantee future performance. Markets evolve; the audit validates logic and risk, not a return."}
        </p>
      </section>
    </main>
  );
}
