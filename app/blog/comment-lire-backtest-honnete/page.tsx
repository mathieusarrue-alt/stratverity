import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/01_comment_lire_backtest_honnete.md?raw";

export const metadata = {
  title: "Comment lire un backtest honnête | StratVerity",
  description:
    "80% des backtests sont faux. Apprenez les 5 métriques à vérifier et les questions qui révèlent les arnaques.",
};

export default function ArticleBacktestHonnete() {
  return (
    <BlogPost
      title="Comment lire un backtest honnête (sans se faire avoir)"
      date="2026-09-14"
      readingTime="8 min"
      content={rawContent}
      tags={["backtest", "audit", "éducation"]}
    />
  );
}