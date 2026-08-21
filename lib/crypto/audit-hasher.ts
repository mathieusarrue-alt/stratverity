// Module crypto — preuve d'audit (hash SHA-256) sans exposer le code source.
//
// Le hash publié combine le code source, l'horodatage et les résultats de
// backtest, de sorte qu'un tiers peut vérifier l'authenticité d'un rapport
// SANS jamais voir le code (on ne publie que le digest, jamais le source).
//
// Utilise Web Crypto (crypto.subtle.digest), disponible dans le navigateur et
// dans les runtimes Edge/Vercel/Amplify. Aucune dépendance externe.

export type AuditHashInput = {
  source: string;
  timestamp: string; // ISO 8601
  results: Record<string, unknown>; // métriques de backtest (quant_metrics)
};

/** Sérialise déterministe des résultats (tri des clés, pas d'aléa). */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Hash hexadécimal SHA-256 du payload normalisé. */
export async function computeAuditHash(input: AuditHashInput): Promise<string> {
  const canonical = `${input.source}\n${input.timestamp}\n${stableStringify(input.results)}`;
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Valide le format d'un hash externe (64 hex). */
export function isValidAuditHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}
