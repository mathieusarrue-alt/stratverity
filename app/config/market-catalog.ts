// Official StratVerity market catalog — closed list, no custom symbols.
// 34 assets. TF list includes 1d + 1w on every symbol (product completeness).
// Worker rule: prefer native OHLCV file; else resample from finer TF or fetch.
// Do not add symbols here without a data path (file | resample | fetch).

export type MarketAssetClass = "crypto" | "fx" | "index" | "commodity" | "equity";

export type MarketAsset = {
  id: string;
  class: MarketAssetClass;
  display: string;
  /** Short glyph for configure chips. */
  icon: string;
  tfs: readonly string[];
};

type CatalogSeed = {
  id: string;
  class: MarketAssetClass;
  display: string;
  icon: string;
  tfs: readonly string[];
};

/** Ensure 1d + 1w always present; keep existing lower TFs. */
function withDailyWeekly(tfs: readonly string[]): readonly string[] {
  const order = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"] as const;
  const set = new Set<string>([...tfs, "1d", "1w"]);
  return order.filter((t) => set.has(t));
}

const RAW_CATALOG: readonly CatalogSeed[] = [
  { id: "BTCUSDT", class: "crypto", display: "BTC / USDT", icon: "₿", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "ETHUSDT", class: "crypto", display: "ETH / USDT", icon: "Ξ", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "SOLUSDT", class: "crypto", display: "SOL / USDT", icon: "◎", tfs: ["1m", "5m", "15m", "1h", "4h", "1d"] },
  { id: "XRPUSDT", class: "crypto", display: "XRP / USDT", icon: "✕", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "BNBUSDT", class: "crypto", display: "BNB / USDT", icon: "◆", tfs: ["5m", "15m", "1h", "4h"] },
  { id: "ADAUSDT", class: "crypto", display: "ADA / USDT", icon: "₳", tfs: ["5m", "15m", "1h", "4h"] },
  { id: "DOGEUSDT", class: "crypto", display: "DOGE / USDT", icon: "Ð", tfs: ["1m", "15m", "1h", "4h"] },
  { id: "AVAXUSDT", class: "crypto", display: "AVAX / USDT", icon: "▲", tfs: ["1m", "15m", "1h", "4h"] },
  { id: "LINKUSDT", class: "crypto", display: "LINK / USDT", icon: "⬡", tfs: ["15m", "1h", "4h"] },
  { id: "LTCUSDT", class: "crypto", display: "LTC / USDT", icon: "Ł", tfs: ["15m", "1h", "4h"] },
  { id: "EURUSD", class: "fx", display: "EUR / USD", icon: "€$", tfs: ["1m", "15m", "1h"] },
  { id: "USDJPY", class: "fx", display: "USD / JPY", icon: "$¥", tfs: ["1m", "15m", "1h"] },
  { id: "GBPJPY", class: "fx", display: "GBP / JPY", icon: "£¥", tfs: ["1m", "15m", "1h"] },
  { id: "AUDJPY", class: "fx", display: "AUD / JPY", icon: "A¥", tfs: ["1m", "15m", "1h"] },
  { id: "NZDUSD", class: "fx", display: "NZD / USD", icon: "N$", tfs: ["1m", "15m", "1h"] },
  { id: "USDCHF", class: "fx", display: "USD / CHF", icon: "$₣", tfs: ["1m", "15m", "1h"] },
  { id: "US500", class: "index", display: "S&P 500", icon: "S&P", tfs: ["1m", "15m", "1h"] },
  { id: "USTECH100", class: "index", display: "US Tech 100", icon: "T100", tfs: ["1m", "15m", "1h"] },
  { id: "NAS100", class: "index", display: "Nasdaq 100", icon: "NQ", tfs: ["15m", "1h", "1d"] },
  { id: "SPX500", class: "index", display: "SPX 500", icon: "SPX", tfs: ["15m", "1h", "1d"] },
  { id: "DAX", class: "index", display: "DAX", icon: "DAX", tfs: ["1m", "15m", "1h"] },
  { id: "UK100", class: "index", display: "UK 100", icon: "UK", tfs: ["1m", "15m", "1h"] },
  { id: "JP225", class: "index", display: "Nikkei 225", icon: "NK", tfs: ["1m", "15m", "1h"] },
  { id: "HK50", class: "index", display: "Hang Seng 50", icon: "HS", tfs: ["1m", "15m", "1h"] },
  { id: "XAUUSD", class: "commodity", display: "Gold", icon: "Au", tfs: ["1m", "15m", "1h"] },
  { id: "XAGUSD", class: "commodity", display: "Silver", icon: "Ag", tfs: ["1m", "15m", "1h"] },
  { id: "WTI", class: "commodity", display: "WTI Crude", icon: "Oil", tfs: ["1m", "15m", "1h"] },
  { id: "NATGAS", class: "commodity", display: "Natural Gas", icon: "Gas", tfs: ["1m", "15m", "1h"] },
  { id: "AAPL", class: "equity", display: "Apple", icon: "AAPL", tfs: ["1m", "15m", "1h"] },
  { id: "NVDA", class: "equity", display: "NVIDIA", icon: "NV", tfs: ["1m", "15m", "1h"] },
  { id: "JPM", class: "equity", display: "JPMorgan", icon: "JP", tfs: ["1m", "15m", "1h"] },
  { id: "XOM", class: "equity", display: "Exxon Mobil", icon: "XO", tfs: ["1m", "15m", "1h"] },
  { id: "KO", class: "equity", display: "Coca-Cola", icon: "KO", tfs: ["1m", "15m", "1h"] },
  { id: "JNJ", class: "equity", display: "Johnson & Johnson", icon: "J&J", tfs: ["1m", "15m", "1h"] },
];

export const MARKET_CATALOG: readonly MarketAsset[] = RAW_CATALOG.map((a) => ({
  ...a,
  tfs: withDailyWeekly(a.tfs),
}));

export const MARKET_ASSET_IDS: readonly string[] = MARKET_CATALOG.map((a) => a.id);

export const MARKET_ASSET_BY_ID: Readonly<Record<string, MarketAsset>> = Object.fromEntries(
  MARKET_CATALOG.map((a) => [a.id, a]),
);

/** Union of all TFs present in the catalog (for fallback UI). */
export const ALL_CATALOG_TIMEFRAMES: readonly string[] = Array.from(
  new Set(MARKET_CATALOG.flatMap((a) => [...a.tfs])),
).sort((a, b) => {
  const rank = (t: string) => {
    const m = /^(\d+)([mhdw])$/.exec(t);
    if (!m) return 99999;
    const n = Number(m[1]);
    const u = { m: 1, h: 60, d: 1440, w: 10080 }[m[2] as "m" | "h" | "d" | "w"] ?? 1;
    return n * u;
  };
  return rank(a) - rank(b);
});

/** TFs allowed for the current asset selection (intersection if multi-asset). */
export function timeframesForAssets(assetIds: readonly string[]): string[] {
  if (!assetIds.length) return [...ALL_CATALOG_TIMEFRAMES];
  let set: Set<string> | null = null;
  for (const id of assetIds) {
    const asset = MARKET_ASSET_BY_ID[id];
    if (!asset) continue;
    const next = new Set(asset.tfs);
    set = set ? new Set([...set].filter((t) => next.has(t))) : next;
  }
  const list = set ? [...set] : [];
  return list.sort((a, b) => ALL_CATALOG_TIMEFRAMES.indexOf(a) - ALL_CATALOG_TIMEFRAMES.indexOf(b));
}
