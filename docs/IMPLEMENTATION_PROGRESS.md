# Implementation Progress

**Last updated:** 2026-11-14  
**Branch:** `cursor/phase1-accounting-engine-dc3e`  
**Checkpoint:** Fixed published-app registration by wiring platform Postgres (`DATABASE_URL` + `migrations/` + `cursor-app.json`).

## A. Existing architecture

Greenfield `Taxdemy/XeroPlatform` (was empty README). Now:

- Next.js App Router + TypeScript + Tailwind
- Drizzle schema + PGlite SQL migrations (`src/server/db`)
- Domain services: auth, access, businesses, ledger engine, reports
- REST `/api/v1/*` + practice/business UI shells

## B. Features already implemented

| Feature | Status |
|---------|--------|
| Product docs set | Tested |
| Practice registration / login / sessions | Tested |
| Multi-tenant practices + businesses + access flags | Tested |
| AU default tax codes + chart of accounts seed | Tested |
| Accounting periods + lock | Tested |
| Manual journal draft / post / reverse | Tested |
| Idempotency keys | Tested |
| Trial balance + general ledger | Tested |
| Audit events on key actions | Implemented, covered via engine flows |
| UI: home, register, login, dashboard, accounting, reports, settings | Implemented (manual smoke via build) |

## C. Gap vs Xero replacement

Still missing: bank feeds/reconcile, AR/AP, payroll, BAS lodgment, inventory/FA/FX, client portal, practice ops at scale, AI agents, Xero migration wizard, hosted Postgres RLS, MFA, CDR/ATO integrations.

## D. Security / integrity risks

| Risk | Status |
|------|--------|
| Service-layer tenant checks | Implemented for Phase 1 APIs/pages |
| No Postgres RLS yet | Outstanding until hosted DB |
| No MFA | Outstanding |
| PGlite local store | Dev/test only — not production HA |
| External integrations | Explicitly not faked |

## E. Database architecture

See `DATABASE_SCHEMA.md`. Applied via `PHASE1_DDL` in `src/server/db/migrate.ts`.

## F. Phase backlog

### Phase 0 ✅
### Phase 1 🔄 nearly complete for MVP vertical
- [x] Scaffold app
- [x] Schema/migrations
- [x] Auth + roles + business access
- [x] COA + periods + tax codes
- [x] Journal draft/post/reverse
- [x] Trial balance + GL
- [x] Minimal UI
- [x] Vitest suite (11 passing)
- [x] typecheck / build green
- [ ] Hosted Postgres wiring + RLS policies
- [ ] Broader E2E browser tests

### Phase 2 next
Bank statement CSV/OFX/QIF import, reconciliation workspace, P&amp;L / Balance Sheet, opening balances wizard.

## Test results (2026-11-14)

```
npm test       → 11 passed
npm run typecheck → pass
npm run build  → pass
npm run lint   → pass (after server-component refactor)
```

## Next implementation step

1. Merge Phase 1 PR.  
2. Start Phase 2: `bank_accounts`, `bank_transactions`, statement import parsers, match suggestions (deterministic first), P&amp;L/BS report builders.  
3. Wire `DATABASE_URL` Postgres path beside PGlite for staging.
