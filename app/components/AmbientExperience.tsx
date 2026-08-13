"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  radius: number;
};

export default function AmbientExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const auraRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    let animationFrame = 0;
    let pointerFrame = 0;

    const pointer = { x: -999, y: -999 };

    if (finePointer && !reduced) {
      const moveAtmosphere = (event: PointerEvent) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
        pointerFrame = window.requestAnimationFrame(() => {
          const x = event.clientX / window.innerWidth - 0.5;
          const y = event.clientY / window.innerHeight - 0.5;
          auraRefs.current.forEach((aura, index) => {
            if (!aura) return;
            const strength = 18 + index * 13;
            aura.style.transform = `translate3d(${x * strength}px, ${y * strength + window.scrollY * (index + 1) * -0.012}px, 0)`;
          });
          if (glowRef.current) {
            glowRef.current.style.left = `${event.clientX}px`;
            glowRef.current.style.top = `${event.clientY}px`;
            glowRef.current.style.opacity = "1";
          }

          const surface = (event.target as Element | null)?.closest<HTMLElement>(
            "[data-premium-surface]",
          );
          if (surface) {
            const rect = surface.getBoundingClientRect();
            surface.style.setProperty(
              "--surface-x",
              `${((event.clientX - rect.left) / rect.width) * 100}%`,
            );
            surface.style.setProperty(
              "--surface-y",
              `${((event.clientY - rect.top) / rect.height) * 100}%`,
            );
          }
        });
      };

      document.addEventListener("pointermove", moveAtmosphere, {
        signal,
        passive: true,
      });
      document.documentElement.addEventListener(
        "mouseleave",
        () => {
          if (glowRef.current) glowRef.current.style.opacity = "0";
        },
        { signal },
      );
    }

    if (canvas && context) {
      let width = window.innerWidth;
      let height = window.innerHeight;
      let nodes: Node[] = [];

      const resize = () => {
        const density = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * density;
        canvas.height = height * density;
        context.setTransform(density, 0, 0, density, 0, 0);
        const count = Math.max(
          24,
          Math.min(96, Math.floor((width * height) / 21000)),
        );
        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          phase: Math.random() * Math.PI * 2,
          radius: 1.2 + Math.random() * 1.5,
        }));
      };

      const color = (alpha: number) =>
        document.documentElement.dataset.theme === "dark"
          ? `rgba(86,242,192,${alpha})`
          : `rgba(20,150,108,${alpha})`;

      const frame = (now: number) => {
        context.clearRect(0, 0, width, height);
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const square = dx * dx + dy * dy;
          if (square < 16000) {
            const force = (1 - square / 16000) * 0.7;
            node.x += (dx / Math.sqrt(square + 1)) * force;
            node.y += (dy / Math.sqrt(square + 1)) * force;
          }
        }
        for (let first = 0; first < nodes.length; first += 1) {
          for (let second = first + 1; second < nodes.length; second += 1) {
            const a = nodes[first];
            const b = nodes[second];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (distance < 128) {
              context.strokeStyle = color(0.12 * (1 - distance / 128));
              context.beginPath();
              context.moveTo(a.x, a.y);
              context.lineTo(b.x, b.y);
              context.stroke();
            }
          }
        }
        for (const node of nodes) {
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.0016 + node.phase));
          context.fillStyle = color(0.35 + 0.55 * pulse);
          context.beginPath();
          context.arc(
            node.x,
            node.y,
            node.radius * (0.75 + 0.55 * pulse),
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        if (!reduced) animationFrame = window.requestAnimationFrame(frame);
      };

      resize();
      window.addEventListener("resize", resize, { signal, passive: true });
      if (!reduced) animationFrame = window.requestAnimationFrame(frame);
    }

    return () => {
      controller.abort();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    };
  }, []);

  return (
    <div className="ambient-experience" aria-hidden="true">
      <div ref={(node) => { auraRefs.current[0] = node; }} className="aura a1" />
      <div ref={(node) => { auraRefs.current[1] = node; }} className="aura a2" />
      <div ref={(node) => { auraRefs.current[2] = node; }} className="aura a3" />
      <div ref={glowRef} className="cursor-glow" />
      <canvas ref={canvasRef} id="fx" />
    </div>
  );
}
