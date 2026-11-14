# Test Plan

## Tooling

- **Vitest** — unit + service integration (PGlite).  
- **Playwright** — E2E (added when UI flows stabilize).  
- Scripts: `npm test`, `npm run typecheck`, `npm run lint`.

## Phase 1 mandatory cases

| Case | Expectation |
|------|-------------|
| Balanced journal posts | Status `posted`, immutable |
| Unbalanced journal post | Rejected; no partial write |
| Line with both debit and credit | Rejected |
| Line with neither | Rejected |
| Wrong-business account on line | Rejected |
| Locked period posting | Rejected |
| Idempotent post | Same key → same journal, no duplicate |
| Reversal | New balanced opposite journal; original `reversed` |
| Cross-tenant business read | Denied / not found |
| Role without `can_post` | Post denied |
| Trial balance | Matches sum of posted lines |
| Money type | No float in schema paths |

## Later suites

Bank matching, GST BAS calcs, payroll regression (tax tables), AR/AP subledger↔GL, AI structured-output safety, import/export, load, backup/restore.

## Synthetic AU scenarios (build over phases)

GST registered/unregistered; cash/accrual; invoices + partial payments; credit notes; duplicate bank txns; multi-account; payroll/super; period adjustments; FY close; FA buy/sell; FX.

## Acceptance gates

Every posted journal balances; reports reconcile to ledger; no silent GST/payroll rounding errors; no duplicate source postings; no cross-tenant leakage; no fake integration success; audit trail on material changes.
