# P0 — Audit client auto-delivery (front contracts)

**Status:** backend tarball `backtestproof-backend-0.30.0-20260822-p0audit` (+ webhook branch pending)
**Flag:** `STRATVERITY_AUTO_DELIVERY_ENABLED`

## Policy (non-negotiable)

- Zero human review on any client paid path (Essential / Standard / Robustness / Custom).
- Strategy source uploaded **before** Stripe; never re-uploaded after payment.
- Post-paid upload allowed only as `BACKTEST_EVIDENCE` (optional).
- Final nominal statuses: `DELIVERED` or `AVAILABLE_PENDING_REPORT` (explicit, not a silent loop).

## API surface (backend)

| Method | Path | Role |
|--------|------|------|
| POST | `/v1/checkout-artifacts/preview` | Pre-checkout scope-scan + warnings (`requires_confirmation`) |
| POST | `/v1/orders/{id}/auto-deliver` | Run auto pipeline (also invoked from paid webhook when wired) |
| GET | `/v1/orders/{id}/status` (or auto status) | `DELIVERED` \| `AVAILABLE_PENDING_REPORT` \| … |

### Scope-scan gate

If strategy source implies multi-TF / multi-asset / multi-strategy beyond selected scope:

- response includes `warnings[]` + `requires_confirmation: true`
- front must show warning and require explicit “Je valide mes choix”
- only then create Stripe Checkout Session

### Evidence

- CSV / trade export **not required** to leave the paid dead-end.
- Missing evidence → `AVAILABLE_PENDING_REPORT` + clear CTA to upload **BACKTEST_EVIDENCE only**.
- Present evidence → pipeline can reach `DELIVERED` + email.

## Front checklist

1. [x] `/configure`: closed market catalog only (no custom symbol) — see `app/config/market-catalog.ts`
2. [ ] Pre-checkout: upload strategy + email + scope preview
3. [ ] Success page: **no** strategy re-upload; poll status; show report or pending evidence
4. [ ] Share buttons + email copy of report when `DELIVERED`
5. [ ] Reject post-paid `STRATEGY_SOURCE` uploads in UI

## Deploy notes

- Backend: SSM tarball (not this git repo).
- Enable `STRATVERITY_AUTO_DELIVERY_ENABLED` only after paid webhook → `auto-deliver` is wired.
- Frontend Amplify: merge this branch when contract + success UX ready.
