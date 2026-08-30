// Données FAQ StratVerity — nativement en anglais (canonique SEO).
// Couvrent uniquement les capacités publiquement défendables : périmètre
// compatible, isolation, preuves, livraison et tarification launch-v0.3.

export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: "How does StratVerity verify a backtest and avoid look-ahead bias?",
    answer:
      "For a compatible paid strategy, StratVerity replays the selected scope on catalogue data and reports the checks that were actually performed. The report can compare declared and recomputed metrics, costs and timing assumptions; it also states every unsupported or untested condition instead of silently treating it as verified.",
  },
  {
    question: "What is the difference between the free Health-Check and a full audit?",
    answer:
      "The free Health Check is a static source-code diagnostic. It can flag suspicious patterns but is not a backtest or certification. A paid audit is available only for compatible strategies and produces an evidence-linked report from the replayed scope.",
  },
  {
    question: "How is the robustness score calculated?",
    answer:
      "The report identifies the inputs, checks and limits behind every displayed score. StratVerity does not publish a universal score as proof when the required data or test was not available, and a score never guarantees future performance.",
  },
  {
    question: "Does StratVerity execute live trades or hold my funds?",
    answer:
      "No. The current audit service replays compatible strategy code against catalogue data in an isolated environment. It does not connect the paid audit path to a brokerage account, place live orders, hold client funds or provide investment advice.",
  },
  {
    question: "Does the paid delivery depend on keeping my browser open?",
    answer:
      "No. Once Stripe confirms a compatible paid order, the server-side delivery pipeline processes it independently of the success page. The browser only displays status and the delivered report.",
  },
  {
    question: "Is my strategy source code shared, stored, or resold?",
    answer:
      "Your source is not published or sold. Free checks are static. Compatible paid Python code may be replayed inside a network-disabled isolated container, never with live orders. The applicable retention and evidence rules are stated in the terms and order scope.",
  },
  {
    question: "Is the marketplace or an affiliate programme active?",
    answer:
      "Not as a generally available production service unless the corresponding surface explicitly says it is enabled. Illustrative listings are not customer results, and no seller payout or affiliate commission should be assumed from a public preview.",
  },
  {
    question: "What does backtest certification actually guarantee?",
    answer:
      "A published StratVerity proof attests only the scope, inputs and checks listed in that report. It does not guarantee future returns or the absence of loss. A badge or fingerprint must link back to the corresponding public evidence to be independently checked.",
  },
  {
    question: "How much does an audit cost and how do subscriptions work?",
    answer:
      "Essential costs 19 EUR for one supported strategy, asset and timeframe. The single-context Premium audit costs 49 EUR. Explicit multi-context Custom audits start at 79 EUR. The configurator shows the exact one-time price and scope before Stripe Checkout.",
  },
  {
    question: "Which formats can I submit for an audit?",
    answer:
      "Paid audits currently accept only Python strategies that pass the compatibility gate. Pine Script, MQL and notebooks can receive a static diagnostic where offered, but they are not sold as replayed audits until their dedicated engine path and parity tests are validated.",
  },
];

export function faqJsonLdEntries(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}
