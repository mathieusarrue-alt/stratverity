import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Hall of Fame & Hall of Shame",
  description:
    "Real examples of backtests that survived verification — and the ones that lied. See declared vs recomputed performance.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Hall of Fame & Hall of Shame | StratVerity",
    description:
      "Examples of backtests that hold up — and the ones that fall apart under scrutiny.",
    type: "website",
    url: "https://www.stratverity.com/gallery",
    siteName: "StratVerity",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
