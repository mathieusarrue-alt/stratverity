// Données FAQ StratVerity — nativement en anglais (canonique SEO).
// Couvrent : backtest verification/look-ahead, Auto-Pilot & API security,
// Affiliate program, certification, pricing, code confidentiality.

export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: "How does StratVerity verify a backtest and avoid look-ahead bias?",
    answer:
      "StratVerity recomputes every declared metric out-of-sample using a 70/30 walk-forward split, replays trades on real candles, and compares the declared result against the recomputed one. Look-ahead bias (information used before bar close), missing fees, and single-window curve-fitting are flagged as divergences between what you claimed and what the data actually supports.",
  },
  {
    question: "What is the difference between the free Health-Check and a full audit?",
    answer:
      "The free Health-Check is an instant static scan of your source code that returns a 0–100 health score and likely issues in seconds. A full audit recomputes your metrics from raw trades, detects look-ahead and overfitting, and issues an evidence-linked report sealed by a robustness score.",
  },
  {
    question: "How is the robustness score calculated?",
    answer:
      "The 0–100 robustness score weights out-of-sample stability (40%), net Profit Factor above 1.5 (30%), drawdown below 20% (20%), and trade count above 100 (10%). A green 'Verified by StratVerity' badge is only issued when the engine verdict is CERTIFIED (score ≥ 70).",
  },
  {
    question: "Does StratVerity execute trades or hold my funds (Auto-Pilot)?",
    answer:
      "No. Auto-Pilot is strictly non-custodial and technical-only: it executes predefined strategy actions through restricted, read-scoped API keys you control. StratVerity never holds client funds and provides no investment advice, in accordance with Article 4.2 of our terms.",
  },
  {
    question: "How is API security handled for Auto-Pilot execution?",
    answer:
      "Auto-Pilot uses API keys with the minimum required scopes and no withdrawal permission. Keys are restricted to the specific exchange or broker account you authorize, and you can revoke access at any time. Execution is purely technical — no discretionary advice is provided.",
  },
  {
    question: "Is my strategy source code shared, stored, or resold?",
    answer:
      "No. Your code powers read-only audit computation and is never published, resold, or executed with real orders. Analysis is static; operational files are deleted under our retention policy, and only fingerprints and order evidence are kept.",
  },
  {
    question: "How does the Affiliate Program and payout work?",
    answer:
      "Affiliates earn a commission on referred sales. High-ticket carts of $100 or more qualify for the elevated payout tier. Commissions are paid automatically through Stripe Connect once your account reaches the payout threshold, with no manual approval step.",
  },
  {
    question: "What does backtest certification actually guarantee?",
    answer:
      "Certification attests that the declared metrics were recomputed and sealed by an independent third party, with bias detection. It guarantees neither future returns nor the absence of loss. Every badge is tied to an immutable SHA-256 hash of the audited code.",
  },
  {
    question: "How much does an audit cost and how do subscriptions work?",
    answer:
      "The audit is a one-time payment (European 49 euro crash-test, or 14.99 EUR Essential / 39 EUR Standard), with no auto-renewal. The recurring Live Scan is invitation-only during beta and can never be charged without your explicit validation. Access to a delivered report is proof-based and tied to your order.",
  },
  {
    question: "Which formats can I submit for an audit?",
    answer:
      "Pine Script, Python scripts, Jupyter notebooks, or a compatible project folder. You can also provide your exported trade list. MQL4 and MQL5 sources are supported for the crash-test and marketplace verification flows.",
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