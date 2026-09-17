import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/09_mql4_mql5_pine_script_differences.md?raw";

export const metadata = {
  title: "MQL4 vs MQL5 vs Pine Script : différences pour l'audit | StratVerity",
  description:
    "Repaint Pine Script, mode 'Open prices only' MQL4, netting vs hedging MQL5 : les pièges spécifiques à chaque langage qui faussent un backtest sans toucher à la logique de trading.",
};

export default function ArticleMqlPine() {
  return (
    <BlogPost
      title="MQL4 vs MQL5 vs Pine Script : ce que ça change pour auditer une stratégie"
      date="2026-09-17"
      readingTime="8 min"
      content={rawContent}
      tags={["MQL4", "MQL5", "Pine Script"]}
    />
  );
}
