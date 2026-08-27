"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LicenseView } from "../../marketplace/commerce";

export const LICENSE_STATE_LABEL: Record<LicenseView["state"], string> = {
  active: "Accès actif",
  pending_grant: "Acceptation de l'invite en cours (< 24 h)",
  revoked: "Accès révoqué",
  past_due: "Loyer impayé — révocation imminente",
};

/** /account/licenses — statut, handle, activation invite. */

export default function AccountLicenses() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/marketplace/licenses", { cache: "no-store" });
        if (response.status === 401) {
          router.push(`/login?return_to=${encodeURIComponent("/account/licenses")}`);
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { licenses: LicenseView[] };
        setLicenses(payload.licenses ?? []);
      } catch {
        setError("Impossible de charger vos licences.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="mp-page">
      <section className="mp-hero">
        <span className="mp-illust-eyebrow">Mon compte</span>
        <h1>
          Mes licences <em>et accès.</em>
        </h1>
        <p>
          Vos achats donnent un accès plateforme en invite. Le code source
          n&apos;est jamais fourni. En location, l&apos;accès reste actif tant
          que le loyer est payé.
        </p>
        <div className="marketplace-actions">
          <Link className="btn btn-ghost" href="/account">Retour au compte →</Link>
        </div>
      </section>

      {loading && <p className="marketplace-message">Chargement…</p>}
      {error && <p className="mp-modal-err">{error}</p>}

      {!loading && !error && (
        <div className="mp-grid">
          {licenses.length === 0 && (
            <div className="marketplace-state">
              <strong>Aucune licence pour l&apos;instant.</strong>
              <p>Découvrez le catalogue et achetez un accès.</p>
              <Link className="btn btn-primary" href="/marketplace">Voir le catalogue →</Link>
            </div>
          )}
          {licenses.map((license) => (
            <article className="mp-card" key={`${license.listing_id}-${license.mode}`}>
              <div className="mp-card-top">
                <span className="mp-engine">{license.kind} · {license.mode === "one_shot" ? "permanent" : "loyer"}</span>
                <span className={`mp-badge ${license.state === "active" ? "active" : ""}`}>{LICENSE_STATE_LABEL[license.state]}</span>
              </div>
              <h3>{license.title}</h3>
              <p className="mp-summary mono">Handle : {license.handle}</p>
              <p className="mp-summary">{license.message}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}