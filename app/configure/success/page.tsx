"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "../scope-configurator.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://signals.13-39-177-70.sslip.io/backtestproof";

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
  const [pageState, setPageState] = useState<PageState>("checking");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [message, setMessage] = useState("Vérification du paiement signé par Stripe…");
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
        setMessage(
          "Brouillon d’audit calculé et scellé. Une revue humaine est obligatoire avant toute livraison.",
        );
      } else if (result.order_status === "READY_FOR_QUALIFICATION") {
        setPageState("ready");
        setMessage("Tous les codes achetés sont reçus et prêts pour qualification.");
      } else if (result.order_status === "STATIC_QUALIFIED_AWAITING_APPROVAL") {
        setPageState("qualified");
        setMessage(
          "Qualification statique terminée. La commande attend le contrôle final, sans exécution automatique.",
        );
      } else if (result.order_status === "HUMAN_REVIEW_REQUIRED") {
        setPageState("review");
        setMessage(
          "Qualification terminée. Une revue humaine est nécessaire avant la suite.",
        );
      } else if (result.order_status === "QUALIFICATION_BLOCKED") {
        setPageState("blocked");
        setMessage(
          "La source ne peut pas poursuivre automatiquement. Aucun worker n'a été lancé.",
        );
      } else if (result.order_id) {
        setPageState("paid");
        setMessage("Paiement confirmé. Votre commande attend maintenant ses fichiers.");
      } else {
        setPageState("pending");
        setMessage("Paiement reçu par Stripe. Le webhook est encore en rapprochement.");
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
        setMessage("Cette commande ne peut pas être ouverte depuis cette session navigateur.");
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
            setMessage("La confirmation sécurisée est indisponible pour le moment.");
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
    setMessage("Inspection et conservation de l’artefact…");
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
        if (!selected) throw new Error("Contexte acheté requis pour cette preuve.");
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
      setMessage(error instanceof Error ? error.message : "Le dépôt a échoué.");
    } finally {
      setUploading(false);
    }
  };

  const qualifyOrder = async () => {
    if (!status?.order_id || !sessionId || !ownerToken) return;
    setQualifying(true);
    setMessage("Qualification statique en cours, sans exécution du code…");
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
    } catch (error) {
      setPageState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "La qualification est temporairement indisponible.",
      );
    } finally {
      setQualifying(false);
    }
  };

  const generateAuditDraft = async () => {
    if (!status?.order_id || !sessionId || !ownerToken) return;
    setGeneratingDraft(true);
    setMessage("Recalcul des métriques et scellement du brouillon…");
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
    } catch (error) {
      setPageState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Le brouillon d’audit est temporairement indisponible.",
      );
    } finally {
      setGeneratingDraft(false);
    }
  };

  return (
    <main className={`${styles.page} ${styles.successPage}`}>
      <section className={styles.successCard}>
        <span>STRATVERITY · COMMANDE SÉCURISÉE</span>
        <h1>
          {pageState === "ready"
            ? "Dépôt prêt."
            : pageState === "draft"
              ? "Audit en revue."
            : pageState === "qualified"
              ? "Qualification validée."
              : pageState === "review"
                ? "Revue nécessaire."
                : pageState === "blocked"
                  ? "Qualification bloquée."
            : pageState === "paid"
              ? "Paiement confirmé."
              : "Confirmation en cours."}
        </h1>
        <p>{message}</p>

        {status?.order_id && (
          <div className={styles.orderProof}>
            <dl>
              <div>
                <dt>Commande</dt>
                <dd>{status.order_id.slice(0, 26)}…</dd>
              </div>
              <div>
                <dt>État</dt>
                <dd>{status.order_status}</dd>
              </div>
              <div>
                <dt>Exécution</dt>
                <dd>{status.worker_status}</dd>
              </div>
            </dl>
          </div>
        )}

        {status?.order_id && ["paid", "qualified", "error"].includes(pageState) && (
          <form className={styles.orderUpload} onSubmit={submitArtifact}>
            <h2>Déposez les fichiers de la commande</h2>
            {pageState === "qualified" && (
              <p>
                La source est qualifiée. Ajoutez maintenant les CSV TradingView
                contextualisés nécessaires au brouillon d’audit.
              </p>
            )}
            <label>
              Stratégie
              <select value={strategyId} onChange={(event) => setStrategyId(event.target.value)}>
                {status.strategies.map((strategy) => (
                  <option key={strategy.strategy_version_id} value={strategy.strategy_version_id}>
                    {strategy.strategy_version_id} {strategy.source_received ? "· source reçue" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type de fichier
              <select
                value={artifactRole}
                onChange={(event) =>
                  setArtifactRole(
                    event.target.value as "STRATEGY_SOURCE" | "BACKTEST_EVIDENCE",
                  )
                }
              >
                <option value="STRATEGY_SOURCE">Code de stratégie</option>
                <option value="BACKTEST_EVIDENCE">Backtest ou preuve complémentaire</option>
              </select>
            </label>
            <label>
              Fichier
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
                  Contexte acheté
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
                  Fuseau de l’export
                  <input value={sourceTimezone} onChange={(event) => setSourceTimezone(event.target.value)} required />
                </label>
                <label>
                  Capital initial
                  <input type="number" min="0.01" step="0.01" value={initialCapital} onChange={(event) => setInitialCapital(event.target.value)} required />
                </label>
                <label>
                  Devise
                  <input minLength={3} maxLength={10} value={currency} onChange={(event) => setCurrency(event.target.value)} required />
                </label>
                <label>
                  Commission (%)
                  <input type="number" min="0" max="100" step="0.001" value={commissionPercent} onChange={(event) => setCommissionPercent(event.target.value)} required />
                </label>
                <label>
                  Slippage (ticks)
                  <input type="number" min="0" step="1" value={slippageTicks} onChange={(event) => setSlippageTicks(event.target.value)} required />
                </label>
              </>
            )}
            <button disabled={uploading || !artifact} type="submit">
              {uploading ? "Inspection…" : "Déposer sans exécuter"}
            </button>
            <p>
              La source doit correspondre à l’empreinte achetée. Les ZIP sont inspectés ;
              aucun code n’est exécuté sur le serveur public.
            </p>
          </form>
        )}

        {status?.order_id && pageState === "ready" && (
          <div className={styles.orderUpload}>
            <h2>Qualifier les sources reçues</h2>
            <p>
              Cette étape inspecte uniquement la structure et la compatibilité.
              Aucun Pine, Python, notebook ou bot n&apos;est exécuté.
            </p>
            <button disabled={qualifying} type="button" onClick={qualifyOrder}>
              {qualifying ? "Qualification…" : "Lancer la qualification statique"}
            </button>
          </div>
        )}

        {status?.order_id && pageState === "qualified" && status.product === "AUDIT" && (
          <div className={styles.orderUpload}>
            <h2>Créer le brouillon d’audit</h2>
            <p>
              Un CSV TradingView contextualisé est requis pour chaque actif et unité de
              temps achetés. Les métriques sont recalculées sans exécuter le Pine.
            </p>
            <button disabled={generatingDraft} type="button" onClick={generateAuditDraft}>
              {generatingDraft ? "Calcul…" : "Calculer le brouillon vérifiable"}
            </button>
          </div>
        )}

        {status?.order_id && pageState === "draft" && (
          <div className={styles.orderUpload}>
            <h2>Revue humaine obligatoire</h2>
            <p>
              Le rapport est immuable et non livré. Nous vérifions les hypothèses, les
              limites et la cohérence des preuves avant de le rendre accessible.
            </p>
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
          <strong>Aucun audit, scan ou worker n’est lancé depuis cette page.</strong>{" "}
          Le brouillon recalcule uniquement les preuves déposées sans exécuter le
          code client ; aucun entitlement n’est créé et aucune livraison n’est automatique.
        </p>
        <Link href="/configure">Retour au configurateur</Link>
      </section>
    </main>
  );
}
