import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    title: "BacktestProof by StratVerity — Auditez votre stratégie, pas son storytelling",
    description:
      "Audit indépendant de stratégies Pine et Python : métriques recalculées, biais détectés et résultats reliés aux preuves.",
    applicationName: "StratVerity",
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: "BacktestProof by StratVerity — La preuve avant la promesse",
      description:
        "Déposez votre stratégie. Vérifiez ses métriques, ses biais et sa robustesse.",
      type: "website",
      locale: "fr_FR",
      images: [{ url: socialImage, width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BacktestProof by StratVerity — La preuve avant la promesse",
      description:
        "Audit indépendant de stratégies Pine et Python, fondé sur les preuves.",
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
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
