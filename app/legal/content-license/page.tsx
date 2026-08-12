import { LegalPage } from "../LegalPage";

export default function ContentLicensePage() {
  return (
    <LegalPage
      title="Licence de contenu"
      lead="Vous restez propriétaire de votre stratégie. La licence bêta est limitée à l’exécution du service et n’accorde aucun droit de revente."
    >
      <section>
        <h2>Droits accordés</h2>
        <p>
          Pour la durée nécessaire au service et à ses obligations de preuve et
          de sécurité, le client autorise StratVerity à héberger, copier
          techniquement, analyser et tester le contenu transmis afin de
          qualifier la demande, réaliser l’audit, livrer le résultat et traiter
          les incidents. Le service peut utiliser des enseignements agrégés ou
          désidentifiés pour améliorer ses méthodes de détection.
        </p>
      </section>
      <section>
        <h2>Droits non accordés</h2>
        <p>
          Cette version exclut expressément la publication, la distribution, la
          vente, la sous-licence ou l’intégration du code identifiable du client
          à une stratégie ou une marketplace. Une évolution future exigerait un
          texte distinct, clair, délimité et juridiquement validé.
        </p>
      </section>
      <section>
        <h2>Suppression et preuves</h2>
        <p>
          Les fichiers opérationnels seront supprimés selon la politique de
          conservation publiée. Les empreintes, preuves de commande et traces
          nécessaires à la sécurité ou à une obligation légale peuvent être
          conservées séparément pendant la durée applicable.
        </p>
      </section>
    </LegalPage>
  );
}
