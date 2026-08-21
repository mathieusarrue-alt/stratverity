"use client";

import Link from "next/link";

/**
 * Error boundary racine (route-level, Natif Next.js App Router).
 *
 * Si un composant client jette une exception lors du rendu ou d'un clic,
 * Next.js achemine l'erreur ici au lieu de vider la page. L'utilisateur
 * voit un écran de secours avec une action "Réessayer" et des liens sûrs,
 * jamais un écran blanc.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "60vh",
        maxWidth: 560,
        margin: "10vh auto",
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
        Un instant, le rendu a été interrompu.
      </h1>
      <p style={{ color: "var(--ink-2)", fontSize: 16, lineHeight: 1.6 }}>
        La page n&rsquo;a pas pu s&rsquo;afficher complètement. Vos données et vos
        stratégies restent locales et inchangées.
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
  );
}