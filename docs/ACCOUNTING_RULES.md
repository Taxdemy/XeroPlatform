# Accounting Rules

Deterministic rules enforced by the accounting engine. AI cannot override these.

## Money

- Store amounts as integer **cents** (`bigint`).  
- Display with `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`.  
- Rounding: half-up to nearest cent on tax splits unless a statute requires otherwise (document per calc).

## Double-entry

1. Every posted journal has ≥ 2 lines.  
2. Σ debits = Σ credits (exact).  
3. A line has either debit > 0 or credit > 0, not both, not neither.  
4. Accounts must belong to the same business as the journal.  
5. Draft journals may be unbalanced while editing; posting requires balance.

## Lifecycle

| Status | Allowed transitions |
|--------|---------------------|
| `draft` | → `posted` (if valid); editable; deletable |
| `posted` | → `reversed` via creating a reversing journal; not editable |
| `reversed` | terminal for original; reversal journal is `posted` |

Reversals copy lines with debit/credit swapped, same date or specified reversal date, link `reversal_of_journal_id`.

Reports include both `posted` and `reversed` journals so the original and its offsetting reversal remain in the ledger history (netting to zero when the full set is in range).

## Period controls

- Journal date must fall in an `open` period (or create period if auto-period enabled — Phase 1 requires explicit open period).  
- `locked` / `closed` periods reject posting and reversal.  
- Year-end close (later): P&amp;L to retained earnings; opening balances for next FY.

## Source posting map (target)

| Source | Typical debit | Typical credit |
|--------|---------------|----------------|
| Sales invoice | Accounts receivable | Revenue (+ GST collected) |
| Customer payment | Bank | Accounts receivable |
| Supplier bill | Expense/asset (+ GST paid) | Accounts payable |
| Supplier payment | Accounts payable | Bank |
| Credit note (sales) | Revenue (+ GST) | Accounts receivable |
| Refund | Accounts receivable / expense | Bank |
| Bank transfer | Bank B | Bank A |
| Manual journal | As specified | As specified |
| Payroll | Wages expense, etc. | Bank / liabilities |
| PAYG / Super | Expense or clearing | Liability |
| GST settlement | GST liability/asset | Bank |
| Fixed asset buy | Asset (+ GST) | Bank/AP |
| Stock movement | Inventory / COGS | Inventory / Clearing |
| FX revaluation | Expense/equity | Asset/liability |

Phase 1 implements **manual journals** end-to-end. Other sources land in later phases but must call the same `postJournal` API.

## GST (configuration Phase 1)

- Business: `gst_registered`, `gst_basis` (`cash`|`accrual`), BAS cycle.  
- Line tax codes carry `rate_bp` and BAS field hints.  
- Inclusive vs exclusive: engine helpers compute tax and net from gross or net+tax.  
- Cash vs accrual recognition for BAS is Phase 6; ledger posts tax on accrual lines at invoice time unless configured otherwise.

## Reports (Phase 1)

- **Trial balance:** sum posted lines by account for period/date range.  
- **General ledger:** lines by account with running balance.  
- P&amp;L / Balance sheet: Phase 2 (classify by account type + date).

## Idempotency

If `idempotency_key` is set and a journal already exists for that business+key, return the existing journal (no duplicate post).

## Concurrency

Posting uses a transaction; journal numbers allocated inside the same transaction with row lock on business counter / `max(journal_number)+1`.
