"use client";

/**
 * Logo officiel StratVerity — bouclier néon `#00FF9D` + texte.
 * Source : deliverable Grok (shield + logo complet + sous-titre).
 * Fond sombre `#0B121E → #111827`, glow néon via feGaussianBlur.
 */

const SHIELD_PATHS = (
  <>
    {/* Bouclier extérieur */}
    <path
      d="M75 18 L118 32 L118 72 C118 98 96 117 75 125 C54 117 32 98 32 72 L32 32 Z"
      fill="url(#logoShieldGradient)"
      stroke="#00FF9D"
      strokeWidth="3"
      filter="url(#logoGlow)"
    />
    {/* Circuits simplifiés */}
    <g stroke="#00FF9D" strokeWidth="1.5" opacity="0.7" fill="none">
      <line x1="50" y1="40" x2="50" y2="60" />
      <line x1="60" y1="38" x2="60" y2="55" />
      <line x1="85" y1="40" x2="85" y2="58" />
      <line x1="95" y1="42" x2="95" y2="62" />
      <circle cx="50" cy="40" r="2" fill="#00FF9D" />
      <circle cx="60" cy="38" r="2" fill="#00FF9D" />
      <circle cx="85" cy="40" r="2" fill="#00FF9D" />
      <circle cx="95" cy="42" r="2" fill="#00FF9D" />
    </g>
    {/* Flèche */}
    <path
      d="M20 95 L60 65 L75 78 L115 28"
      stroke="#00FF9D"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      filter="url(#logoGlow)"
    />
    <path d="M115 28 L98 30 L112 44 Z" fill="#00FF9D" filter="url(#logoGlow)" />
  </>
);

/**
 * Bouclier seul — pour favicon, avatar, badge (512x512 viewBox).
 */
export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="neonGlowShield" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B121E" stopOpacity="1" />
          <stop offset="100%" stopColor="#111827" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M50 12 L82 22 L82 52 C82 72 66 86 50 92 C34 86 18 72 18 52 L18 22 Z"
        fill="url(#shieldGradient)"
        stroke="#00FF9D"
        strokeWidth="2.5"
        filter="url(#neonGlowShield)"
      />
      <path
        d="M50 16 L78 25 L78 51 C78 69 64 82 50 87 C36 82 22 69 22 51 L22 25 Z"
        fill="none"
        stroke="#00FF9D"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <g stroke="#00FF9D" strokeWidth="1.2" opacity="0.75" fill="none" strokeLinecap="round">
        <line x1="32" y1="28" x2="32" y2="44" />
        <line x1="40" y1="26" x2="40" y2="38" />
        <line x1="48" y1="24" x2="48" y2="34" />
        <line x1="60" y1="26" x2="60" y2="38" />
        <line x1="68" y1="28" x2="68" y2="44" />
        <line x1="28" y1="55" x2="42" y2="55" />
        <line x1="26" y1="62" x2="38" y2="62" />
        <line x1="58" y1="58" x2="72" y2="58" />
        <line x1="55" y1="65" x2="68" y2="65" />
        <circle cx="32" cy="28" r="1.8" fill="#00FF9D" />
        <circle cx="40" cy="26" r="1.8" fill="#00FF9D" />
        <circle cx="48" cy="24" r="1.8" fill="#00FF9D" />
        <circle cx="60" cy="26" r="1.8" fill="#00FF9D" />
        <circle cx="68" cy="28" r="1.8" fill="#00FF9D" />
        <circle cx="32" cy="44" r="1.5" fill="#00FF9D" />
        <circle cx="40" cy="38" r="1.5" fill="#00FF9D" />
        <circle cx="60" cy="38" r="1.5" fill="#00FF9D" />
        <circle cx="68" cy="44" r="1.5" fill="#00FF9D" />
      </g>
      <path
        d="M12 76 L42 54 L52 62 L88 24"
        stroke="#00FF9D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#neonGlowShield)"
      />
      <path d="M88 24 L74 25 L86 37 Z" fill="#00FF9D" filter="url(#neonGlowShield)" />
    </svg>
  );
}

/**
 * Logo complet (bouclier + StratVerity + sous-titre) — header / hero.
 * SVG 1200x600 avec fond dégradé radial.
 */
export function StratVerityLogo({
  size = "md",
  className,
  showBackground = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showBackground?: boolean;
}) {
  const sizes = { sm: { width: 200, height: 100 }, md: { width: 400, height: 200 }, lg: { width: 600, height: 300 } };
  const { width, height } = sizes[size];
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="logoShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B121E" stopOpacity="1" />
          <stop offset="100%" stopColor="#111827" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0B121E" stopOpacity="1" />
        </radialGradient>
      </defs>
      {showBackground ? <rect width="1200" height="600" fill="url(#bgGradient)" /> : null}
      {/* Bouclier (droite) */}
      <g transform="translate(750, 150)">{SHIELD_PATHS}</g>
      {/* Texte StratVerity */}
      <text x="80" y="280" fontFamily="Arial, sans-serif" fontSize="88" fontWeight="700" fill="#FFFFFF">
        Strat<tspan fill="#00FF9D" filter="url(#logoGlow)">Verity</tspan>
      </text>
      {/* Sous-titre */}
      <text x="80" y="340" fontFamily="Arial, sans-serif" fontSize="28" fill="#94A3B8" letterSpacing="2">
        ALGO AUDIT &amp; CERTIFICATION
      </text>
      {/* Bougies subtiles */}
      <g opacity="0.15" fill="#00FF9D">
        <rect x="150" y="380" width="12" height="60" />
        <rect x="180" y="360" width="12" height="80" />
        <rect x="210" y="390" width="12" height="50" />
        <rect x="240" y="370" width="12" height="70" />
        <rect x="270" y="385" width="12" height="55" />
        <rect x="300" y="365" width="12" height="75" />
      </g>
    </svg>
  );
}