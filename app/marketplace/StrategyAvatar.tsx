"use client";

export type StrategyAvatarProps = {
  seed: string; // ex: listing.id, listing.slug, ou golden.id
  label: string; // ex: listing.title, golden.title — sert à générer les initiales
  size?: number; // défaut 40
  // URL publique https uploadée par le vendeur (listing.avatar_url, Supabase
  // Storage — décision fondateur 2026-09-02). Si présente, remplace l'avatar
  // généré par une vraie photo de profil ; sinon fallback sur le dégradé
  // d'initiales déterministe ci-dessous.
  imageUrl?: string | null;
};

// Paire de couleurs pour le dégradé linéaire, indexée par le hash du seed.
const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#0b3d2e", "#34d39c"], // 0 forêt → émeraude (paire "de marque")
  ["#1e293b", "#38bdf8"], // 1 ardoise → bleu ciel
  ["#312e81", "#a78bfa"], // 2 indigo → violet
  ["#7c2d12", "#fb923c"], // 3 brun → orange
  ["#164e63", "#22d3ee"], // 4 cyan foncé → cyan
  ["#701a75", "#e879f9"], // 5 magenta foncé → magenta
];

// Hash numérique pur et déterministe : même seed ⇒ même hash.
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return hash;
}

// Jusqu'à 2 lettres majuscules : 1er caractère alphanumérique du 1er mot, puis
// du 2e mot s'il existe. Les mots sont des suites de lettres/chiffres (accents
// inclus) séparées par tout caractère non alphanumérique.
export function strategyInitials(label: string): string {
  const tokens = label.match(/[A-Za-zÀ-ÿ0-9]+/g) ?? [];
  if (tokens.length === 0) return "?";
  const first = tokens[0]?.[0] ?? "";
  const second = tokens.length > 1 ? (tokens[1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export default function StrategyAvatar({
  seed,
  label,
  size = 40,
  imageUrl,
}: StrategyAvatarProps) {
  const gradientId = `sv-grad-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;
  const pair = PALETTE[Math.abs(hashSeed(seed)) % 6];
  const [from, to] = pair;
  const initials = strategyInitials(label);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={label}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          display: "block",
          flexShrink: 0,
          height: size,
          objectFit: "cover",
          width: size,
        }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`} />
      <text
        x="20"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#f4fbf7"
        fontFamily="var(--display, system-ui)"
        fontWeight="700"
        fontSize={size * 0.36}
      >
        {initials}
      </text>
    </svg>
  );
}
