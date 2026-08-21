"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type LineData,
} from "lightweight-charts";

const NEON_UP = "#00FF9D";
const NEON_DOWN = "#FF4D6A";
const FOREST = "#047857";

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

type ChartSetup = (chart: IChartApi, el: HTMLDivElement) => void;

function useChartContainer(setup: ChartSetup) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight || 90,
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
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
      crosshair: { mode: 0 },
    });

    setup(chart, el);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width: el.clientWidth,
        height: el.clientHeight || 90,
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [setup]);

  return ref;
}

/** Bougies japonaises vert/rouge néon — pour cartes #product. */
export function CandlesMini({
  data = DEMO_CANDLES,
  height = 90,
}: {
  data?: CandlestickData[];
  height?: number;
}) {
  const setup = useCallback<ChartSetup>(
    (chart) => {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: NEON_UP,
        downColor: NEON_DOWN,
        borderVisible: false,
        wickUpColor: NEON_UP,
        wickDownColor: NEON_DOWN,
      });
      series.setData(data);
    },
    [data],
  );
  const ref = useChartContainer(setup);

  return (
    <div
      ref={ref}
      className="sv-chart-candles"
      style={{ width: "100%", height, minHeight: height }}
      aria-hidden="true"
    />
  );
}

/** Courbe d'équité + gradient vert sombre. */
export function EquityMini({
  data = DEMO_EQUITY,
  height = 90,
}: {
  data?: LineData[];
  height?: number;
}) {
  const setup = useCallback<ChartSetup>(
    (chart) => {
      const series = chart.addSeries(AreaSeries, {
        lineColor: FOREST,
        topColor: "rgba(0, 255, 157, 0.28)",
        bottomColor: "rgba(4, 120, 87, 0.02)",
        lineWidth: 2,
      });
      series.setData(data);
    },
    [data],
  );
  const ref = useChartContainer(setup);

  return (
    <div
      ref={ref}
      className="sv-chart-equity"
      style={{ width: "100%", height, minHeight: height }}
      aria-hidden="true"
    />
  );
}