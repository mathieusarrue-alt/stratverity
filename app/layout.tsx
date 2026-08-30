import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_KR,
  Noto_Sans_SC,
} from "next/font/google";
import { headers } from "next/headers";
import SiteHeader from "./components/SiteHeader";
import AmbientExperience from "./components/AmbientExperience";
import ChatwootWidget from "./components/ChatwootWidget";
import BackToTop from "./components/BackToTop";
import { I18nErrorBoundary } from "./components/I18nErrorBoundary";
import { I18nProvider } from "./i18n/I18nProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display-loaded",
  subsets: ["latin"],
});
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: "variable",
});
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: "variable",
});
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: "variable",
});
const notoSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  preload: false,
  weight: "variable",
});
const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  preload: false,
  weight: "variable",
});

const themeBootstrap = `(() => {
  let theme = "light";
  try {
    const stored = localStorage.getItem("sv-theme");
    theme = stored === "light" || stored === "dark" ? stored : "light";
  } catch {
    theme = "light";
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.dataset.stratverityTheme = "true";
  meta.content = theme === "dark" ? "#06110d" : "#f6f3ec";
  document.head.append(meta);
})();`;

const PUBLIC_SITE_URL = "https://www.stratverity.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${PUBLIC_SITE_URL}/#organization`,
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${PUBLIC_SITE_URL}/icon-512.png`,
  },
  image: `${PUBLIC_SITE_URL}/og.png`,
  description:
    "Independent, evidence-based audits for supported algorithmic trading strategies.",
  email: "stratverity@gmail.com",
  brand: {
    "@type": "Brand",
    name: "StratVerity",
  },
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${PUBLIC_SITE_URL}/#website`,
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  publisher: { "@id": `${PUBLIC_SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${PUBLIC_SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StratVerity",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: PUBLIC_SITE_URL,
  description:
    "Independent backtest audit platform that recomputes metrics for supported strategies and ties every reported result to its evidence.",
  offers: [
    {
      "@type": "Offer",
      name: "Essential audit",
      price: "19.00",
      priceCurrency: "EUR",
      description:
        "One supported strategy, one asset, one timeframe, and two years of history.",
    },
    {
      "@type": "Offer",
      name: "Premium audit",
      price: "49.00",
      priceCurrency: "EUR",
      description:
        "One supported strategy and context, with eight years of history and deeper evidence.",
    },
    {
      "@type": "Offer",
      name: "Custom audit",
      price: "79.00",
      priceCurrency: "EUR",
      description:
        "Multi-context audit starting at 79 EUR, configured from an explicit scope.",
    },
  ],
  featureList: [
    "Look-ahead bias detection",
    "Overfitting & curve-fitting audit",
    "Robustness Score computation",
    "Verified Backtest Badge (SVG, SHA256-sealed)",
    "Static code health checks for Pine Script, Python and MQL",
    "Isolated replay for compatible Python strategies",
  ],
  aggregateRating: undefined,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does StratVerity audit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "StratVerity currently delivers evidence-based paid audits for supported Python strategies. Its free tools can statically screen Pine Script, Python and MQL code without presenting that diagnostic as a certified backtest.",
      },
    },
    {
      "@type": "Question",
      name: "How is my strategy code handled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free code checks are static. A compatible paid Python strategy may be replayed only inside an isolated, network-disabled container against catalogue data. StratVerity never places live orders from customer code.",
      },
    },
    {
      "@type": "Question",
      name: "Which biases can the audit detect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Depending on the compatible strategy and selected audit scope, the report can flag look-ahead patterns, omitted costs, overfitting risks and robustness issues. Every performed check and limitation is stated in the report.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a strategy audit cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Essential audit costs 19 EUR, the single-context Premium audit costs 49 EUR, and explicit multi-context Custom audits start at 79 EUR. The configurator shows the exact scope and price before checkout.",
      },
    },
  ],
};

const professionalServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  email: "stratverity@gmail.com",
  image: `${PUBLIC_SITE_URL}/og.png`,
  priceRange: "€19 - €79+",
  areaServed: "Worldwide",
  description:
    "Independent backtest audit service for compatible algorithmic trading strategies.",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim();
  const directHost = requestHeaders.get("host")?.trim();
  const candidateHost = forwardedHost || directHost || "www.stratverity.com";
  const normalizedHost =
    candidateHost === "stratverity.com" ? "www.stratverity.com" : candidateHost;
  const host = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(normalizedHost)
    ? normalizedHost
    : "www.stratverity.com";
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
  const baseUrl = `${protocol}://${host}`;
  const socialImage = `${baseUrl}/og.png`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "StratVerity — Trading Strategy Audit & Free Health Check",
      template: "%s | StratVerity",
    },
    description:
      "Free static strategy health checks and evidence-based paid audits for supported Python strategies. No profit promises, no live-order execution.",
    applicationName: "StratVerity",
    keywords: [
      "backtest audit",
      "backtest verification service",
      "verify backtest results",
      "trading strategy audit",
      "strategy audit before going live",
      "Pine Script audit",
      "TradingView Pine Script backtest audit",
      "Python trading strategy audit",
      "algorithmic trading strategy validation",
      "look-ahead bias detection",
      "look-ahead bias checker",
      "overfitting detection",
      "curve-fitting detection",
      "walk-forward validation",
      "backtest proof",
      "strategy robustness",
      "StratVerity",
      "health check gratuit",
      "scanner pine script gratuit",
      "verifier code pine script",
      "detecter lookahead bias",
      "MQL5 static code analyzer free",
      "MQL4 code analyzer",
      "anti repaint verified",
      "repainting detection TradingView",
      "testeur de bug robot de trading",
    ],
    category: "finance",
    creator: "StratVerity",
    publisher: "StratVerity",
    verification: {
      google: "s06fNzpmUsWfWUm6YkD_4_VXyfLYLD8ppSLTUsxXf_0",
    },
    alternates: {
      canonical: "/",
      languages: {
        "x-default": "/",
        en: "/",
      },
    },
    icons: {
      // Prefer SVG (brand shield). Old favicon.ico / 96px PNG were near-empty (241B / 474B) → blank tab.
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.ico", sizes: "48x48" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#f1eee5" },
      { media: "(prefers-color-scheme: dark)", color: "#07110d" },
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title:
        "StratVerity — Trading Strategy Audit & Free Health Check",
      description:
        "Free static code health checks and evidence-based audits for supported strategies, with explicit scope, costs and limitations.",
      type: "website",
      locale: "en_US",
      alternateLocale: [
        "fr_FR",
        "zh_CN",
        "hi_IN",
        "es_ES",
        "ar_SA",
        "pt_PT",
        "bn_BD",
        "de_DE",
        "it_IT",
        "ru_RU",
        "ko_KR",
      ],
      url: baseUrl,
      siteName: "StratVerity",
      images: [
        {
          url: socialImage,
          width: 1672,
          height: 941,
          alt: "StratVerity — independent backtest audit and strategy verification platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        "StratVerity — Evidence-based Backtest Audit",
      description:
        "Independent audits for supported strategies. Recomputed metrics, explicit limitations, and no promise of future performance.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM Information"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(professionalServiceJsonLd),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} ${display.variable} ${notoArabic.variable} ${notoBengali.variable} ${notoDevanagari.variable} ${notoSc.variable} ${notoKr.variable}`}
      >
        <AmbientExperience />
        <I18nErrorBoundary>
          <I18nProvider>
            <SiteHeader />
            <div className="app-content">{children}</div>
          </I18nProvider>
        </I18nErrorBoundary>
        <ChatwootWidget />
        <BackToTop />
      </body>
    </html>
  );
}
