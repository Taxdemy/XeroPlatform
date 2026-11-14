# Architecture

## Decisions (Phase 1)

| Choice | Rationale |
|--------|-----------|
| Next.js (App Router) + TypeScript | Full-stack SaaS, typed APIs, SSR for portal/practice UI |
| PostgreSQL via Drizzle ORM | Relational integrity for ledger; migrations as code |
| PGlite for local/CI tests | Deterministic tests without external DB dependency |
| Money as integer minor units (`bigint` cents) | Exact arithmetic; never binary float |
| Domain services in `src/server/` | Pure accounting logic testable without HTTP |
| Route Handlers + Zod | Strongly typed request/response validation |
| Session auth (credentials + httpOnly cookies) | Phase 1 baseline; MFA in security hardening phase |
| Tenant isolation in service layer + DB constraints | RLS policies added when hosted Postgres is wired |

## High-level diagram

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App (UI: Practice / Business / Portal shells)  │
└───────────────────────────┬─────────────────────────────┘
                            │ Route Handlers / Server Actions
┌───────────────────────────▼─────────────────────────────┐
│  Application services (authz, orgs, ledger, reports)    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Accounting engine (posting, balance, periods, tax)     │
└───────────────────────────┬─────────────────────────────┐
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Drizzle → PostgreSQL / PGlite                          │
│  Tables: practices, users, memberships, businesses,     │
│  accounts, periods, tax_codes, journals, lines, audit   │
└─────────────────────────────────────────────────────────┘
```

## Multi-tenancy model

1. **Practice** = tenant (accounting firm).  
2. **Business** = legal entity belonging to a practice (client’s company/trust/etc.).  
3. **Membership** binds a user to a practice with a role.  
4. **BusinessAccess** grants a user access to specific businesses within that practice.  
5. All ledger rows carry `practice_id` + `business_id`. Services reject cross-tenant access.

## Accounting engine invariants

- Posted journals must balance (Σ debit = Σ credit) in minor units.  
- Posting is atomic; failed validation rolls back.  
- Posted journals are immutable; corrections via reversal journals.  
- Locked periods reject new postings.  
- Idempotency keys prevent duplicate source postings.  
- AI may suggest journals; only authorised humans (or approved automation with policy) post.

## Integration ports (future)

Abstract interfaces under `src/server/integrations/`:

- `BankFeedProvider` (CDR / Open Banking)  
- `PaymentProcessor`  
- `StpGateway` / `SuperStreamGateway`  
- `AiModelProvider`  
- `EmailProvider`  

No fake “connected” states in production paths.

## Security (baseline → target)

**Phase 1:** password hashing (scrypt), session cookies, role checks on every mutating API, audit log rows.  
**Later:** MFA, hosted Postgres RLS, malware scanning, secrets vault, rate limits, DSP/CDR control packs.

## Frontend navigation (target)

Dashboard, Banking, Sales, Purchases, Payroll, Accounting, Reports, Tax & BAS, Workpapers, Clients, Practice, AI Agents, Automations, Integrations, Settings — filtered by role.
