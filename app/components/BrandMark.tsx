"use client";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="svShield" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FF9D" />
          <stop offset="1" stopColor="#00A86B" />
        </linearGradient>
        <filter id="svGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M32 4C42 8 52 10 52 10V30C52 44 32 58 32 58C32 58 12 44 12 30V10S22 8 32 4Z"
        stroke="url(#svShield)"
        strokeWidth="2.5"
        fill="rgba(0,255,157,0.08)"
        filter="url(#svGlow)"
      />
      <path
        d="M28 18L22 34H30L27 46L42 28H33L36 18H28Z"
        fill="#00FF9D"
        filter="url(#svGlow)"
      />
    </svg>
  );
}