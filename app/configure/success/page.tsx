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

/** Post-paid: BACKTEST_EVIDENCE only. Never re-upload STRATEGY_SOURCE. */
const BACKTEST_EVIDENCE_ACCEPT = ".csv,.html,.json,.txt,.zip";

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
  | "checking"
  | "delivering"
  | "delivered"
  | "pending_evidence"
  | "paid_waiting"
  | "error";

export default function CheckoutReturnPage() {
  const { t, locale } = useI18n();
  const [pageState, setPageState] = useState<PageState>("checking");
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

  const mapDeliveryState = useCallback(
    (orderStatus: string, deliveryStatus?: string) => {
      const s = (deliveryStatus || orderStatus || "").toUpperCase();
      if (
        s === "DELIVERED" ||
        s === "REPORT_APPROVED" ||
        s.includes("DELIVERED")
      ) {
        setPageState("delivered");
        setMessageKey("success.deliveredBody");
        return;
      }
      if (
        s === "AVAILABLE_PENDING_REPORT" ||
        s.includes("PENDING_REPORT") ||
        s.includes("PENDING_EVIDENCE")
      ) {
        setPageState("pending_evidence");
        setDetailMessage(
          locale === "fr"
            ? "Paiement reçu. Rapport disponible ; export backtest optionnel pour enrichir la comparaison."
            : "Payment received. Report available; optional backtest export can enrich the comparison.",
        );
        return;
      }
      if (
        s.includes("PAID") ||
        s.includes("PROVISION") ||
        s === "STATIC_QUALIFIED_AWAITING_APPROVAL"
      ) {
        setPageState("paid_waiting");
        setDetailMessage(
          locale === "fr"
            ? "Paiement confirmé. Préparation du rapport…"
            : "Payment confirmed. Preparing your report…",
        );
        return;
      }
      setPageState("paid_waiting");
    },
    [locale],
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
      const result = (await response.json()) as OrderStatus & {
        detail?: { message?: string } | string;
      };
      if (!response.ok) {
        setPageState("error");
        setDetailMessage(
          typeof result.detail === "object"
            ? result.detail?.message || t("success.msg.confirmUnavailable")
            : t("success.msg.confirmUnavailable"),
        );
        return null;
      }
      setStatus(result);
      return result;
    },
    [t],
  );

  const runAutoDeliver = useCallback(
    async (orderId: string, checkoutSessionId: string, browserOwner: string) => {
      setPageState("delivering");
      setDetailMessage(
        locale === "fr"
          ? "Génération automatique du rapport…"
          : "Generating your report automatically…",
      );
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
        if (!response.ok) {
          const refreshed = await loadStatus(checkoutSessionId, browserOwner);
          if (refreshed) {
            mapDeliveryState(
              refreshed.order_status,
              refreshed.delivery_status,
            );
          } else {
            setPageState("error");
            const err =
              typeof result.detail === "object"
                ? result.detail?.message
                : result.message;
            setDetailMessage(
              err ||
                (locale === "fr"
                  ? "Livraison auto indisponible pour le moment (backend pas encore déployé ou erreur)."
                  : "Auto-delivery unavailable (backend not deployed yet or error)."),
            );
          }
          return;
        }

        if (result.report_html) setApprovedReportHtml(result.report_html);
        if (result.report_url) setShareUrl(result.report_url);

        const delivery =
          result.delivery_status || result.status || "DELIVERED";
        mapDeliveryState(delivery, delivery);

        const refreshed = await loadStatus(checkoutSessionId, browserOwner);
        if (refreshed) {
          mapDeliveryState(refreshed.order_status, refreshed.delivery_status);
        }
      } catch {
        setPageState("error");
        setDetailMessage(
          locale === "fr"
            ? "Erreur réseau pendant la livraison auto."
            : "Network error during auto-delivery.",
        );
      }
    },
    [loadStatus, locale, mapDeliveryState],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId =
      params.get("session_id") ||
      params.get("checkout_session_id") ||
      "";
    if (!checkoutSessionId) {
      setPageState("error");
      setMessageKey("success.msg.session");
      return;
    }
    setSessionId(checkoutSessionId);
    const stored =
      sessionStorage.getItem(
        `stratverity.order-owner:${checkoutSessionId}`,
      ) || "";
    setOwnerToken(stored);
    if (!stored) {
      setPageState("error");
      setDetailMessage(
        locale === "fr"
          ? "Jeton propriétaire introuvable. Reprenez depuis /configure dans le même navigateur."
          : "Owner token missing. Restart from /configure in the same browser.",
      );
      return;
    }

    void (async () => {
      const order = await loadStatus(checkoutSessionId, stored);
      if (!order?.order_id) {
        setPageState("paid_waiting");
        setDetailMessage(
          locale === "fr"
            ? "Paiement en cours de confirmation…"
            : "Confirming payment…",
        );
        return;
      }
      const s = (order.order_status || "").toUpperCase();
      if (s === "DELIVERED" || order.delivery_status === "DELIVERED") {
        mapDeliveryState(order.order_status, order.delivery_status);
        return;
      }
      await runAutoDeliver(order.order_id, checkoutSessionId, stored);
    })();
  }, [loadStatus, locale, mapDeliveryState, runAutoDeliver]);

  const onEvidenceChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setEvidence(file);
  };

  const uploadEvidence = async (event: FormEvent) => {
    event.preventDefault();
    if (!status?.order_id || !evidence || !sessionId || !ownerToken) return;
    setUploading(true);
    setDetailMessage(
      locale === "fr" ? "Envoi de l’export backtest…" : "Uploading backtest export…",
    );
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
        const raw = await response.text();
        setPageState("error");
        setDetailMessage(
          locale === "fr"
            ? `Échec envoi evidence (${raw.slice(0, 180)})`
            : `Evidence upload failed (${raw.slice(0, 180)})`,
        );
        setUploading(false);
        return;
      }
      setEvidence(null);
      await runAutoDeliver(status.order_id, sessionId, ownerToken);
    } catch {
      setPageState("error");
      setDetailMessage(
        locale === "fr"
          ? "Erreur réseau pendant l’upload evidence."
          : "Network error uploading evidence.",
      );
    } finally {
      setUploading(false);
    }
  };

  const copyShare = async () => {
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setDetailMessage(locale === "fr" ? "Lien copié." : "Link copied.");
    } catch {
      setDetailMessage(url);
    }
  };

  const title =
    pageState === "delivered"
      ? locale === "fr"
        ? "Rapport prêt"
        : "Report ready"
      : pageState === "pending_evidence"
        ? locale === "fr"
          ? "Presque prêt"
          : "Almost ready"
        : t("success.title.paid");

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>{t("success.badge")}</span>
          <h1>{title}</h1>
          <p aria-live="polite">{message}</p>
        </div>
      </section>

      <section className={styles.workspace}>
        {status?.order_id && (
          <div className={styles.orderProof} data-premium-surface>
            <dl>
              <div>
                <dt>Order</dt>
                <dd>{status.order_id.slice(0, 26)}…</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {pageState === "delivered"
                    ? "DELIVERED"
                    : pageState === "pending_evidence"
                      ? "AVAILABLE_PENDING_REPORT"
                      : status.order_status}
                </dd>
              </div>
              <div>
                <dt>Worker</dt>
                <dd>{status.worker_status || "—"}</dd>
              </div>
            </dl>
          </div>
        )}

        {(pageState === "checking" ||
          pageState === "delivering" ||
          pageState === "paid_waiting") && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{locale === "fr" ? "Traitement en cours" : "Processing"}</h2>
            <p>
              {locale === "fr"
                ? "Aucune action requise. Le rapport se génère automatiquement après paiement — pas de re-upload du code source."
                : "No action required. Your report generates automatically after payment — no strategy source re-upload."}
            </p>
          </div>
        )}

        {pageState === "pending_evidence" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>
              {locale === "fr"
                ? "Export backtest optionnel"
                : "Optional backtest export"}
            </h2>
            <p>
              {locale === "fr"
                ? "Joignez votre export TradingView / CSV pour enrichir la comparaison. Ce n’est pas un re-upload du code source."
                : "Attach your TradingView / CSV export to enrich the comparison. This is not a strategy source re-upload."}
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
                    : locale === "fr"
                      ? "Choisir un export (.csv, .html, .json…)"
                      : "Choose export (.csv, .html, .json…)"}
                </strong>
              </label>
              <button disabled={uploading || !evidence} type="submit">
                {uploading
                  ? locale === "fr"
                    ? "Envoi…"
                    : "Uploading…"
                  : locale === "fr"
                    ? "Envoyer l’evidence et relancer"
                    : "Upload evidence and retry"}
              </button>
            </form>
            <button
              type="button"
              disabled={!status?.order_id || !ownerToken}
              onClick={() =>
                status?.order_id &&
                void runAutoDeliver(status.order_id, sessionId, ownerToken)
              }
            >
              {locale === "fr"
                ? "Relancer la livraison sans evidence"
                : "Retry delivery without evidence"}
            </button>
          </div>
        )}

        {pageState === "delivered" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{t("success.deliveredTitle")}</h2>
            <p>
              {locale === "fr"
                ? "Copie email si l’adresse a été collectée au checkout. Partage ci-dessous."
                : "Email copy if an address was collected at checkout. Share below."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => void copyShare()}>
                {locale === "fr" ? "Copier le lien" : "Copy link"}
              </button>
              <a
                className={styles.checkoutButton}
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  "StratVerity audit — proof, not storytelling",
                )}&url=${encodeURIComponent(
                  shareUrl ||
                    (typeof window !== "undefined"
                      ? window.location.href
                      : "https://www.stratverity.com"),
                )}`}
                rel="noreferrer"
                target="_blank"
              >
                Share X
              </a>
              <a
                className={styles.checkoutButton}
                href={`https://wa.me/?text=${encodeURIComponent(
                  (shareUrl ||
                    (typeof window !== "undefined"
                      ? window.location.href
                      : "https://www.stratverity.com")) + " — StratVerity",
                )}`}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </div>
            {approvedReportHtml ? (
              <iframe
                className={styles.approvedReport}
                sandbox=""
                srcDoc={approvedReportHtml}
                title={locale === "fr" ? "Rapport d’audit" : "Audit report"}
              />
            ) : (
              <p>
                {locale === "fr"
                  ? "Statut DELIVERED. Si le HTML n’apparaît pas, utilisez le lien email ou réessayez."
                  : "Status DELIVERED. If HTML is missing, use the email link or retry."}
              </p>
            )}
          </div>
        )}

        {pageState === "error" && (
          <div className={styles.orderUpload} data-premium-surface>
            <h2>{locale === "fr" ? "Incident" : "Issue"}</h2>
            <p>{message}</p>
            {status?.order_id && ownerToken ? (
              <button
                type="button"
                onClick={() =>
                  void runAutoDeliver(status.order_id!, sessionId, ownerToken)
                }
              >
                {locale === "fr" ? "Réessayer la livraison" : "Retry delivery"}
              </button>
            ) : null}
          </div>
        )}

        <p>
          <strong>
            {locale === "fr"
              ? "Zéro revue humaine sur le chemin client."
              : "Zero human review on the client path."}
          </strong>{" "}
          {locale === "fr"
            ? "La livraison est automatique dès que le paiement et le token propriétaire sont valides."
            : "Delivery runs automatically once payment and owner token are valid."}
        </p>
        <Link href="/configure">{t("success.back")}</Link>
      </section>
    </main>
  );
}
