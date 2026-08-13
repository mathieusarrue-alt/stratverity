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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const directHost = requestHeaders.get("host")?.trim();
  const candidateHost = forwardedHost || directHost || "backtestproof.local";
  const host = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(candidateHost)
    ? candidateHost
    : "backtestproof.local";
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
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "BacktestProof by StratVerity — Audit your strategy, not its storytelling",
    description:
      "Independent audit of Pine and Python strategies: recomputed metrics, detected biases, and results tied to the evidence.",
    applicationName: "StratVerity",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    },
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#f1eee5" },
      { media: "(prefers-color-scheme: dark)", color: "#07110d" },
    ],
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: "BacktestProof by StratVerity — Proof before the promise",
      description:
        "Upload your strategy. Verify its metrics, its biases and its robustness.",
      type: "website",
      locale: "en_US",
      images: [{ url: socialImage, width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BacktestProof by StratVerity — Proof before the promise",
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
