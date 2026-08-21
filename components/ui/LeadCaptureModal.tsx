"use client";

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * LeadCaptureModal — modale de capture d'email affichée après un outil gratuit
 * (Health-Check / Free Tools) pour échanger l'email contre le rapport PDF.
 *
 * Interface sombre, badge de confiance, validation dynamique de l'email.
 * Soumet à /api/leads/capture (webhook marketing n8n/Make).
 */
export type LeadCaptureModalProps = {
  open: boolean;
  tool: string;
  score?: number;
  onClose: () => void;
  onSubmitted?: (email: string) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LeadCaptureModal({
  open,
  tool,
  score,
  onClose,
  onSubmitted,
}: LeadCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!open) return null;

  const valid = EMAIL_RE.test(email.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setError("Adresse email invalide.");
      return;
    }
    setState("sending");
    setError("");
    try {
      const resp = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tool, score }),
      });
      if (!resp.ok) throw new Error("capture_failed");
      setState("done");
      onSubmitted?.(email.trim());
    } catch {
      setState("error");
      setError("Impossible d'enregistrer votre email. Réessayez.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recevoir le rapport d'audit"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        background: "rgba(4, 10, 8, 0.72)",
        backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(440px, 100%)",
          borderRadius: 18,
          background: "#0B0F19",
          border: "1px solid #1E293B",
          boxShadow: "0 24px 80px -20px rgba(0,0,0,0.6)",
          padding: "28px 26px",
          color: "#eaf3ee",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {state === "done" ? (
          <>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
            <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>
              Rapport envoyé !
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Votre rapport d&rsquo;audit PDF complet arrive par e-mail. Consultez
              votre boîte de réception (et vos spams).
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "#00FF9D",
                color: "#06110d",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: "#00FF9D",
                background: "rgba(0,255,157,0.12)",
                padding: "4px 10px",
                borderRadius: 999,
                marginBottom: 14,
              }}
            >
              🔒 Données de code 100% confidentielles
            </div>
            <h2 style={{ fontSize: 21, margin: "0 0 8px" }}>
              Recevez votre rapport d&rsquo;audit complet
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              {score !== undefined
                ? `Votre score de robustesse ${score}/100 est prêt. Laissez votre email pour recevoir le rapport PDF détaillé.`
                : "Laissez votre email pour recevoir le rapport PDF détaillé de votre diagnostic."}
            </p>
            <form onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #1E293B",
                  background: "#0F172A",
                  color: "#eaf3ee",
                  fontSize: 15,
                  marginBottom: 12,
                  outline: "none",
                }}
              />
              {error ? (
                <p style={{ color: "#EF4444", fontSize: 13, margin: "0 0 10px" }}>{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={state === "sending"}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#00FF9D",
                  color: "#06110d",
                  fontWeight: 700,
                  border: "none",
                  cursor: state === "sending" ? "wait" : "pointer",
                  opacity: state === "sending" ? 0.7 : 1,
                }}
              >
                {state === "sending" ? "Envoi en cours…" : "Recevoir mon rapport PDF"}
              </button>
            </form>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "block",
                margin: "14px auto 0",
                background: "none",
                border: "none",
                color: "#64748B",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Non merci
            </button>
          </>
        )}
      </div>
    </div>
  );
}
