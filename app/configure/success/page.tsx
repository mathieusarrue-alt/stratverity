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
};

type OrderStatus = {
  payment_status: string;
  order_id: string | null;
  order_status: string;
  product: "AUDIT" | "SCAN";
  scope_fingerprint: string;
  strategies: StrategyStatus[];
  entitlement_status: "NOT_CREATED";
  worker_status: "NOT_DISPATCHED";
};

type PageState = "checking" | "pending" | "paid" | "ready" | "error";

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
      if (result.order_status === "READY_FOR_QUALIFICATION") {
        setPageState("ready");
        setMessage("Tous les codes achetés sont reçus et prêts pour qualification.");
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

  return (
    <main className={`${styles.page} ${styles.successPage}`}>
      <section className={styles.successCard}>
        <span>STRATVERITY · COMMANDE SÉCURISÉE</span>
        <h1>
          {pageState === "ready"
            ? "Dépôt prêt."
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

        {status?.order_id && pageState !== "ready" && (
          <form className={styles.orderUpload} onSubmit={submitArtifact}>
            <h2>Déposez les fichiers de la commande</h2>
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
            <button disabled={uploading || !artifact} type="submit">
              {uploading ? "Inspection…" : "Déposer sans exécuter"}
            </button>
            <p>
              La source doit correspondre à l’empreinte achetée. Les ZIP sont inspectés ;
              aucun code n’est exécuté sur le serveur public.
            </p>
          </form>
        )}

        <p>
          <strong>Aucun audit, scan ou worker n’est lancé depuis cette page.</strong>{" "}
          Aucun entitlement n’est créé ; la qualification et l’exécution isolée
          restent des étapes séparées.
        </p>
        <Link href="/configure">Retour au configurateur</Link>
      </section>
    </main>
  );
}
