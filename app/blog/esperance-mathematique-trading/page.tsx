import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/07_esperance_mathematique.md?raw";

export const metadata = {
  title: "L'espérance mathématique en trading expliquée | StratVerity",
  description:
    "L'espérance mathématique (expectancy) condense winrate, gain moyen et perte moyenne en un seul chiffre en R. Pourquoi c'est la métrique qui prédit vraiment la rentabilité.",
};

export default function ArticleEsperanceMathematique() {
  return (
    <BlogPost
      title="L'espérance mathématique : la seule métrique qui prédit si vous serez rentable"
      date="2026-09-17"
      readingTime="7 min"
      content={rawContent}
      tags={["espérance mathématique", "expectancy", "R-multiple"]}
    />
  );
}
