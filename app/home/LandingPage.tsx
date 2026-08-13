"use client";

import { useEffect, useRef } from "react";
import { landingMarkup } from "./landing-markup";
import { messages } from "../i18n/messages";
import type { MessageKey } from "../i18n/messages";
import { useI18n } from "../i18n/I18nProvider";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const localized = messages[locale] as Partial<Record<MessageKey, string>>;
    root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n as MessageKey | undefined;
      if (key) element.innerHTML = localized[key] ?? messages.fr[key];
    });
  }, [locale]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animationFrames = new Set<number>();

    const matrix = root.querySelector<HTMLElement>("#matrix");
    if (matrix) {
      const assets = ["BTC", "ETH", "SOL", "XRP", "ADA", "LINK", "LTC", "DOGE"];
      const timeframes = ["15m", "1H", "4H", "1D"];
      const states = [
        ["pass", "warn", "pass", "pass"], ["pass", "pass", "pass", "warn"],
        ["warn", "pass", "pass", "pass"], ["fail", "warn", "pass", "pass"],
        ["warn", "pass", "pass", "fail"], ["pass", "pass", "warn", "pass"],
        ["pass", "warn", "pass", "pass"], ["fail", "pass", "pass", "warn"],
      ];
      matrix.style.setProperty("--n", String(timeframes.length));
      matrix.innerHTML = `<div class="collbl"></div>${timeframes.map((timeframe) => `<div class="collbl matrix-timeframe">${timeframe}</div>`).join("")}${assets.map((asset, row) => `<div class="rowlbl">${asset}</div>${timeframes.map((timeframe, column) => { const state = states[row][column]; const symbol = state === "pass" ? "✓" : state === "warn" ? "~" : "✕"; return `<div class="cell ${state}" style="transition-delay:${(row * timeframes.length + column) * 18}ms" title="${asset} ${timeframe}">${symbol}</div>`; }).join("")}`).join("")}`;
    }

    const ticker = root.querySelector<HTMLElement>("#ticker");
    if (ticker) {
      const data = [["BTC", "1.28", "u"], ["ETH", "1.41", "u"], ["SOL", "1.12", "u"], ["XRP", "0.94", "d"], ["ADA", "1.18", "u"], ["LINK", "1.33", "u"], ["LTC", "1.07", "u"], ["DOGE", "0.88", "d"], ["AVAX", "1.22", "u"], ["BNB", "1.05", "u"]];
      const run = data.map(([asset, factor, trend]) => `<span class="it"><b>${asset}</b> PF <span class="${trend}">${factor}</span></span>`).join("");
      ticker.innerHTML = run + run;
    }

    const year = root.querySelector<HTMLElement>("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const countUp = (element: HTMLElement) => {
      const target = Number.parseFloat(element.dataset.count ?? "0");
      const decimals = Number(element.dataset.dec ?? 0);
      const prefix = element.dataset.prefix ?? "";
      const suffix = element.dataset.suffix ?? "";
      const sign = !prefix && target > 0 && suffix === "%" ? "+" : "";
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / 1100, 1);
        const eased = 1 - (1 - progress) ** 3;
        element.textContent = `${prefix}${sign}${(target * eased).toFixed(decimals)}${suffix}`;
        if (progress < 1) animationFrames.add(window.requestAnimationFrame(tick));
      };
      animationFrames.add(window.requestAnimationFrame(tick));
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entry.target.querySelectorAll<HTMLElement>("[data-count]").forEach((counter) => {
          if (!counter.dataset.done) {
            counter.dataset.done = "1";
            if (!reduced) countUp(counter);
          }
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => revealObserver.observe(element));

    const radial = root.querySelector<HTMLElement>("#radial");
    const arc = root.querySelector<SVGGeometryElement>("#radialArc");
    const radialObserver = radial && arc ? new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        arc.style.transition = "stroke-dashoffset 1.4s var(--ease)";
        arc.style.strokeDashoffset = String(452 - (452 * 74) / 100);
        observer.disconnect();
      }
    }, { threshold: 0.4 }) : null;
    if (radial && radialObserver) radialObserver.observe(radial);

    const chart = root.querySelector<SVGSVGElement>("#heroChart");
    const curve = root.querySelector<SVGPathElement>("#curveNet");
    const cross = root.querySelector<SVGLineElement>("#cross");
    const dot = root.querySelector<SVGCircleElement>("#crossDot");
    const tip = root.querySelector<HTMLElement>("#chartTip");
    const chartWrap = root.querySelector<HTMLElement>("#chartWrap");
    if (chart && curve && cross && dot && tip && chartWrap) {
      const length = curve.getTotalLength();
      chartWrap.addEventListener("pointermove", (event) => {
        const rect = chart.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const targetX = 4 + ratio * 312;
        let low = 0;
        let high = length;
        let point = curve.getPointAtLength(0);
        for (let index = 0; index < 18; index += 1) {
          const middle = (low + high) / 2;
          point = curve.getPointAtLength(middle);
          if (point.x < targetX) low = middle; else high = middle;
        }
        cross.setAttribute("x1", String(point.x)); cross.setAttribute("x2", String(point.x)); cross.setAttribute("opacity", ".5");
        dot.setAttribute("cx", String(point.x)); dot.setAttribute("cy", String(point.y)); dot.setAttribute("opacity", "1");
        tip.textContent = `×${(1 + ratio * ratio * 3.1).toFixed(2)} net`;
        tip.style.opacity = "1"; tip.style.left = `${(point.x / 320) * rect.width}px`; tip.style.top = `${(point.y / 120) * rect.height + 8}px`;
      }, { signal });
      chartWrap.addEventListener("pointerleave", () => { cross.setAttribute("opacity", "0"); dot.setAttribute("opacity", "0"); tip.style.opacity = "0"; }, { signal });
    }

    if (window.matchMedia("(pointer: fine)").matches && !reduced) {
      root.querySelectorAll<HTMLElement>("[data-tilt]").forEach((element) => {
        element.addEventListener("pointermove", (event) => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          element.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
          element.style.setProperty("--cx", `${x * 100}%`); element.style.setProperty("--cy", `${y * 100}%`);
          const glare = element.querySelector<HTMLElement>(".glare");
          glare?.style.setProperty("--gx", `${x * 100}%`); glare?.style.setProperty("--gy", `${y * 100}%`);
        }, { signal });
        element.addEventListener("pointerleave", () => { element.style.transform = ""; }, { signal });
      });
      root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((element) => {
        element.addEventListener("pointermove", (event) => {
          const rect = element.getBoundingClientRect();
          element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.25}px, ${(event.clientY - rect.top - rect.height / 2) * 0.35}px)`;
        }, { signal });
        element.addEventListener("pointerleave", () => { element.style.transform = ""; }, { signal });
      });
    }

    return () => {
      controller.abort();
      revealObserver.disconnect();
      radialObserver?.disconnect();
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: landingMarkup }} />;
}
