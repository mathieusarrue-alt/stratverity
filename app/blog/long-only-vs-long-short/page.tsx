import BlogPost from "@/components/BlogPost";
import rawContent from "../../../content/blog/11_long_only_vs_long_short.md?raw";

export const metadata = {
  title: "Long-only vs Long/Short : impact sur le risque et le backtest | StratVerity",
  description:
    "Pourquoi un backtest long-only flatteur peut simplement refléter un marché haussier, et ce que le short ajoute vraiment en termes de risque et de coûts réels.",
};

export default function ArticleLongShort() {
  return (
    <BlogPost
      title="Long-only vs Long/Short : ce que ça change pour le risque et le backtest"
      date="2026-09-17"
      readingTime="7 min"
      content={rawContent}
      tags={["long/short", "exposition directionnelle", "gestion du risque"]}
    />
  );
}
