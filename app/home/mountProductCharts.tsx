"use client";

import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { CandlesMini, EquityMini } from "./ProductCharts";
import type { MountProductChartsHandle, MountProductChartsOptions } from "./product-charts.types";

export function mountProductCharts(
  options: MountProductChartsOptions,
): MountProductChartsHandle {
  const { root, height = 90, persistData = true } = options;
  const section = root.querySelector("#product");
  if (!section) {
    return { unmount: () => undefined };
  }

  const roots: Root[] = [];
  const hosts: HTMLElement[] = [];

  const ensureHost = (el: Element, kind: "candles" | "equity"): HTMLElement => {
    if (el instanceof HTMLElement && el.dataset.chartHost === kind) {
      return el;
    }
    const host = document.createElement("div");
    host.dataset.chartHost = kind;
    host.dataset.chart = kind;
    host.className = "sv-chart-host";
    host.style.width = "100%";
    host.style.maxWidth = "100%";
    host.style.overflow = "hidden";
    host.style.minHeight = `${height}px`;
    el.replaceChildren(host);
    return host;
  };

  const candlesTarget =
    section.querySelector<HTMLElement>('[data-chart="candles"]') ??
    section.querySelectorAll(".viz")[0] ??
    null;

  const equityTarget =
    section.querySelector<HTMLElement>('[data-chart="equity"]') ??
    section.querySelectorAll(".viz")[1] ??
    null;

  if (candlesTarget) {
    const host = ensureHost(candlesTarget, "candles");
    hosts.push(host);
    const r = createRoot(host);
    r.render(
      createElement(CandlesMini, {
        height,
        persistData,
      }),
    );
    roots.push(r);
  }

  if (equityTarget) {
    const host = ensureHost(equityTarget, "equity");
    hosts.push(host);
    const r = createRoot(host);
    r.render(
      createElement(EquityMini, {
        height,
        persistData,
      }),
    );
    roots.push(r);
  }

  return {
    unmount: () => {
      for (const r of roots) {
        try {
          r.unmount();
        } catch {
          // ignore
        }
      }
      roots.length = 0;
    },
  };
}