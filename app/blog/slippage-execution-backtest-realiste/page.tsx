import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/10_slippage_execution_backtest_realiste.md?raw";

export const metadata = {
  title: "Slippage et exécution réelle en backtest | StratVerity",
  description:
    "Latence, profondeur de marché, gaps sur les stops : ce qui sépare un prix théorique de signal d'un prix réel d'exécution, et comment le modéliser dans un backtest.",
};

export default function ArticleSlippage() {
  return (
    <BlogPost
      title="Slippage et exécution réelle : pourquoi votre backtest ment sur l'exécution"
      date="2026-09-17"
      readingTime="7 min"
      content={rawContent}
      tags={["slippage", "exécution", "liquidité"]}
    />
  );
}
