"use client";

/**
 * Global error boundary (replaces full <html> tree).
 * After a hard client crash, React handlers may be dead — use full page loads.
 */
export default function GlobalErrorBoundary({
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
              color: "#10b981",
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
          <p style={{ color: "#4b5563", fontSize: 16, lineHeight: 1.6 }}>
            Une partie de la page n&rsquo;a pas pu être rendue. Aucun ordre de
            trading n&rsquo;a été émis et vos fichiers restent locaux.
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
                background: "#10b981",
                color: "#06110d",
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid #d1d5db",
                color: "#111827",
              }}
            >
              Retour à l&rsquo;accueil
            </a>
          </div>
          {error.digest ? (
            <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 18 }}>
              Référence : {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
