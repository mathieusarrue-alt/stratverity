"use client";

import { useEffect, useState } from "react";

/**
 * Bouton "Remonter en haut", discret, visible uniquement après un scroll
 * suffisant. Ne s'affiche jamais au chargement (évite le flash).
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      setVisible(window.scrollY > 600);
      scheduled = false;
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Remonter en haut"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 55,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--line-2)",
        background: "color-mix(in oklab, var(--surface) 80%, transparent)",
        backdropFilter: "blur(8px)",
        color: "var(--ink-1)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
