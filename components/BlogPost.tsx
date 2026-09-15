"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPostProps {
  title: string;
  date: string;
  readingTime: string;
  content: string;
  tags?: string[];
}

/** Layout d'article de blog — thème StratVerity (vars --accent, --bg). */
export default function BlogPost({
  title,
  date,
  readingTime,
  content,
  tags = [],
}: BlogPostProps) {
  return (
    <article style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--foreground, #e8edf7)" }}>
      <header style={{ borderBottom: "1px solid var(--line)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span>•</span>
            <span>{readingTime}</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
            {title}
          </h1>
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 12px",
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "48px 24px" }}>
        <div className="blog-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        <div
          style={{
            marginTop: 64,
            padding: 32,
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, #7c5cff 10%, transparent))",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            borderRadius: 16,
          }}
        >
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Prêt à auditer votre stratégie ?
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Découvrez les biais cachés dans vos backtests avec notre audit indépendant.
            Score 0-100, badge SHA-256 vérifiable, détection automatique des 5 biais principaux.
          </p>
          <a
            href="/audit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Lancer un audit gratuit →
          </a>
        </div>
      </div>
    </article>
  );
}