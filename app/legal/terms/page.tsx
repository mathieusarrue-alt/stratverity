import { LegalPage, styles } from "../LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions de la bêta"
      lead="Ces conditions encadrent la recette de BacktestProof. Elles ne constituent pas encore les conditions commerciales définitives d’un service vendu au public."
    >
      <p className={styles.warning}>
        Le service fonctionne actuellement avec Stripe en mode test. Aucun
        paiement réel ne doit être accepté avant publication de l’identité
        juridique complète du vendeur, de ses coordonnées, de son régime de
        TVA et de ses délais de livraison définitifs.
      </p>
      <section>
        <h2>1. Service testé</h2>
        <p>
          BacktestProof reçoit une stratégie Pine, Python ou un dossier pris en
          charge, vérifie d’abord sa sécurité et sa compatibilité, puis prépare
          son audit. Un score ou un rapport ne garantit ni rendement futur ni
          absence de perte. Le Scan live reste sur invitation et n’est pas
          activé par un paiement public.
        </p>
      </section>
      <section>
        <h2>2. Commande et preuve</h2>
        <p>
          Le périmètre, le tarif, la version des documents et leur empreinte
          sont calculés côté serveur. L’acceptation est horodatée et conservée
          dans un registre immuable lié à la commande. Un webhook Stripe signé
          confirme le paiement; il ne lance jamais directement du code client.
        </p>
      </section>
      <section>
        <h2>3. Responsabilités</h2>
        <p>
          Le client garantit qu’il peut transmettre les fichiers et données.
          Il reste seul responsable de ses décisions de trading. StratVerity
          peut refuser ou isoler tout contenu dangereux, illégal ou incompatible.
        </p>
      </section>
      <section>
        <h2>4. Support et litiges</h2>
        <p>
          Les coordonnées légales, l’adresse de support, le droit applicable et
          le dispositif de médiation seront publiés avant tout passage en
          paiement réel. Leur absence maintient automatiquement le NO-GO live.
        </p>
      </section>
    </LegalPage>
  );
}
