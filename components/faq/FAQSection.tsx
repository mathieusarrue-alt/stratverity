import { faqEntries, faqJsonLdEntries } from "./faq-data";
import styles from "./FAQSection.module.css";

/**
 * FAQSection — accordéon FAQ avec schema.org JSON-LD (FAQPage) intégré.
 * Server component : rend des Rich Snippets pour les moteurs de recherche.
 * Natif anglais (canonique SEO). Affiché sur /faq et la page d'accueil.
 */

type Props = {
  entries?: typeof faqEntries;
  compact?: boolean;
};

function FaqList({ entries }: { entries: typeof faqEntries }) {
  return (
    <div className={styles.list}>
      {entries.map((e, i) => (
        <details className={styles.item} key={i} open={i === 0}>
          <summary>
            <span>{e.question}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <p>{e.answer}</p>
        </details>
      ))}
    </div>
  );
}

export default function FAQSection({ entries = faqEntries, compact = false }: Props) {
  const jsonLd = faqJsonLdEntries(entries);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className={styles.section} aria-labelledby="faq-heading">
        <div className={styles.head}>
          <span className={styles.eyebrow}>FAQ</span>
          <h2 id="faq-heading">Frequently asked questions</h2>
          {!compact ? (
            <p className={styles.lead}>
              Everything about backtest verification, Auto-Pilot security, and the
              Affiliate Program — answered directly.
            </p>
          ) : null}
        </div>
        <FaqList entries={entries} />
      </section>
    </>
  );
}