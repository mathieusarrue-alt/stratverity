import type { Metadata } from "next";
import { isValidAuditHash } from "@/lib/crypto/audit-hasher";

export const metadata: Metadata = {
  title: "Verify audit proof | StratVerity",
  description:
    "Cryptographically verify the authenticity of a StratVerity audit proof by its SHA-256 hash — without exposing the author's source code.",
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const valid = isValidAuditHash(hash);

  return (
    <main
      style={{
        width: "min(760px, calc(100% - 32px))",
        margin: "0 auto",
        padding: "76px 0 110px",
      }}
    >
      <span
        style={{
          color: "var(--brand)",
          font: "700 12px/1 var(--mono)",
          letterSpacing: ".14em",
        }}
      >
        Vérification d&rsquo;audit
      </span>
      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(2rem, 5vw, 3.4rem)",
          letterSpacing: "-.04em",
          margin: "14px 0 12px",
        }}
      >
        {valid ? "Preuve d'audit vérifiée" : "Hash invalide"}
      </h1>

      <div
        style={{
          padding: "20px 24px",
          borderRadius: 14,
          border: `1px solid ${valid ? "#00FF9D" : "var(--danger-500)"}`,
          background: "var(--surface-2)",
          marginBottom: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--mono)",
            fontSize: 13,
            wordBreak: "break-all",
            color: "var(--ink-2)",
          }}
        >
          {hash}
        </p>
      </div>

      <p style={{ color: "var(--ink-2)", lineHeight: 1.7 }}>
        {valid
          ? "Ce hash SHA-256 est un digest scellé combinant le code source, l&rsquo;horodatage et les résultats de backtest. Sa présence confirme l&rsquo;intégrité du rapport sans jamais exposer le code de l&rsquo;auteur."
          : "Le hash fourni ne correspond pas à un format de preuve StratVerity valide (64 caractères hexadécimaux attendus)."}
      </p>

      <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6 }}>
        La vérification cryptographique complète s&rsquo;appuie sur le registre
        public StratVerity. Cette preuve ne constitue ni un conseil
        d&rsquo;investissement ni une promesse de rendement.
      </p>
    </main>
  );
}
