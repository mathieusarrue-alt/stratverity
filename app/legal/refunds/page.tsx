import { LegalPage, styles } from "../LegalPage";

export default function RefundsPage() {
  return (
    <LegalPage
      title="Rétractation et remboursements"
      lead="La demande de démarrage immédiat est enregistrée séparément de la confirmation du paiement et n’efface pas les droits impératifs du client."
    >
      <p className={styles.warning}>
        Le délai de livraison, les conditions de remboursement et le traitement
        des consommateurs hors France doivent être finalisés avec le statut du
        vendeur avant tout paiement réel.
      </p>
      <section>
        <h2>Démarrage demandé</h2>
        <p>
          Lors du passage vers Stripe, le client demande explicitement que la
          qualification commence après confirmation du paiement et reconnaît
          avoir reçu l’information relative au droit de rétractation. Cette
          reconnaissance est liée à la commande et horodatée côté serveur.
        </p>
      </section>
      <section>
        <h2>Incident ou impossibilité</h2>
        <p>
          Une stratégie refusée avant exécution, un double paiement ou une
          impossibilité imputable au service doit rejoindre une revue humaine.
          Aucun refus automatique de remboursement n’est déduit d’un résultat
          de trading décevant; chaque demande dépend du service effectivement
          fourni et des règles impératives applicables.
        </p>
      </section>
    </LegalPage>
  );
}
