import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/03_sharpe_ratio_explique.md?raw";

export const metadata = {
  title: "Le Sharpe Ratio expliqué simplement | StratVerity",
  description:
    "Comprendre ce que mesure vraiment le Sharpe Ratio, comment le lire, et pourquoi un chiffre trop élevé sur un backtest est souvent suspect.",
};

export default function ArticleSharpeRatio() {
  return (
    <BlogPost
      title="Le Sharpe Ratio expliqué simplement"
      date="2026-09-16"
      readingTime="6 min"
      content={rawContent}
      tags={["sharpe ratio", "risque", "éducation"]}
    />
  );
}
