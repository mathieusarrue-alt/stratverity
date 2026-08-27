"use client";

import Link from "next/link";
import styles from "../auth.module.css";
import { useI18n } from "../i18n/I18nProvider";
import { useEffect, useState } from "react";
import { COMMERCE_ENABLED, type LicenseView } from "../marketplace/commerce";

type FavoritesView = Array<{ slug: string; title: string }>;

/**
 * /account — dashboard produit : identité, licences, favoris, archive des
 * audits déjà payés (droit du payeur, jamais de paywall), factures.
 * L'archive d'audit est skeleton-friendly jusqu'à ce que l'API audits soit
 * complète. SELLER_PRO reste un flag réservé (UI « Pro » grisée).
 */
export default function AccountContent({ user }: { user: { displayName: string; email: string } }) {
  const { t } = useI18n();
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "S";
  const [licenses, setLicenses] = useState<LicenseView[]>([]);
  const [favorites, setFavorites] = useState<FavoritesView>([]);
  const [loading, setLoading] = useState(COMMERCE_ENABLED);

  useEffect(() => {
    if (!COMMERCE_ENABLED) return;
    Promise.all([
      fetch("/api/marketplace/licenses", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { licenses: [] })),
      fetch("/api/marketplace/favorites", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { favorites: [] })),
    ])
      .then(([lic, fav]) => {
        setLicenses(lic.licenses ?? []);
        setFavorites(fav.favorites ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.accountShell}>
        <section className={styles.accountCard} data-premium-surface>
          <span className={styles.cardLabel}>{t("account.label")}</span>
          <h1>{t("account.welcome", { name: user.displayName })}</h1>
          <p>{t("account.intro")}</p>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{initial}</span>
            <div><strong>{user.displayName}</strong><small>{user.email}</small></div>
            <span className={styles.status}>{t("account.verified")}</span>
          </div>
          <div className={styles.actions}>
            <Link className={styles.actionCard} href="/configure" data-premium-surface>
              <strong>{t("account.audit")}</strong><small>{t("account.auditHelp")}</small>
            </Link>
            <Link className={styles.actionCard} href="/account/licenses" data-premium-surface>
              <strong>Mes licences</strong><small>Accès invite, statut &amp; handle plateforme</small>
            </Link>
          </div>

          {COMMERCE_ENABLED && (
            <>
              <h2 className={styles.cardLabel} style={{ marginTop: 28 }}>Licences</h2>
              {loading && <p className="marketplace-message">Chargement des licences…</p>}
              {!loading && licenses.length === 0 && <p className="marketplace-message">Aucune licence.</p>}
              {licenses.slice(0, 5).map((l) => (
                <div key={`${l.listing_id}-${l.mode}`} className={styles.identity} style={{ marginTop: 8 }}>
                  <div><strong>{l.title}</strong><small>{l.handle} · {l.mode === "one_shot" ? "permanent" : "loyer"}</small></div>
                  <span className={styles.status}>{l.state}</span>
                </div>
              ))}

              <h2 className={styles.cardLabel} style={{ marginTop: 28 }}>Favoris</h2>
              {favorites.length === 0 && <p className="marketplace-message">Aucun favori.</p>}
              {favorites.map((f) => (
                <Link key={f.slug} href={`/marketplace/${f.slug}`} className={styles.actionCard} data-premium-surface>
                  <strong>{f.title}</strong><small>Voir le listing →</small>
                </Link>
              ))}

              <h2 className={styles.cardLabel} style={{ marginTop: 28 }}>Archive des audits payés</h2>
              <p className="marketplace-message">
                Vos rapports et preuves restent accessibles sans paywall. L&apos;historique
                complet (date, SHA, profondeur, lien rapport) s&apos;affiche ici.
              </p>

              <h2 className={styles.cardLabel} style={{ marginTop: 28 }}>Factures</h2>
              <p className="marketplace-message">Vos reçus Stripe sont disponibles sous peu.</p>
            </>
          )}

          <div className={styles.actions} style={{ marginTop: 24 }}>
            <Link className={styles.actionCard} href="/#method" data-premium-surface>
              <strong>{t("account.method")}</strong><small>{t("account.methodHelp")}</small>
            </Link>
            {COMMERCE_ENABLED && (
              <span className={styles.actionCard} data-premium-surface style={{ opacity: 0.55, pointerEvents: "none" }}>
                <strong>Seller Pro ⏳</strong><small>Analytics + featuring — bientôt</small>
              </span>
            )}
          </div>
          <form action="/auth/signout" method="post"><button className={styles.signOut} type="submit">{t("account.signOut")}</button></form>
        </section>
      </div>
    </main>
  );
}