import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/08_position_sizing_money_management.md?raw";

export const metadata = {
  title: "Position sizing et money management en trading | StratVerity",
  description:
    "Pourquoi le dimensionnement des positions détermine votre survie autant que la qualité du signal. Risque de ruine, ATR-sizing, Critère de Kelly expliqués simplement.",
};

export default function ArticlePositionSizing() {
  return (
    <BlogPost
      title="Position sizing : pourquoi la meilleure stratégie du monde peut vous ruiner"
      date="2026-09-17"
      readingTime="8 min"
      content={rawContent}
      tags={["position sizing", "money management", "gestion du risque"]}
    />
  );
}
