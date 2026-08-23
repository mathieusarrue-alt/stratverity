import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commande — StratVerity",
  description:
    "Suivi de votre audit : paiement, génération du rapport et livraison.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}