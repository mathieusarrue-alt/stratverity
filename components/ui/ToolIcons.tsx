import type { ReactElement } from "react";

/**
 * Icônes vectorielles des outils StratVerity — SVG premium avec halo néon
 * (mint #00FF9D / cyan #22D3EE). Remplacent les icônes texte des cartes outils.
 */

type ToolIconProps = { size?: number; className?: string };

function base(fill: string, glow: string): React.CSSProperties {
  return { filter: `drop-shadow(0 0 6px ${glow})` };
}

export function HealthCheckIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#00FF9D", "rgba(0,255,157,0.55)")} aria-hidden="true">
      <path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-4 3-6 5-9Z" stroke="#00FF9D" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h2l1-2 1.5 3 1-1h1.5" stroke="#00FF9D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function RobustnessIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#22D3EE", "rgba(34,211,238,0.55)")} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="#22D3EE" strokeWidth="1.8" />
      <path d="M12 12l3.5-2" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" fill="#22D3EE" />
    </svg>
  );
}

export function FeesIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#00FF9D", "rgba(0,255,157,0.55)")} aria-hidden="true">
      <path d="M4 6h16v12H4z" stroke="#00FF9D" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 12h10M12 9.5V12m0 0v2.5" stroke="#00FF9D" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CrashTestIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#22D3EE", "rgba(34,211,238,0.55)")} aria-hidden="true">
      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z" stroke="#22D3EE" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function MarketplaceIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#00FF9D", "rgba(0,255,157,0.55)")} aria-hidden="true">
      <path d="M4 4h2l2.5 8h8L19 7H7" stroke="#00FF9D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="19" r="1.5" fill="#00FF9D" />
      <circle cx="16" cy="19" r="1.5" fill="#00FF9D" />
    </svg>
  );
}

export function AuditIcon({ size = 28, className }: ToolIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={base("#22D3EE", "rgba(34,211,238,0.55)")} aria-hidden="true">
      <path d="M6 2h9l4 4v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="#22D3EE" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v5h5" stroke="#22D3EE" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M8 13h8M8 17h5" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function toolIconFor(name: string): ReactElement {
  switch (name) {
    case "health-check":
      return <HealthCheckIcon />;
    case "score":
      return <RobustnessIcon />;
    case "fees":
      return <FeesIcon />;
    case "crash-test":
      return <CrashTestIcon />;
    case "marketplace":
      return <MarketplaceIcon />;
    case "configure":
      return <AuditIcon />;
    default:
      return <HealthCheckIcon />;
  }
}