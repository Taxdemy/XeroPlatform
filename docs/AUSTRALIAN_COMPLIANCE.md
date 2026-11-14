# Australian Compliance

This document tracks obligations and **honest status**. Code alone does not equal regulatory approval.

## Privacy

| Obligation | Status |
|------------|--------|
| Australian Privacy Principles (APPs) | Design target; DPIA & policies not yet completed |
| Notifiable Data Breaches | Incident process documented later; monitoring not wired |
| TFN handling | Must use lawful collection; never log TFNs; never send TFNs to LLMs |
| Consent for AI on client files | Required (align with Taxdemy consent model) |

## Tax / ATO

| Area | Status |
|------|--------|
| GST configuration & tax codes | Phase 1 (config + codes) |
| BAS / IAS preparation | Phase 6 — draft/export first |
| Direct ATO lodgment (SBR/DSP) | **Awaiting DSP registration & conformance** |
| PAYG withholding tables | Phase 7 — versioned tables |
| STP Phase 2 | **Awaiting accredited pathway / partner** |
| Payday Super | Phase 7 — timing rules + SuperStream partner |
| SuperStream | **Awaiting eligible gateway provider** |
| TPAR | Later |
| FBT / income tax returns | Later advanced modules |

**Rule:** Do not show fake “lodged successfully” without a real lodgment receipt from an approved channel.

## Open Banking / CDR

| Area | Status |
|------|--------|
| Bank feed provider (Basiq / Fiskil / other) | **Awaiting commercial agreement & accreditation** |
| Consent lifecycle | Phase 5 |
| Production simulation | **Forbidden** |

## Employment

Fair Work / awards / payroll calculations require versioned rules and specialist review before production reliance.

## Record retention

Accounting and tax records retained per ATO and Corporations Act expectations (generally 5+ years). Deletion controls must respect legal holds.

## Security reviews

Independent security review and, where applicable, ATO DSP IRAP-aligned controls are **outstanding** before production client reliance.

## Xero migration legality

Prefer client-controlled exports and licensed pathways. Do **not** assume Xero API may be used to build a competing product or migrate users in breach of platform terms. Review current Xero developer/platform terms before implementing extraction.
