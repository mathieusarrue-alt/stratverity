import Link from "next/link";
import {
  chatGPTSignOutPath,
  requireChatGPTUser,
} from "../chatgpt-auth";
import styles from "../auth.module.css";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "S";

  return (
    <main className={styles.page}>
      <div className={styles.accountShell}>
        <section className={styles.accountCard} data-premium-surface>
          <span className={styles.cardLabel}>ESPACE STRATVERITY</span>
          <h1>Bienvenue, {user.displayName}.</h1>
          <p>
            Votre accès est prêt. Les commandes restent protégées par leur
            preuve de paiement et le jeton propriétaire conservé dans votre session.
          </p>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{initial}</span>
            <div><strong>{user.displayName}</strong><small>{user.email}</small></div>
            <span className={styles.status}>IDENTITÉ VÉRIFIÉE</span>
          </div>
          <div className={styles.actions}>
            <Link className={styles.actionCard} href="/configure" data-premium-surface>
              <strong>Auditer une stratégie</strong>
              <small>Définir les actifs, unités de temps et options de robustesse.</small>
            </Link>
            <Link className={styles.actionCard} href="/#method" data-premium-surface>
              <strong>Comprendre la méthode</strong>
              <small>Revoir les preuves, biais et étapes de validation humaine.</small>
            </Link>
          </div>
          <Link className={styles.signOut} href={chatGPTSignOutPath("/")}>Se déconnecter</Link>
        </section>
      </div>
    </main>
  );
}
