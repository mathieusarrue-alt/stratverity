import type {
  CandlestickData,
  LineData,
  ProductChartPrefs,
  SeriesCache,
} from "./product-charts.types";

const PREFS_KEY = "sv.productCharts.prefs";
const CANDLES_KEY = "sv.chart.candles";
const EQUITY_KEY = "sv.chart.equity";

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const k = "__sv_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / mode privé
  }
}

export function loadChartPrefs(): ProductChartPrefs {
  const stored = readJson<Partial<ProductChartPrefs>>(PREFS_KEY);
  return {
    height: typeof stored?.height === "number" ? stored.height : 90,
    theme: stored?.theme === "light" || stored?.theme === "dark" ? stored.theme : "auto",
    updatedAt: stored?.updatedAt ?? new Date(0).toISOString(),
  };
}

export function saveChartPrefs(patch: Partial<ProductChartPrefs>): ProductChartPrefs {
  const next: ProductChartPrefs = {
    ...loadChartPrefs(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJson(PREFS_KEY, next);
  return next;
}

export function loadCandlesCache(key = CANDLES_KEY): CandlestickData[] | null {
  const cache = readJson<SeriesCache<CandlestickData>>(key);
  if (!cache || cache.version !== 1 || !Array.isArray(cache.data)) return null;
  return cache.data;
}

export function saveCandlesCache(data: CandlestickData[], key = CANDLES_KEY): void {
  const payload: SeriesCache<CandlestickData> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    data,
  };
  writeJson(key, payload);
}

export function loadEquityCache(key = EQUITY_KEY): LineData[] | null {
  const cache = readJson<SeriesCache<LineData>>(key);
  if (!cache || cache.version !== 1 || !Array.isArray(cache.data)) return null;
  return cache.data;
}

export function saveEquityCache(data: LineData[], key = EQUITY_KEY): void {
  const payload: SeriesCache<LineData> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    data,
  };
  writeJson(key, payload);
}

export const PRODUCT_CHART_KEYS = {
  PREFS_KEY,
  CANDLES_KEY,
  EQUITY_KEY,
} as const;