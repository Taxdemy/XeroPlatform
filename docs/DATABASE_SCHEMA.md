# Database Schema

Money columns use `bigint` **minor units** (AUD cents). Never `real`/`double` for money.

## Phase 1 tables

### `practices`
Tenant root. `id`, `name`, `slug` (unique), `created_at`, `updated_at`.

### `users`
`id`, `email` (unique), `password_hash`, `full_name`, `is_platform_admin`, timestamps.

### `practice_memberships`
`id`, `practice_id`, `user_id`, `role` (enum), unique `(practice_id, user_id)`.

Roles: `practice_owner`, `practice_admin`, `accountant`, `senior_accountant`, `bookkeeper`, `payroll_specialist`, `business_owner`, `business_manager`, `employee`, `external_adviser`, `client_portal_user`, `read_only_auditor`.

### `businesses`
Legal entities. Key fields: `practice_id`, legal/trading names, `abn`, `acn`, `entity_type`, `gst_registered`, `gst_basis` (`cash`|`accrual`), `bas_cycle`, `bas_reporting_method`, `financial_year_end_month`/`day`, `timezone`, `currency` (default `AUD`), `conversion_date`, addresses JSON, payroll identifiers JSON, `status`.

### `business_access`
`business_id`, `user_id`, `can_view`, `can_edit`, `can_post`, `can_approve`, `can_lodge`, `can_pay`, `can_export`, `can_delete`.

### `tax_codes`
Per-business AU GST codes: `code`, `name`, `rate_bp` (basis points, 1000 = 10%), `tax_type`, `bas_field`, `is_active`.

Seed defaults (Xero-like): `GST`, `GSTFREE`, `EXPORT`, `INPUT`, `CAPEX`, `EXEMPT`, `BASEXCLUDED`, etc.

### `accounts` (chart of accounts)
`business_id`, `code`, `name`, `type` (`asset`|`liability`|`equity`|`revenue`|`expense`), `subtype`, `tax_code_id`, `is_system`, `is_active`, `parent_id`, unique `(business_id, code)`.

### `accounting_periods`
`business_id`, `name`, `start_date`, `end_date`, `status` (`open`|`locked`|`closed`), unique non-overlapping enforced in service.

### `journals`
`business_id`, `practice_id`, `journal_number`, `date`, `narration`, `source_type`, `source_id`, `status` (`draft`|`posted`|`reversed`), `idempotency_key`, `posted_at`, `posted_by`, `reversal_of_journal_id`, `period_id`.

Unique: `(business_id, idempotency_key)` where key not null; `(business_id, journal_number)`.

### `journal_lines`
`journal_id`, `business_id`, `line_no`, `account_id`, `description`, `debit_cents`, `credit_cents`, `tax_code_id`, `tax_cents`, tracking category refs (nullable Phase 1).

Check: exactly one of debit/credit non-zero per line (or allow both zero only for placeholders — Phase 1 rejects both-zero and both-nonzero).

### `audit_events`
`practice_id`, `business_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip`, `created_at`.

### `sessions`
`id`, `user_id`, `token_hash`, `expires_at`, `created_at`.

## Later tables (documented, not yet migrated)

Customers, suppliers, invoices, bills, payments, bank_accounts, bank_transactions, reconciliations, employees, pay_runs, fixed_assets, inventory_items, attachments, workflows, ai_agent_runs, integrations — see phase backlog in `IMPLEMENTATION_PROGRESS.md`.

## Integrity rules

1. Journal post: sum(debit_cents) = sum(credit_cents) > 0.  
2. No UPDATE/DELETE of posted journal headers/lines (app-enforced; DB triggers planned for hosted Postgres).  
3. Foreign keys cascade carefully — never orphan lines.  
4. Soft-delete preferred for master data (`is_active = false`).
