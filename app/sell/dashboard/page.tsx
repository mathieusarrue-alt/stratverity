"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMISSION_PCT, formatCents, STATE_LABEL, type SellerDashboard as Dashboard } from "../../marketplace/commerce";

/** /sell/dashboard — listings, file de grant, stats, solde 85 %. */

const EMPTY: Dashboard = {
  listings: [],
  stats: {
    views: 0, unique_views: 0, favorites: 0, checkouts: 0, sales: 0,
    total_revenue_cents: 0, rent_mrr_cents: 0, churn: 0,
  },
  balance_cents: 0,
  granted: [],
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const response = await fetch("/api/marketplace/sell/dashboard", { cache: "no-store" });
      if (response.status === 401) {
        router.push(`/login?return_to=${encodeURIComponent("/sell/dashboard")}`);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as Dashboard;
      setData(payload);
    } catch {
      setError("Impossible de charger le dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function grant(licenseId: string, action: "grant" | "revoke") {
    const response = await fetch("/api/marketplace/sell/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_id: licenseId, action }),
    });
    if (response.ok) refresh();
  }

  const { stats, balance_cents, granted, listings } = data;

  return (
    <main className="mp-page">
      <section className="mp-hero">
        <span className="mp-illust-eyebrow">Dashboard vendeur</span>
        <h1>
          Vendre, <em>suivre, livrer l&apos;accès.</em>
        </h1>
        <p>
          Commission StratVerity {COMMISSION_PCT} % sur chaque encaissement
          (one-shot et loyer). Vous recevez 85 % du prix affiché. Chaque vue,
          favori, checkout et vente est enregistré dès la mise en ligne.
        </p>
        <div className="marketplace-actions">
          <Link className="btn btn-primary" href="/sell">+ Nouveau dépôt</Link>
          <Link className="btn btn-ghost" href="/sell/listings">Mes listings →</Link>
        </div>
      </section>

      {loading && <p className="marketplace-message">Chargement…</p>}
      {error && <p className="mp-modal-err">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mp-illust-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
            {[
              ["Vues", String(stats.views)],
              ["Uniques", String(stats.unique_views)],
              ["Favoris", String(stats.favorites)],
              ["Checkouts", String(stats.checkouts)],
              ["Ventes", String(stats.sales)],
              ["CA (cumul)", formatCents(stats.total_revenue_cents)],
              ["MRR loyer", formatCents(stats.rent_mrr_cents)],
              ["Solde (85 %)", formatCents(balance_cents)],
            ].map(([k, v]) => (
              <article className="mp-illust-card" key={k}>
                <span className="mp-engine">{k}</span>
                <h3 className="mp-illust-score-value">{v}</h3>
              </article>
            ))}
          </div>

          <section style={{ marginTop: 32 }}>
            <h2 className="mp-illust-title">File d&apos;invitation (accès)</h2>
            <div className="mp-grid">
              {granted.length === 0 && (
                <p className="marketplace-message">Aucune licence à activer pour l&apos;instant.</p>
              )}
              {granted.map((g) => (
                <article className="mp-card" key={g.license_id}>
                  <span className="mp-badge">{g.state}</span>
                  <h3 className="mono">{g.handle}</h3>
                  <div className="marketplace-actions" style={{ margin: 0 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => grant(g.license_id, "grant")}>
                      Accès accordé
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => grant(g.license_id, "revoke")}>
                      Révoquer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 className="mp-illust-title">Listings</h2>
            <div className="mp-grid">
              {listings.length === 0 && <p className="marketplace-message">Aucun listing.</p>}
              {listings.map((l) => (
                <article className="mp-card" key={l.id}>
                  <span className="mp-badge">{STATE_LABEL[l.state] ?? l.state}</span>
                  <h3>{l.title}</h3>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
