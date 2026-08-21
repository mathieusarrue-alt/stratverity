"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  X,
} from "lucide-react";
import { modelStrategies, formatSha, scoreTone } from "./model-strategies";
import type { ModelStrategy } from "./model-strategies";

type Listing = {
  listing_id: string;
  audit_hash: string;
  title: string;
  price_cents: number;
  currency: string;
  commission_bps: number;
  stats?: Record<string, unknown> | null;
};

function ScoreGauge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const color = tone === "good" ? "#00FF9D" : tone === "warn" ? "#F59E0B" : "#EF4444";
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = c * (score / 100);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="mp-gauge" role="img" aria-label={`Robustness ${score}/100`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--line-2)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 36 36)"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="var(--mono)">{score}</text>
    </svg>
  );
}

function StrategyCard({ s }: { s: ModelStrategy }) {
  const tone = scoreTone(s.robustnessScore);
  return (
    <article className={`mp-card mp-tone-${tone}`}>
      <div className="mp-card-top">
        <span className="mp-engine">{s.engine}</span>
        <ScoreGauge score={s.robustnessScore} />
      </div>
      <h3>{s.title}</h3>
      <p className="mp-summary">{s.summary}</p>
      <div className="mp-meta">
        <span>{s.asset} · {s.timeframe}</span>
        <span className="mp-period">{s.period}</span>
      </div>
      <dl className="mp-stats">
        <div><dt>Net return</dt><dd className="mp-good">{s.netReturn}</dd></div>
        <div><dt>Max DD</dt><dd className={s.maxDrawdown.startsWith("1") || s.maxDrawdown.startsWith("2") ? "mp-warn" : "mp-bad"}>{s.maxDrawdown}</dd></div>
        <div><dt>Win rate</dt><dd>{s.winRate}</dd></div>
        <div><dt>Profit factor</dt><dd>{s.profitFactor}</dd></div>
      </dl>
      <div className="mp-badges">
        {s.badges.map((b) => (
          <span key={b} className="mp-badge">{b}</span>
        ))}
      </div>
      <p className="mp-sha" title={s.sha256}><ShieldCheck size={13} /> SHA256 · {formatSha(s.sha256)}</p>
    </article>
  );
}

function LaunchListModal({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<"buyer" | "seller">("buyer");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit() {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, profile, source: "marketplace-launch-list" }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Join the launch list">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h3>Join the launch list</h3>
        <p className="mp-modal-sub">Be the first to access certified strategies when the marketplace opens.</p>
        <div className="mp-profile-toggle" role="radiogroup" aria-label="I am a…">
          <button type="button" className={profile === "buyer" ? "active" : ""} onClick={() => setProfile("buyer")}>🧑‍💻 Buyer</button>
          <button type="button" className={profile === "seller" ? "active" : ""} onClick={() => setProfile("seller")}>🏷️ Seller</button>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          aria-label="Email address"
        />
        {state === "error" ? <p className="mp-modal-err" role="alert">Please enter a valid email address.</p> : null}
        {state === "done" ? (
          <p className="mp-modal-ok" role="status">You are on the list. We will email you at launch.</p>
        ) : (
          <button className="btn btn-primary mp-modal-cta" type="button" onClick={submit} disabled={state === "sending"}>
            {state === "sending" ? "Subscribing…" : "Notify me"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceClient({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/marketplace/listings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<{ listings: Listing[] }>;
      })
      .then((payload) => setListings(payload.listings))
      .catch(() => setMessage("The verified catalogue is temporarily unavailable."));
  }, [enabled]);

  async function buy(listingId: string) {
    setMessage("Preparing secure checkout…");
    const response = await fetch("/api/marketplace/checkout-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (response.status === 401) {
      router.push(`/login?return_to=${encodeURIComponent("/marketplace")}`);
      return;
    }
    const payload = (await response.json()) as { checkout_url?: string };
    if (!response.ok || !payload.checkout_url) {
      setMessage("Checkout is not available for this strategy yet.");
      return;
    }
    const target = new URL(payload.checkout_url);
    if (target.protocol !== "https:" || !target.hostname.endsWith("stripe.com")) {
      setMessage("The payment destination was refused for security reasons.");
      return;
    }
    location.assign(target.toString());
  }

  return (
    <>
      {message ? <p className="marketplace-message" role="status">{message}</p> : null}

      {/* Vitrine des stratégies modèles auditées (toujours visible, clairement illustrative). */}
      <section aria-label="Audited model strategies" className="mp-models">
        <div className="mp-models-head">
          <div>
            <span className="marketplace-proof">Model catalogue</span>
            <h2>Audited strategies, <em>for reference.</em></h2>
          </div>
          <p>These are illustrative examples showing the final certified format — not live products for sale. No illustrative strategy is presented as a real product.</p>
        </div>
        <div className="mp-grid">
          {modelStrategies.map((s) => <StrategyCard key={s.id} s={s} />)}
        </div>
      </section>

      {enabled ? (
        <div className="marketplace-grid">
          {listings.map((listing) => (
            <article className="marketplace-card" key={listing.listing_id}>
              <span className="marketplace-proof">Certified exact version</span>
              <h2>{listing.title}</h2>
              <p>SHA256 · {listing.audit_hash.slice(0, 18)}…</p>
              <strong>{(listing.price_cents / 100).toLocaleString("en", { style: "currency", currency: listing.currency })}</strong>
              <button className="btn btn-primary" type="button" onClick={() => buy(listing.listing_id)}>Buy securely</button>
            </article>
          ))}
          {!message && listings.length === 0 ? (
            <div className="marketplace-state"><strong>No strategy for sale yet.</strong><p>Listings only appear after certification, seller verification, KYC and exact-file approval.</p></div>
          ) : null}
        </div>
      ) : null}

      {/* CTA conversion : join the launch list. */}
      <div className="mp-launch-cta">
        <div>
          <TrendingUp size={18} />
          <span>Ready to buy or sell certified strategies?</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          <Activity size={16} /> Join the launch list
        </button>
      </div>

      <p className="marketplace-seller-link"><Link href="/marketplace/seller">Certified seller area →</Link></p>

      {showModal ? <LaunchListModal onClose={() => setShowModal(false)} /> : null}
    </>
  );
}