import Link from "next/link";
import styles from "../scope-configurator.module.css";

export default function CheckoutReturnPage() {
  return (
    <main className={`${styles.page} ${styles.successPage}`}>
      <section className={styles.successCard}>
        <span>STRATVERITY · RETOUR DE STRIPE</span>
        <h1>Confirmation en cours.</h1>
        <p>
          Stripe nous a renvoyé vers cette page. Notre serveur vérifie maintenant
          le paiement signé avant toute activation.
        </p>
        <p>
          <strong>Aucun audit, scan ou worker n’est lancé depuis le navigateur.</strong>{" "}
          Vous recevrez la confirmation lorsque le rapprochement sécurisé sera
          terminé.
        </p>
        <Link href="/configure">Retour au configurateur</Link>
      </section>
    </main>
  );
}
