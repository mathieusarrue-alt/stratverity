import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/05_win_rate_vs_profit_factor.md?raw";

export const metadata = {
  title: "Win Rate vs Profit Factor : lequel regarder en premier ? | StratVerity",
  description:
    "Pourquoi un winrate élevé peut cacher une stratégie perdante, et inversement — comprendre le Profit Factor et le payoff ratio.",
};

export default function ArticleWinRateProfitFactor() {
  return (
    <BlogPost
      title="Win Rate vs Profit Factor : lequel regarder en premier ?"
      date="2026-09-16"
      readingTime="6 min"
      content={rawContent}
      tags={["win rate", "profit factor", "statistiques"]}
    />
  );
}
