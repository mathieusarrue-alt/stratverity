"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type LineData,
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";
import type { CandlesMiniProps, EquityMiniProps } from "./product-charts.types";
import {
  loadCandlesCache,
  loadChartPrefs,
  loadEquityCache,
  saveCandlesCache,
  saveChartPrefs,
  saveEquityCache,
} from "./product-charts.storage";

const NEON_UP = "#00FF9D";
const NEON_DOWN = "#FF4D6A";
const FOREST = "#047857";
const AREA_TOP = "rgba(0, 255, 157, 0.28)";
const AREA_BOTTOM = "rgba(4, 120, 87, 0.02)";

const DEMO_CANDLES: CandlestickData[] = [
  { time: "2024-06-01", open: 98, high: 105, low: 96, close: 103 },
  { time: "2024-06-02", open: 103, high: 110, low: 101, close: 108 },
  { time: "2024-06-03", open: 108, high: 109, low: 100, close: 102 },
  { time: "2024-06-04", open: 102, high: 118, low: 101, close: 116 },
  { time: "2024-06-05", open: 116, high: 121, low: 112, close: 114 },
  { time: "2024-06-06", open: 114, high: 119, low: 110, close: 117 },
  { time: "2024-06-07", open: 117, high: 125, low: 115, close: 123 },
];

const DEMO_EQUITY: LineData[] = [
  { time: "2024-06-01", value: 100 },
  { time: "2024-06-02", value: 104.2 },
  { time: "2024-06-03", value: 101.8 },
  { time: "2024-06-04", value: 109.5 },
  { time: "2024-06-05", value: 107.1 },
  { time: "2024-06-06", value: 112.4 },
  { time: "2024-06-07", value: 118.6 },
];

function resolveTheme(): "light" | "dark" {
  const prefs = loadChartPrefs();
  if (prefs.theme === "light" || prefs.theme === "dark") return prefs.theme;
  if (typeof document !== "undefined") {
    const ds = document.documentElement.dataset.theme;
    if (ds === "light" || ds === "dark") return ds;
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function baseChartOptions(width: number, height: number): DeepPartial<ChartOptions> {
  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: "transparent",
      attributionLogo: false,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
    },
    rightPriceScale: { visible: false },
    leftPriceScale: { visible: false },
    timeScale: { visible: false, borderVisible: false },
    handleScroll: false,
    handleScale: false,
    crosshair: {
      vertLine: { visible: false },
      horzLine: { visible: false },
    },
  };
}

function addCandles(chart: IChartApi, data: CandlestickData[]): void {
  const series = chart.addSeries(CandlestickSeries, {
    upColor: NEON_UP,
    downColor: NEON_DOWN,
    borderVisible: false,
    wickUpColor: NEON_UP,
    wickDownColor: NEON_DOWN,
  });
  series.setData(data);
}

function addEquity(chart: IChartApi, data: LineData[]): void {
  const series = chart.addSeries(AreaSeries, {
    lineColor: FOREST,
    topColor: AREA_TOP,
    bottomColor: AREA_BOTTOM,
    lineWidth: 2,
  });
  series.setData(data);
}

function useChartLifecycle(
  setup: (chart: IChartApi, el: HTMLDivElement) => void,
  height: number,
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    saveChartPrefs({ height });
    const chart = createChart(el, baseChartOptions(el.clientWidth || 300, height));
    setup(chart, el);
    chart.timeScale().fitContent();
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      if (w <= 0) return;
      chart.applyOptions({ width: w, height });
      chart.timeScale().fitContent();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [setup, height]);
  return ref;
}

export function CandlesMini({
  data,
  height,
  className,
  storageKey = "sv.chart.candles",
  persistData = true,
}: CandlesMiniProps) {
  const prefs = useMemo(() => loadChartPrefs(), []);
  const resolvedHeight = height ?? prefs.height ?? 90;
  const series = useMemo(() => {
    if (data && data.length > 0) return data;
    if (persistData) {
      const cached = loadCandlesCache(storageKey);
      if (cached && cached.length > 0) return cached;
    }
    return DEMO_CANDLES;
  }, [data, persistData, storageKey]);

  useEffect(() => {
    if (persistData && series.length > 0) {
      saveCandlesCache(series, storageKey);
    }
  }, [persistData, series, storageKey]);

  useEffect(() => {
    void resolveTheme();
  }, []);

  const setup = useCallback(
    (chart: IChartApi) => {
      addCandles(chart, series);
    },
    [series],
  );

  const ref = useChartLifecycle(setup, resolvedHeight);
  const style: CSSProperties = {
    width: "100%",
    height: resolvedHeight,
    minHeight: resolvedHeight,
    maxWidth: "100%",
    overflow: "hidden",
  };

  return (
    <div
      ref={ref}
      className={className ? `sv-chart-candles ${className}` : "sv-chart-candles"}
      style={style}
      data-chart-kind="candles"
      aria-hidden="true"
    />
  );
}

export function EquityMini({
  data,
  height,
  className,
  storageKey = "sv.chart.equity",
  persistData = true,
}: EquityMiniProps) {
  const prefs = useMemo(() => loadChartPrefs(), []);
  const resolvedHeight = height ?? prefs.height ?? 90;
  const series = useMemo(() => {
    if (data && data.length > 0) return data;
    if (persistData) {
      const cached = loadEquityCache(storageKey);
      if (cached && cached.length > 0) return cached;
    }
    return DEMO_EQUITY;
  }, [data, persistData, storageKey]);

  useEffect(() => {
    if (persistData && series.length > 0) {
      saveEquityCache(series, storageKey);
    }
  }, [persistData, series, storageKey]);

  const setup = useCallback(
    (chart: IChartApi) => {
      addEquity(chart, series);
    },
    [series],
  );

  const ref = useChartLifecycle(setup, resolvedHeight);
  const style: CSSProperties = {
    width: "100%",
    height: resolvedHeight,
    minHeight: resolvedHeight,
    maxWidth: "100%",
    overflow: "hidden",
  };

  return (
    <div
      ref={ref}
      className={className ? `sv-chart-equity ${className}` : "sv-chart-equity"}
      style={style}
      data-chart-kind="equity"
      aria-hidden="true"
    />
  );
}

export { DEMO_CANDLES, DEMO_EQUITY };