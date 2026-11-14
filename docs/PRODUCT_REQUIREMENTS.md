# Agentic Accounting — Product Requirements

**Product:** Agentic Accounting  
**Website:** https://agenticaccounting.com.au  
**Primary market:** Australian accounting practices and their SME clients  
**Primary goal:** Production-grade Australian accounting platform capable of replacing Xero for supported clients, plus AI automation, workpapers, client communication, and practice management.

## Current product context (external)

The live marketing site describes practice-orchestration agents that today connect **to** Xero (billing), Xero Practice Manager, email, Drive/SharePoint, Annature, and ATO reports. This repository (`Taxdemy/XeroPlatform`) is the greenfield **native ledger** that will make Agentic Accounting a Xero replacement rather than a Xero-dependent layer.

Taxdemy’s existing AI Accounting MCP (engagements, documents, questionnaires, workpapers) informs Phase 4 workpaper/questionnaire design; it is not source code in this repo.

## Repository baseline (Phase 0 audit — 2026-11-14)

| Area | Finding |
|------|---------|
| Code | Empty except `README.md` (`# XeroPlatform`) |
| Frontend / backend | None |
| Database / migrations / RLS | None |
| Auth / storage / jobs | None |
| Tests / CI / deploy | None |
| Integrations | None in-repo |

**Baseline commands:** N/A (no package.json). After Phase 1 scaffold: `npm run lint`, `npm run typecheck`, `npm test`, `npm run dev`.

## Feature-gap matrix (vs master specification)

| Domain | Spec target | Status | Notes |
|--------|-------------|--------|-------|
| Multi-tenancy, roles, businesses | Full RBAC + entity config | **In development (Phase 1)** | Greenfield |
| Chart of accounts, periods | Full | **In development (Phase 1)** | |
| Double-entry ledger / journals | Balanced posting, audit, locks | **In development (Phase 1)** | Highest priority |
| GST tax codes | AU codes + cash/accrual config | **In development (Phase 1)** | Config + codes; BAS later |
| Bank feeds / reconciliation | CDR + reconcile workspace | Not started | Phase 2/5 |
| AR / invoicing | Full subledger | Not started | Phase 3 |
| AP / bills / OCR | Full subledger | Not started | Phase 3/4 |
| Financial reports | P&L, BS, TB, GL | Phase 1: TB/GL; rest Phase 2 | |
| Payroll / STP / Super | AU payroll subsystem | Not started | Phase 7; regulatory deps |
| BAS / IAS / tax | Prep + lodgment path | Not started | Phase 6 |
| Inventory / FA / FX | Advanced | Not started | Phase 8 |
| Client portal | Mobile-first | Not started | Phase 4 |
| Practice management | Cross-client ops | Partial concept on marketing site | Phase 9 |
| AI agents (15) | Orchestrated specialists | Marketing only | Phases 4/9 |
| Workpapers / questionnaires | Evidence-first | Exists in Taxdemy product; not here | Phase 4 |
| Xero migration wizard | Export-based, lawful | Not started | Phase 10 |
| Open Banking | Basiq/Fiskil adapter | Awaiting provider | Phase 5 |
| ATO DSP / SBR / STP | Compliant pathways | Awaiting registration | Phases 6–7 |

## User roles (required)

Platform Super Administrator; Practice Owner; Practice Administrator; Accountant; Senior Accountant / Reviewer; Bookkeeper; Payroll Specialist; Business Owner; Business Manager; Employee; External Adviser; Client Portal User; Read-Only Auditor.

Permissions must cover view, edit, post, approve, lodge, pay, export, delete — scoped by practice and business entity.

## Business configuration (required per entity)

Legal/trading name; ABN/ACN/entity type; GST registration & basis; BAS cycle/method; FYE; timezone/currency; payroll identifiers; addresses/contacts; accounting policies; opening balances & conversion date.

## Definition of done (per feature)

Database design; business logic; APIs; functional UI; permissions; correct accounting entries; audit; validation/errors; automated tests passing; docs updated; realistic E2E scenario; regulatory/provider gaps labelled.

## Status vocabulary

Not started · In development · Implemented, untested · Tested · Awaiting external provider · Awaiting regulatory approval · Ready for pilot · Production ready
