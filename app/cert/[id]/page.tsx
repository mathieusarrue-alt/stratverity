import { cache } from "react";
import type { Metadata } from "next";
import CertificationView from "../CertificationView";
import type { CertificationData } from "../certification-state";
import { buildCertificationView } from "../certification-state";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";
const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://stratverity.com";

// Lecture unique par requête SSR (idempotent, évite un double fetch entre
// generateMetadata et le rendu de la page).
const getCertification = cache(async function (
  auditId: string,
): Promise<CertificationData | null> {
  try {
    const response = await fetch(
      `${API_URL}/v1/certifications/${encodeURIComponent(auditId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (!response.ok) return null;
    return (await response.json()) as CertificationData;
  } catch {
    // API injoignable : la page rend un état neutre, jamais une erreur fatale.
    return null;
  }
});

function badgeUrl(auditId: string): string {
  return `${API_URL.replace(/\/+$/, "")}/v1/badge/${encodeURIComponent(
    auditId,
  )}.svg`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const auditId = params.id;
  const data = await getCertification(auditId);
  const strategyName = data?.strategy_name ?? null;
  const score = data?.robust_score ?? null;
  const statusLabel =
    data?.status === "CERTIFIED"
      ? "Certified"
      : data?.status === "FAILED"
        ? "Failed"
        : data?.status
          ? data.status
          : "Audit";

  const title = strategyName
    ? `${strategyName} — StratVerity certification${score !== null ? ` (${score}/100)` : ""}`
    : `Audit ${auditId} — StratVerity certification`;
  const description = `StratVerity public audit ${statusLabel.toLowerCase()}${score !== null ? ` — robustness score ${score}/100` : ""}. Out-of-sample validation, fees and overfitting checks performed by the independent StratVerity engine.`;
  const image = badgeUrl(auditId);

  return {
    title,
    description,
    alternates: {
      canonical: `/cert/${auditId}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_ORIGIN.replace(/\/+$/, "")}/cert/${auditId}`,
      images: [{ url: image, width: 280, height: 70, alt: `StratVerity audit badge ${auditId}` }],
      siteName: "StratVerity",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CertificationPage({
  params,
}: {
  params: { id: string };
}) {
  const auditId = params.id;
  const data = await getCertification(auditId);
  const view = buildCertificationView(data, null);

  // JSON-LD : schéma de certification (schema.org) + fil d'Ariane, dans le
  // même pattern que `learn/[slug]` (aucune dépendance externe).
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalCredential",
      name: "StratVerity audit certification",
      description: `StratVerity independent audit certification for strategy ${auditId}${data?.robust_score !== null && data?.robust_score !== undefined ? ` — robustness score ${data.robust_score}/100` : ""}.`,
      credentialCategory: "Trading strategy audit certification",
      issuedBy: {
        "@type": "Organization",
        name: "StratVerity",
        url: "https://stratverity.com",
      },
      about: {
        "@type": "SoftwareApplication",
        name: data?.strategy_name ?? "Audited trading strategy",
        applicationCategory: "FinanceApplication",
      },
      ...(data?.code_hash
        ? {
            mentions: {
              "@type": "Thing",
              name: `Audited source SHA-256: ${data.code_hash}`,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "StratVerity", item: "https://stratverity.com" },
        { "@type": "ListItem", position: 2, name: "Certification", item: "https://stratverity.com/cert" },
        { "@type": "ListItem", position: 3, name: auditId, item: `https://stratverity.com/cert/${auditId}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CertificationView
        auditId={auditId}
        data={data}
        view={view}
        apiOrigin={API_URL}
        siteOrigin={SITE_ORIGIN}
      />
    </>
  );
}