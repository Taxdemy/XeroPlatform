# Agentic Accounting

Australian multi-tenant accounting platform (ledger-first). This repository implements the native double-entry engine that will allow Agentic Accounting to replace Xero for supported clients.

## Stack

- Next.js (App Router) + TypeScript
- Drizzle ORM + PGlite (local/CI) / PostgreSQL (production)
- Integer minor-unit money (AUD cents)
- Vitest for accounting invariant tests

## Quick start

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run dev
```

Open http://localhost:3000 — register a practice, create a business, post journals, view trial balance.

## Documentation

See `docs/` for product requirements, architecture, schema, accounting rules, compliance, API, integrations, test plan, decisions, and implementation progress.

## Phase status

**Phase 1 in progress:** multi-tenancy, auth, chart of accounts, GST tax codes, periods, journal posting/reversal, trial balance / GL, minimal UI, automated tests.
