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

const display = Fraunces({ variable: "--font-display-loaded", subsets: ["latin"] });
const notoArabic = Noto_Sans_Arabic({ variable: "--font-noto-arabic", subsets: ["arabic"], weight: "variable" });
const notoBengali = Noto_Sans_Bengali({ variable: "--font-noto-bengali", subsets: ["bengali"], weight: "variable" });
const notoDevanagari = Noto_Sans_Devanagari({ variable: "--font-noto-devanagari", subsets: ["devanagari"], weight: "variable" });
const notoSc = Noto_Sans_SC({ variable: "--font-noto-sc", preload: false, weight: "variable" });
const notoKr = Noto_Sans_KR({ variable: "--font-noto-kr", preload: false, weight: "variable" });

const themeBootstrap = `(() => {
  let theme = "light";
  try {
    const stored = localStorage.getItem("sv-theme");
    theme = stored === "light" || stored === "dark"
      ? stored
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  logo: `${PUBLIC_SITE_URL}/favicon.svg`,
  description:
    "Independent strategy audit and validation for Pine Script and Python trading systems.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "StratVerity",
  url: PUBLIC_SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${PUBLIC_SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const directHost = requestHeaders.get("host")?.trim();
  const candidateHost = forwardedHost || directHost || "www.stratverity.com";
  const normalizedHost = candidateHost === "stratverity.com" ? "www.stratverity.com" : candidateHost;
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
    title: "StratVerity — Independent strategy audit for trading systems",
    description:
      "Audit Pine Script and Python trading strategies with evidence-based metrics, bias detection, and walk-forward validation.",
    applicationName: "StratVerity",
    verification: {
      google: "s06fNzpmUsWfWUm6YkD_4_VXyfLYLD8ppSLTUsxXf_0",
    },
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    },
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
      title: "StratVerity — Independent strategy audit for trading systems",
      description:
        "Verify your backtest with evidence, not storytelling. Expose look-ahead bias, overfitting, and robustness issues before you trust a strategy.",
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: "StratVerity",
      images: [{ url: socialImage, width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "StratVerity — Independent strategy audit for trading systems",
      description:
        "Independent, evidence-based audit of Pine and Python strategies.",
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
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} ${display.variable} ${notoArabic.variable} ${notoBengali.variable} ${notoDevanagari.variable} ${notoSc.variable} ${notoKr.variable}`}>
        <AmbientExperience />
        <I18nProvider>
          <SiteHeader />
          <div className="app-content">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
