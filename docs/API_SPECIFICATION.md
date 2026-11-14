# API Specification (Phase 1)

Base path: `/api/v1`. JSON request/response. Auth: session cookie `aa_session`.

Errors: `{ "error": { "code": string, "message": string, "details"?: unknown } }`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create user + practice (bootstrap) |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Current user, memberships |

## Practices & businesses

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/practices` | List practices for user |
| GET | `/api/v1/practices/:id/businesses` | List businesses |
| POST | `/api/v1/practices/:id/businesses` | Create business |
| GET | `/api/v1/businesses/:id` | Business detail |
| PATCH | `/api/v1/businesses/:id` | Update business config |

## Chart of accounts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/businesses/:id/accounts` | List accounts |
| POST | `/api/v1/businesses/:id/accounts` | Create account |
| POST | `/api/v1/businesses/:id/accounts/seed-default` | Seed AU default COA |

## Periods

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/businesses/:id/periods` | List periods |
| POST | `/api/v1/businesses/:id/periods` | Create period |
| POST | `/api/v1/businesses/:id/periods/:periodId/lock` | Lock period |

## Tax codes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/businesses/:id/tax-codes` | List tax codes |
| POST | `/api/v1/businesses/:id/tax-codes/seed-default` | Seed AU GST codes |

## Journals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/businesses/:id/journals` | List journals |
| POST | `/api/v1/businesses/:id/journals` | Create draft |
| GET | `/api/v1/businesses/:id/journals/:journalId` | Get journal |
| POST | `/api/v1/businesses/:id/journals/:journalId/post` | Post (balance check) |
| POST | `/api/v1/businesses/:id/journals/:journalId/reverse` | Reverse posted journal |

### Create draft body

```json
{
  "date": "2026-07-01",
  "narration": "Opening adjustment",
  "idempotencyKey": "optional-unique-key",
  "lines": [
    { "accountId": "uuid", "description": "Rent", "debitCents": 11000, "creditCents": 0, "taxCodeId": "uuid" },
    { "accountId": "uuid", "description": "Bank", "debitCents": 0, "creditCents": 11000 }
  ]
}
```

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/businesses/:id/reports/trial-balance?from=&to=` | Trial balance |
| GET | `/api/v1/businesses/:id/reports/general-ledger?accountId=&from=&to=` | GL |

## Permissions

Mutations require membership + business access flags (`can_edit` / `can_post` / `can_approve` as applicable). Cross-practice IDs return `404` (not `403`) to avoid leakage.
