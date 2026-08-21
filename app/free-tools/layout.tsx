import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Trading Strategy Tools",
  description: "Free code health check, robustness score and trading fee calculator for Pine Script, Python and MQL strategies.",
  alternates: { canonical: "/free-tools" },
};

export default function FreeToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}