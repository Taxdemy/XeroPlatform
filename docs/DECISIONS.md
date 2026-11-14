# Architecture Decision Records

## ADR-001: Greenfield native ledger in XeroPlatform

- **Context:** Repo was empty; marketing product orchestrates around Xero.  
- **Decision:** Build native double-entry platform here as Agentic Accounting ledger.  
- **Status:** Accepted.

## ADR-002: Next.js + Drizzle + PostgreSQL/PGlite

- **Context:** Need full-stack TS, strong migrations, CI without managed DB.  
- **Decision:** Next.js App Router, Drizzle ORM, PGlite for tests/dev default, Postgres URL when provided.  
- **Status:** Accepted.

## ADR-003: Integer minor units for money

- **Context:** Float money causes silent errors.  
- **Decision:** `bigint` cents everywhere in DB and engine.  
- **Status:** Accepted.

## ADR-004: Manual journals first

- **Context:** Spec requires full source map; engine must exist first.  
- **Decision:** Phase 1 ships posting engine + manual journals; AR/AP/bank call same engine later.  
- **Status:** Accepted.

## ADR-005: No fake production integrations

- **Context:** Spec forbids simulated bank/lodgment success.  
- **Decision:** Adapters return explicit `not_configured` until credentials + approvals exist.  
- **Status:** Accepted.

## ADR-006: Export-first Xero migration

- **Context:** Legal risk of API misuse for competitor migration.  
- **Decision:** Prioritise client-controlled file imports; legal review before any Xero API extraction.  
- **Status:** Accepted.

## ADR-007: Session auth before MFA

- **Context:** Need auth for tenancy tests immediately.  
- **Decision:** scrypt passwords + httpOnly session cookies in Phase 1; MFA in hardening phase.  
- **Status:** Accepted.
