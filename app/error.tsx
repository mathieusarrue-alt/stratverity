"use client";

/**
 * Route-level error boundary (App Router).
 * Recovery must NOT rely only on React reset()/Link: after a hard client crash,
 * event handlers can be dead. Prefer full navigation.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hardRetry = () => {
    try {
      reset();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const goHome = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/");
      return;
    }
  };

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
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 24,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={hardRetry}
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
        <button
          type="button"
          onClick={goHome}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            border: "1px solid var(--line-2)",
            background: "transparent",
            color: "var(--ink-1)",
          }}
        >
          Retour à l&rsquo;accueil
        </button>
        <a
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
          Accueil (lien direct)
        </a>
      </div>
      {error.digest ? (
        <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 18 }}>
          Référence : {error.digest}
        </p>
      ) : null}
    </main>
  );
}
