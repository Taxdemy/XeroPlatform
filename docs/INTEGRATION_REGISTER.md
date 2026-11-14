# Integration Register

| Integration | Purpose | Status | Blocker |
|-------------|---------|--------|---------|
| PostgreSQL (hosted) | Primary datastore | Declared via `cursor-app.json`; local/PGlite when `DATABASE_URL` unset | Published app gets platform DB on republish |
| Open Banking (Basiq/Fiskil/…) | Bank feeds | Not started | Commercial + CDR accreditation |
| ATO DSP / SBR | Lodgment | Not started | DSP registration |
| STP gateway | Payroll reporting | Not started | Accredited partner / approval |
| SuperStream gateway | Super payments | Not started | Eligible provider |
| Payment processor | Invoice payment links | Not started | Merchant agreement |
| Peppol access point | eInvoicing | Not started | Access point contract |
| Email (SES/Postmark/…) | Notices, invoices | Not started | Provider + domain |
| SMS | Alerts | Not started | Provider |
| Google / Microsoft | Drive, mail, SSO | Not started | OAuth apps |
| Annature | eSign (current marketing) | External to this repo | — |
| Xero API | Legacy bridge only | **Do not use for competing migration without legal review** | Platform terms |
| AI: OpenAI / Anthropic / xAI | Agents | Not started | API keys in secrets manager |
| Object storage (S3-compatible) | Documents | Not started | Bucket + IAM |
| Malware scanning | Uploads | Not started | Scanner service |

Each future adapter must expose: credentials vault ref, sandbox mode, health, sync state, error log, retries, webhook verification, tests, UI connection status.
