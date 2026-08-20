// Logique pure de la page de certification /cert/[id] : aucun JSX ici,
// testable et réutilisable. Les états de confiance (Certifié / Révision
// obsolète / Rejeté - Non vérifié) sont dérivés des données de l'API
// publique GET /v1/certifications/{audit_id}.

export type Tone = "green" | "orange" | "red" | "gray";

export type CertificationStatusKey =
  | "CERTIFIED"
  | "REVISION_STALE"
  | "FAILED"
  | "IN_PROGRESS"
  | "NOT_FOUND"
  | "UNVERIFIED";

export type VerifiedState = "unchecked" | "matched" | "stale";

export interface TrustPillars {
  profit_factor_net?: number | null;
  max_drawdown_percent?: number | null;
  trade_count?: number | null;
}

export interface CertificationData {
  audit_id: string;
  status: string | null;
  certified: boolean;
  robust_score: number | null;
  overfitting_risk: number | null;
  strategy_name: string | null;
  pdf_report_url: string | null;
  code_hash: string | null;
  badge_url: string | null;
  quant?: {
    verdict?: string | null;
    flags?: string[];
    warnings?: string[];
  } | null;
  trust_pillars?: TrustPillars | null;
}

export interface CertificationView {
  statusKey: CertificationStatusKey;
  tone: Tone;
  statusLabel: string;
  statusSub: string;
  score: number | null;
  overfittingRisk: number | null;
  strategyName: string | null;
  codeHash: string | null;
  verified: VerifiedState;
  pillars: TrustPillars;
  flags: string[];
  warnings: string[];
  badgeUrl: string | null;
}

export function toneForScore(score: number | null): Tone {
  if (score === null) return "gray";
  if (score >= 70) return "green";
  if (score >= 50) return "orange";
  return "red";
}

/** Compare le hash soumis (code actuel) à l'empreinte enregistrée à l'audit. */
export function verifiedState(
  codeHash: string | null,
  submittedHash: string | null,
): VerifiedState {
  if (!codeHash || submittedHash === null) return "unchecked";
  return submittedHash.trim().toLowerCase() === codeHash.trim().toLowerCase()
    ? "matched"
    : "stale";
}

export function buildCertificationView(
  data: CertificationData | null,
  submittedHash: string | null,
): CertificationView {
  return resolveCertificationView(data, submittedHash, "ready");
}

function baseView(data: CertificationData): CertificationView {
  return {
    statusKey: "UNVERIFIED",
    tone: toneForScore(data.robust_score),
    statusLabel: "Not verified",
    statusSub: "This strategy has no current StratVerity certification.",
    score: data.robust_score,
    overfittingRisk: data.overfitting_risk,
    strategyName: data.strategy_name,
    codeHash: data.code_hash,
    verified: "unchecked",
    pillars: data.trust_pillars ?? {},
    flags: data.quant?.flags ?? [],
    warnings: data.quant?.warnings ?? [],
    badgeUrl: data.badge_url,
  };
}

function resolveCertificationView(
  data: CertificationData | null,
  submittedHash: string | null,
  state: "loading" | "ready" | "error",
): CertificationView {
  if (state === "loading") {
    return {
      statusKey: "UNVERIFIED",
      tone: "gray",
      statusLabel: "Loading certification…",
      statusSub: "Contacting the StratVerity audit registry.",
      score: null,
      overfittingRisk: null,
      strategyName: null,
      codeHash: null,
      verified: "unchecked",
      pillars: {},
      flags: [],
      warnings: [],
      badgeUrl: null,
    };
  }
  if (state === "error" || !data) {
    return {
      statusKey: "NOT_FOUND",
      tone: "red",
      statusLabel: "Certification not found",
      statusSub:
        "This identifier is unknown to the StratVerity audit registry.",
      score: null,
      overfittingRisk: null,
      strategyName: null,
      codeHash: null,
      verified: "unchecked",
      pillars: {},
      flags: [],
      warnings: [],
      badgeUrl: null,
    };
  }

  const base = baseView(data);

  let view: CertificationView;
  switch (data.status) {
    case "CERTIFIED":
      view = {
        ...base,
        statusKey: "CERTIFIED",
        tone: toneForScore(data.robust_score),
        statusLabel: "Audit certified",
        statusSub:
          "Independently verified by StratVerity. The declared backtest " +
          "survived fees, slippage, and out-of-sample validation.",
      };
      break;
    case "FAILED":
      view = {
        ...base,
        statusKey: "FAILED",
        tone: "red",
        statusLabel: "Audit failed",
        statusSub:
          "The strategy does not pass the StratVerity robustness bar " +
          "(Martingale profile, unrealistic costs, or broken out-of-sample).",
      };
      break;
    case "PENDING":
    case "PROCESSING":
      view = {
        ...base,
        statusKey: "IN_PROGRESS",
        tone: "gray",
        statusLabel: "Audit in progress",
        statusSub:
          "The audit has been paid and the engine is processing. The badge " +
          "will appear once the certification verdict is sealed.",
      };
      break;
    default:
      view = {
        ...base,
        statusKey: "UNVERIFIED",
        tone: "gray",
        statusLabel: "Not certified",
        statusSub:
          "No active certification is attached to this audit identifier.",
      };
      break;
  }

  // La « signature » du code audité prime sur l'état brut : si un hash est
  // soumis et ne correspond plus, l'audit est obsolète.
  if (data.code_hash && submittedHash !== null) {
    view.verified = verifiedState(data.code_hash, submittedHash);
    if (view.verified === "stale") {
      view.statusKey = "REVISION_STALE";
      view.tone = "orange";
      view.statusLabel = "Revision stale — not verified";
      view.statusSub =
        "The audited strategy code no longer matches the signed source " +
        "signature. A new audit is required before this badge can be used.";
    }
  }
  return view;
}

// ---------------------------------------------------------------------------
// Embeds du badge (HTML / Markdown) à copier sur les marketplaces
// ---------------------------------------------------------------------------

export interface BadgeEmbed {
  html: string;
  markdown: string;
}

export function buildBadgeEmbed(
  auditId: string,
  badgeUrlPath: string,
  apiOrigin: string,
  siteOrigin: string,
): BadgeEmbed {
  const badgeUrl = `${apiOrigin.replace(/\/+$/, "")}/${badgeUrlPath.replace(
    /^\/+/,
    "",
  )}`;
  const certHref = `${siteOrigin.replace(/\/+$/, "")}/cert/${encodeURIComponent(
    auditId,
  )}`;
  const html =
    `<a href="${certHref}" target="_blank" rel="noopener">` +
    `<img src="${badgeUrl}" alt="StratVerity audit certification" ` +
    `width="280" height="70" /></a>`;
  const markdown = `[![StratVerity audit certification](${badgeUrl})](${certHref})`;
  return { html, markdown };
}