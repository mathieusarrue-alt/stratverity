import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "40px 24px",
      }}
    >
      <div>
        <p
          style={{
            font: "700 13px/1 var(--mono)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--brand)",
            margin: "0 0 12px",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            letterSpacing: "-0.04em",
            margin: "0 0 12px",
          }}
        >
          Cette page n&rsquo;existe pas.
        </h1>
        <p
          style={{
            color: "var(--ink-2)",
            maxWidth: 460,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          Le lien est peut-être obsolète ou l&rsquo;adresse mal orthographiée.
          Retournez à l&rsquo;accueil ou testez gratuitement votre stratégie.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Accueil
          </Link>
          <Link href="/health-check" className="btn btn-ghost">
            Health-check gratuit
          </Link>
        </div>
      </div>
    </main>
  );
}