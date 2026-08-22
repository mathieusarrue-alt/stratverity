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
  alternateName: ["Strat Verity", "Strat-Verity"],
  url: PUBLIC_SITE_URL,
  slogan: "De la preuve, pas du storytelling.",
  logo: {
    "@type": "ImageObject",
    url: `${PUBLIC_SITE_URL}/favicon.svg`,
  },
  image: `${PUBLIC_SITE_URL}/og.png`,
  description:
    "Independent strategy audit and validation for Pine Script and Python trading systems.",
  email: "contact@stratverity.com",
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
  alternateName: ["Strat Verity"],
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
    "Independent backtest audit platform that recomputes trading strategy metrics, detects look-ahead bias and overfitting, and ties results to the evidence for Pine Script and Python systems.",
  offers: [
    {
      "@type": "Offer",
      name: "Essential audit",
      price: "14.99",
      priceCurrency: "EUR",
      description: "Single strategy, single asset, single timeframe audit.",
    },
    {
      "@type": "Offer",
      name: "Standard audit",
      price: "39.00",
      priceCurrency: "EUR",
      description:
        "Full audit with recomputed metrics, bias detection, and evidence-linked report.",
    },
  ],
  featureList: [
    "Look-ahead bias detection",
    "Overfitting & curve-fitting audit",
    "Robustness Score computation",
    "Verified Backtest Badge (SVG, SHA256-sealed)",
    "Pine Script, MQL4/5 and Python strategy verification",
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
        text: "StratVerity audits trading strategies and backtests written in Pine Script or Python. It recomputes performance metrics, detects biases such as look-ahead and overfitting, and ties every result to the evidence in your code and data.",
      },
    },
    {
      "@type": "Question",
      name: "How is my strategy code handled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your code is analysed statically and is never executed with live orders. The audit pipeline recomputes declared metrics from your manifest, Pine code, and CSV export without running client code.",
      },
    },
    {
      "@type": "Question",
      name: "Which biases can the audit detect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The audit focuses on look-ahead bias, overfitting and curve-fitting, survivorship issues, and robustness problems. Walk-forward validation is used to separate a real edge from a curve-fit story.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a strategy audit cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Essential audit is 14.99 EUR for one strategy, asset, and timeframe. The Standard audit is 39 EUR and includes a full recomputation, bias detection, and an evidence-linked report.",
      },
    },
  ],
};

const professionalServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  email: "contact@stratverity.com",
  image: `${PUBLIC_SITE_URL}/og.png`,
  priceRange: "€14.99 - €149",
  areaServed: "Worldwide",
  description:
    "Independent backtest audit and strategy verification service for Pine Script and Python trading systems.",
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
      "StratVerity (also searched as \"Strat Verity\") — free trading strategy health check, look-ahead bias detection, Pine Script, Python and MQL audits, plus 24/7 Auto-Pilot execution.",
    applicationName: "StratVerity",
    openGraph: {
      type: "website",
      url: new URL("/", baseUrl),
      siteName: "StratVerity",
      title: "StratVerity — Trading Strategy Audit & Free Health Check",
      description:
        "Free trading strategy health check, look-ahead bias detection, Pine Script, Python and MQL audits, plus 24/7 Auto-Pilot execution.",
      images: [
        {
          url: new URL("/og.png", baseUrl),
          width: 1200,
          height: 630,
          alt: "StratVerity — Trading Strategy Audit & Free Health Check",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "StratVerity — Trading Strategy Audit & Free Health Check",
      description:
        "Free trading strategy health check, look-ahead bias detection, Pine Script, Python and MQL audits, plus 24/7 Auto-Pilot execution.",
      images: [new URL("/og.png", baseUrl)],
    },
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
      "StrategyQuant X import",
      "anti repaint verified",
      "repainting detection TradingView",
      "auto pilot MT5",
      "deploiement EA MT5 automatique",
      "execution automatique EA",
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
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
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
        "StratVerity — Trading Strategy Audit, Free Health Check & Auto-Pilot",
      description:
        "Free strategy code health check, look-ahead and repainting detection, Pine Script, Python, MQL and StrategyQuant X audits, plus optional 24/7 Auto-Pilot execution.",
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
        "StratVerity — Backtest Audit & Strategy Verification for Pine Script & Python",
      description:
        "Independent, evidence-based audit of Pine and Python strategies. Detect look-ahead bias and overfitting before you trade.",
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
