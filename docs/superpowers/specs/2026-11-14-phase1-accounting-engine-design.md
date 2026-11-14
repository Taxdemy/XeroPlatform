# Phase 1 Design — Multi-tenancy & Accounting Engine

Approved by master build instruction (implementation assignment): proceed without waiting for interactive brainstorm gates.

## Scope

Practices, users, memberships, businesses, business access, chart of accounts, accounting periods, AU tax codes, draft/post/reverse journals, trial balance, general ledger, session auth, audit log, Vitest on PGlite, minimal Accounting UI.

## Out of scope

Bank feeds, AR/AP, payroll, BAS lodgment, AI agents, Xero import.

## Components

1. `src/server/db` — schema + client (PGlite/Postgres)  
2. `src/server/auth` — register/login/session/password  
3. `src/server/access` — practice/business permission checks  
4. `src/server/ledger` — posting engine  
5. `src/server/reports` — trial balance, GL  
6. `src/app/api/v1/*` — HTTP API  
7. `src/app/(app)/*` — UI shells  

## Testing

Vitest + in-memory PGlite; accounting invariant suite from TEST_PLAN.md.
