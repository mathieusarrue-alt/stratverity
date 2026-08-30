# StratVerity frontend

Public web application for StratVerity, an evidence-based audit service for
algorithmic trading strategies.

> **Proof, not storytelling.** Public copy must never invent a client result,
> imply a profit guarantee, or present a static diagnostic as a replayed audit.

## Current product boundary

- Free Health Check: static source-code diagnostic for supported Pine Script,
  Python and MQL inputs. It is not a backtest or certification.
- Paid audit: available only for Python strategies accepted by the compatibility
  gate and replayed by the isolated backend worker.
- Launch pricing: Essential EUR 19, single-context Premium EUR 49, explicit
  multi-context Custom from EUR 79. `app/configure/pricing.ts` is the frontend
  source of truth.
- Crash-Test and Marketplace remain feature-flagged. Their presence in the
  repository does not mean they are enabled in production.
- No customer-facing paid order waits for human approval, and the audit service
  never places live orders.

## Stack

- Next.js App Router via vinext
- React 19 and TypeScript
- CSS Modules plus generated shared design tokens
- Supabase Auth with server-validated cookie sessions
- AWS Amplify frontend deployment
- FastAPI backend at `api.stratverity.com`

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and provide public browser variables only.
Never put Stripe secrets, Supabase service-role keys, AWS credentials or webhook
secrets in the frontend.

## Quality checks

```bash
npm run lint
npm run build
npm test
```

The landing page and the 12-language catalogue are generated from canonical
sources:

- `design-refonte/landing.html`
- `scripts/app-messages.mjs`
- `scripts/port-design-refonte.mjs`

Do not edit `app/home/landing-markup.ts`, `app/i18n/messages.ts` or the generated
landing portion of `app/globals.css` directly. Regenerate them with:

```bash
node scripts/port-design-refonte.mjs
```

## Feature flags

The public defaults are fail-closed in `.env.example`:

- `NEXT_PUBLIC_CRASH_TEST_ENABLED=false`
- `NEXT_PUBLIC_FREE_ELIGIBILITY_ENABLED=false`
- `NEXT_PUBLIC_MARKETPLACE_ENABLED=false`
- `NEXT_PUBLIC_MARKETPLACE_COMMERCE=false`

Changing a frontend flag does not activate its backend contract, payment path or
delivery worker. Each surface requires its own end-to-end release evidence.

## Coordination

Read `AGENTS.md` and `design-refonte/HANDOFF_TO_GPT_2026-08-30.md` before making
changes. The backend and cross-LLM governance live in the sibling
`SAAS_AUDIT_BACKTEST` project. Preserve concurrent work and update the existing
handoff instead of creating a competing status document.
