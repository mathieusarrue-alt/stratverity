"use client";

import Link from "next/link";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
}

interface BlogListProps {
  articles: Article[];
}

/** Grille d'articles — thème StratVerity (vars --accent, --bg). */
export default function BlogList({ articles }: BlogListProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--foreground, #e8edf7)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 800, marginBottom: 12 }}>
            Blog StratVerity
          </h1>
          <p style={{ fontSize: 18, color: "var(--muted)" }}>
            Éducation, audits, et insights sur le trading algorithmique
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{
                display: "block",
                background: "var(--card, #121826)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: 24,
                textDecoration: "none",
                color: "inherit",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </time>
                <span>•</span>
                <span>{article.readingTime}</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                {article.title}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>
                {article.excerpt}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "3px 10px",
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      color: "var(--accent)",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: 14 }}>
                Lire l'article →
              </div>
            </Link>
          ))}
        </div>

        {articles.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "64px 0" }}>
            Aucun article publié pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}