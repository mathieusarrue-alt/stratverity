import { LegalPage } from "../LegalPage";

export default function RiskPage() {
  return (
    <LegalPage
      title="Avertissement risques"
      lead="Un backtest est une mesure historique sous hypothèses. Ce n’est ni une promesse de gain ni un conseil d’investissement."
    >
      <section>
        <h2>Limites d’un backtest</h2>
        <p>
          Les données, frais, spreads, slippage, liquidité, latence, biais de
          sélection, sur-optimisation et erreurs de code peuvent transformer les
          résultats. Les performances passées ne préjugent pas des performances
          futures et une perte totale du capital engagé reste possible.
        </p>
      </section>
      <section>
        <h2>Portée de l’audit</h2>
        <p>
          L’audit vise à rendre les hypothèses, métriques et divergences plus
          vérifiables. Il ne certifie pas la rentabilité, ne donne pas d’ordre de
          marché et ne remplace pas l’avis d’un professionnel autorisé.
        </p>
      </section>
      <section>
        <h2>Décision humaine</h2>
        <p>
          Aucun worker, ordre ou scan n’est déclenché directement depuis un
          paiement. Toute activation sensible exige une qualification, une
          autorisation explicite et un périmètre exact stratégie × actif × unité
          de temps.
        </p>
      </section>
    </LegalPage>
  );
}
