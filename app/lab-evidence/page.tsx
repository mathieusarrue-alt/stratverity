import type { Metadata } from "next";
import IllustrativeModelCards from "../marketplace/IllustrativeModelCards";

export const metadata: Metadata = {
  title: "Preuves du labo — StratVerity",
  description:
    "Fixtures de laboratoire StratVerity, illustratives et hors commerce. Proof, not storytelling.",
  robots: { index: false, follow: false },
};

/**
 * /lab-evidence — preuves du labo, HORS panier.
 * Les goldens G-PIN-* sont des fixtures ILLUSTRATIVES : jamais à vendre,
 * jamais présentées comme un score réel. Le commerce vit sur /marketplace.
 */
export default function LabEvidencePage() {
  return (
    <main className="mp-page">
      <section className="mp-hero">
        <span className="mp-illust-eyebrow">Lab · illustratif</span>
        <h1>
          Preuves du labo, <em>hors commerce.</em>
        </h1>
        <p>
          Ces cartes montrent la méthode du laboratoire sur des fixtures
          versionnées. Elles ne sont pas des listings : rien ici n&apos;est à
          vendre, et aucune performance future n&apos;est promise.
        </p>
      </section>
      <IllustrativeModelCards />
    </main>
  );
}
