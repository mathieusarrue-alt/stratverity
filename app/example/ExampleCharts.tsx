"use client";

// Exemple de rapport réel — charts lightweight-charts v5 (équity vs buy&hold + underwater).
// 100 % données du sceau (`seed.data.json` généré par le moteur).
import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  AreaSeries,
  type LineData,
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";

export interface ExampleEquityPoint {
  time: string;
  equity_pct: number;
  bench_pct: number | null;
  net: number;
}

const BASE_OPTS: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: "transparent",
    textColor: "#8B98A5",
    fontFamily: "monospace",
    fontSize: 11,
  },
  rightPriceScale: { visible: true, borderVisible: false },
  timeAxis: { visible: true },
};

export function ExampleCharts({ points }: { points: ExampleEquityPoint[] }) {
  const eqRef = useRef<HTMLDivElement | null>(null);
  const uwRef = useRef<HTMLDivElement | null>(null);

  const equity: LineData[] = points.map((p) => ({ time: p.time, value: p.equity_pct }));
  const bench: LineData[] = points
    .filter((p) => p.bench_pct !== null && p.bench_pct !== undefined)
    .map((p) => ({ time: p.time, value: p.bench_pct as number }));

  let peak = -1e9;
  const under: LineData[] = [];
  for (const p of points) {
    if (p.equity_pct > peak) peak = p.equity_pct;
    under.push({ time: p.time, value: Math.min(0, p.equity_pct - peak) });
  }

  useEffect(() => {
    const el1 = eqRef.current;
    const el2 = uwRef.current;
    if (!el1 || !el2) return;
    let c: ReturnType<typeof createChart> | null = null;
    let c2: ReturnType<typeof createChart> | null = null;
    try {
      c = createChart(el1, BASE_OPTS);
      c2 = createChart(el2, BASE_OPTS);
      const eq = c.addSeries(LineSeries, { color: "#00FF9D" });
      const bh = c.addSeries(LineSeries, { color: "rgba(139,152,165,0.55)", lineStyle: 3 });
      eq.setData(equity);
      bh.setData(bench);
      const uw = c2.addSeries(AreaSeries, { color: "#EF4444", backgroundColor: "rgba(239,68,68,0.35)" });
      uw.setData(under);
    } catch {
      /* charts indisponible : la page reste lisible sans graphique */
    }
    return () => {
      if (c && typeof c.dispose === "function") c.dispose();
      if (c2 && typeof c2.dispose === "function") c2.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={eqRef} style={{ height: 240, minWidth: 0 }} />
      <div ref={uwRef} style={{ height: 140, minWidth: 0 }} />
    </div>
  );
}