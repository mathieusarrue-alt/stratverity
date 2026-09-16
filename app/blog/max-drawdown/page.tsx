import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/04_max_drawdown.md?raw";

export const metadata = {
  title: "Max Drawdown : plus important que le profit | StratVerity",
  description:
    "Pourquoi le Max Drawdown devrait être la première métrique regardée avant le rendement, et comment le lire correctement.",
};

export default function ArticleMaxDrawdown() {
  return (
    <BlogPost
      title="Max Drawdown : plus important que le profit"
      date="2026-09-16"
      readingTime="7 min"
      content={rawContent}
      tags={["max drawdown", "risque", "gestion du risque"]}
    />
  );
}
