"use client";

import Link from "next/link";

/**
 * Error boundary GLOBAL (le plus haut niveau, Natif Next.js App Router).
 *
 * Encapsule le <html> entier : si un crash survient dans le layout, le
 * header global (SiteHeader), l'I18nProvider ou un enfant de la route, ce
 * composant remplace l'ensemble par une UI de secours. Il empêche qu'un
 * seule composant qui jette n'affiche une page totalement vide (le fond
 * animé "AmbientExperience" n'est plus le seul élément restant).
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" data-theme="light">
      <body style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <main
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: "var(--emerald-500)",
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            StratVerity · Erreur
          </span>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "12px 0 14px" }}>
            StratVerity a rencontré une erreur.
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 16, lineHeight: 1.6 }}>
            Une partie de la page n&rsquo;a pas pu être rendue. Aucun ordre de
            trading n&rsquo;a été émis et vos fichiers restent locaux.
          </p>
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: "var(--emerald-500)",
                color: "#06110d",
              }}
            >
              Réessayer
            </button>
            <Link
              href="/"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid var(--line-2)",
                color: "var(--ink-1)",
              }}
            >
              Retour à l&rsquo;accueil
            </Link>
          </div>
          {error.digest ? (
            <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 18 }}>
              Référence : {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}