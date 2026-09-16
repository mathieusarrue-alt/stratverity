import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/06_backtests_vendeurs_faux.md?raw";

export const metadata = {
  title: "Pourquoi les backtests des vendeurs sont (souvent) faux | StratVerity",
  description:
    "Look-ahead bias, overfitting, survivorship, coûts absents, data snooping, fenêtre cherry-pickée : les mécanismes techniques derrière les backtests trompeurs.",
};

export default function ArticleBacktestsVendeursFaux() {
  return (
    <BlogPost
      title="Pourquoi les backtests des vendeurs sont (souvent) faux"
      date="2026-09-16"
      readingTime="8 min"
      content={rawContent}
      tags={["backtest", "biais", "vendeur stratégie"]}
    />
  );
}
