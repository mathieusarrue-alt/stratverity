// Official StratVerity market catalog — closed list, no custom symbols.
// Source of truth aligned with local OHLCV data (34 assets).
// Do not add symbols here without confirming data files exist on the worker.

export type MarketAssetClass = "crypto" | "fx" | "index" | "commodity" | "equity";

export type MarketAsset = {
  id: string;
  class: MarketAssetClass;
  display: string;
  tfs: readonly string[];
};

export const MARKET_CATALOG: readonly MarketAsset[] = [
  { id: "BTCUSDT", class: "crypto", display: "BTC / USDT", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "ETHUSDT", class: "crypto", display: "ETH / USDT", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "SOLUSDT", class: "crypto", display: "SOL / USDT", tfs: ["1m", "5m", "15m", "1h", "4h", "1d"] },
  { id: "XRPUSDT", class: "crypto", display: "XRP / USDT", tfs: ["1m", "5m", "15m", "1h", "4h"] },
  { id: "BNBUSDT", class: "crypto", display: "BNB / USDT", tfs: ["5m", "15m", "1h", "4h"] },
  { id: "ADAUSDT", class: "crypto", display: "ADA / USDT", tfs: ["5m", "15m", "1h", "4h"] },
  { id: "DOGEUSDT", class: "crypto", display: "DOGE / USDT", tfs: ["1m", "15m", "1h", "4h"] },
  { id: "AVAXUSDT", class: "crypto", display: "AVAX / USDT", tfs: ["1m", "15m", "1h", "4h"] },
  { id: "LINKUSDT", class: "crypto", display: "LINK / USDT", tfs: ["15m", "1h", "4h"] },
  { id: "LTCUSDT", class: "crypto", display: "LTC / USDT", tfs: ["15m", "1h", "4h"] },
  { id: "EURUSD", class: "fx", display: "EUR / USD", tfs: ["1m", "15m", "1h"] },
  { id: "USDJPY", class: "fx", display: "USD / JPY", tfs: ["1m", "15m", "1h"] },
  { id: "GBPJPY", class: "fx", display: "GBP / JPY", tfs: ["1m", "15m", "1h"] },
  { id: "AUDJPY", class: "fx", display: "AUD / JPY", tfs: ["1m", "15m", "1h"] },
  { id: "NZDUSD", class: "fx", display: "NZD / USD", tfs: ["1m", "15m", "1h"] },
  { id: "USDCHF", class: "fx", display: "USD / CHF", tfs: ["1m", "15m", "1h"] },
  { id: "US500", class: "index", display: "S&P 500", tfs: ["1m", "15m", "1h"] },
  { id: "USTECH100", class: "index", display: "US Tech 100", tfs: ["1m", "15m", "1h"] },
  { id: "NAS100", class: "index", display: "Nasdaq 100", tfs: ["15m", "1h", "1d"] },
  { id: "SPX500", class: "index", display: "SPX 500", tfs: ["15m", "1h", "1d"] },
  { id: "DAX", class: "index", display: "DAX", tfs: ["1m", "15m", "1h"] },
  { id: "UK100", class: "index", display: "UK 100", tfs: ["1m", "15m", "1h"] },
  { id: "JP225", class: "index", display: "Nikkei 225", tfs: ["1m", "15m", "1h"] },
  { id: "HK50", class: "index", display: "Hang Seng 50", tfs: ["1m", "15m", "1h"] },
  { id: "XAUUSD", class: "commodity", display: "Gold", tfs: ["1m", "15m", "1h"] },
  { id: "XAGUSD", class: "commodity", display: "Silver", tfs: ["1m", "15m", "1h"] },
  { id: "WTI", class: "commodity", display: "WTI Crude", tfs: ["1m", "15m", "1h"] },
  { id: "NATGAS", class: "commodity", display: "Natural Gas", tfs: ["1m", "15m", "1h"] },
  { id: "AAPL", class: "equity", display: "Apple", tfs: ["1m", "15m", "1h"] },
  { id: "NVDA", class: "equity", display: "NVIDIA", tfs: ["1m", "15m", "1h"] },
  { id: "JPM", class: "equity", display: "JPMorgan", tfs: ["1m", "15m", "1h"] },
  { id: "XOM", class: "equity", display: "Exxon Mobil", tfs: ["1m", "15m", "1h"] },
  { id: "KO", class: "equity", display: "Coca-Cola", tfs: ["1m", "15m", "1h"] },
  { id: "JNJ", class: "equity", display: "Johnson & Johnson", tfs: ["1m", "15m", "1h"] },
] as const;

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
