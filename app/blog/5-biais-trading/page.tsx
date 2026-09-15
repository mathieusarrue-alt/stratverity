import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/02_5_biais_trading.md?raw";

export const metadata = {
  title: "5 biais qui faussent vos résultats de trading | StratVerity",
  description:
    "Look-ahead, overfitting, survivorship, cost model, data snooping : les 5 biais les plus courants, expliqués et détectables.",
};

export default function ArticleBiaisTrading() {
  return (
    <BlogPost
      title="5 biais qui faussent vos résultats de trading (et comment les détecter)"
      date="2026-09-14"
      readingTime="10 min"
      content={rawContent}
      tags={["biais", "trading", "éducation"]}
    />
  );
}