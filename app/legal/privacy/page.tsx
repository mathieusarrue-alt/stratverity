import { LegalPage } from "../LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Confidentialité"
      lead="Nous limitons les données collectées à ce qui est nécessaire pour qualifier, auditer, livrer et sécuriser le service."
    >
      <section>
        <h2>Données et finalités</h2>
        <p>
          Nous pouvons traiter l’adresse email de livraison, les informations de
          commande, les empreintes de fichiers, les fichiers déposés, les
          résultats techniques et les journaux de sécurité. Les finalités sont
          la fourniture du service, la preuve contractuelle, la prévention de la
          fraude, le support et l’amélioration du produit.
        </p>
      </section>
      <section>
        <h2>Destinataires et hébergement</h2>
        <p>
          Les prestataires prévus sont notamment Stripe pour le paiement et AWS
          pour l’hébergement et l’email. Aucun code client n’est publié, vendu ou
          intégré à une marketplace dans cette bêta. Les transferts éventuels
          hors EEE devront reposer sur les garanties du prestataire concerné.
        </p>
      </section>
      <section>
        <h2>Durée, droits et contact</h2>
        <p>
          Le responsable de traitement est Mathieu Sarrue, entrepreneur
          individuel, 11 avenue du Huit Mai, 13400 Aubagne, France (SIRET
          903 756 575 00028). L’adresse prévue pour l’exercice des droits est
          support@stratverity.com ; elle doit encore réussir un test de réception
          avant l’ouverture commerciale. Les durées exactes par catégorie seront
          publiées avant le lancement. Jusqu’à ces validations, aucun paiement
          réel ne peut être activé.
        </p>
      </section>
    </LegalPage>
  );
}
