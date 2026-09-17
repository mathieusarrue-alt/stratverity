import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/12_robustesse_multi_actifs_backtest.md?raw";

export const metadata = {
  title: "Robustesse multi-actifs d'une stratégie de trading | StratVerity",
  description:
    "Pourquoi tester une stratégie sur plusieurs actifs corrélés n'apporte presque aucune garantie supplémentaire, et comment estimer le nombre de vérifications réellement indépendantes.",
};

export default function ArticleRobustesseMultiActifs() {
  return (
    <BlogPost
      title="Robustesse multi-actifs : pourquoi une stratégie qui marche sur un seul actif ne suffit pas"
      date="2026-09-17"
      readingTime="8 min"
      content={rawContent}
      tags={["multi-actifs", "diversification", "généralisation"]}
    />
  );
}
