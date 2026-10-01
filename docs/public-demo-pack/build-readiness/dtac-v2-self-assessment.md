# DTAC v2 Self-Assessment (Working Document)

Status date: 3 July 2026
Board item: SF-219
Authored directly (Claude, Oli's-codex role), docs-only change. Not a submitted DTAC — an honest internal RAG against the Digital Technology Assessment Criteria v2 (form published 24 Feb 2026, mandatory from 6 Apr 2026), so gaps are tracked before anyone else asks.

SafeFlow is simulation-only today; DTAC applies at the point a trust assesses a product for use. This document exists so that when that day comes, nothing here is a surprise.

## Domain 1 — Clinical safety

| Item | Status | Evidence / gap |
|---|---|---|
| DCB0129 clinical risk management system | AMBER | `clinical-safety-case-outline.md` + 10-row hazard log exist; not independently reviewed; no formal CRM process document |
| Named Clinical Safety Officer | RED | Not appointed. Route identified: project owner (registered nurse) can complete CSO training — decision pending |
| Hazard log maintained | GREEN (for scope) | HAZ-01–HAZ-10 grounded in actual code contracts (`signalClient.js` envelope, deployment guard) |
| Clinical safety case | AMBER | Outline exists; full case gated on pilot scope and CSO appointment |

## Domain 2 — Data protection

| Item | Status | Evidence / gap |
|---|---|---|
| DPIA | GREEN (n/a today) / RED (for live) | No personal data processed — fictional patients only. DPIA template should be drafted before any pilot collecting even staff feedback linked to identity |
| DSPT registration | RED | Not registered. Requires organisation decision (company formation gate — see strategy pack: visa/IP checks first) |
| Data flows documented | AMBER | `clinical-safety-ig-readiness.md` covers the picture; no formal data-flow diagram |
| Evaluation-session data handling | AMBER | Feedback forms must be anonymous-by-default — see `evaluation-framework.md` |

## Domain 3 — Technical assurance (security)

| Item | Status | Evidence / gap |
|---|---|---|
| Secure development practice | AMBER | PR discipline, file budgets, safety-wording scans in CI (partial — SF-127 gap open); no formal SDLC doc |
| Penetration test | RED (n/a today) | Required pre-deployment only; note for pilot budget |
| Fail-closed deployment controls | GREEN | `SAFEFLOW_DEPLOYMENT_APPROVED` exact-string guard + tests (SF-117, SF-123) |
| Authentication/RBAC | RED | No identity layer. Planned: pluggable provider seam mirroring CIS2 roles/activities model (SF-207) |
| Audit logging | AMBER | `workflowEvents.js` records simulation audit entries; not a security audit log |

## Domain 4 — Interoperability

| Item | Status | Evidence / gap |
|---|---|---|
| Standards-based data model (UK Core FHIR R4) | RED | Internal model (SF-209/SF-216) is bespoke; mapping assessment needed — see `nhs-integration-readiness.md` |
| SNOMED CT coding | RED | Simulated events/observations not SNOMED-coded; additive task scoped for Mia's codex (SF-222) |
| API strategy | AMBER | No national API exists for ward/bed state — live integration will be a local MEDITECH Expanse adapter; keep adapter-shaped |

## Domain 5 — Usability and accessibility

| Item | Status | Evidence / gap |
|---|---|---|
| WCAG conformance | GREEN (AA pass done) | SF-124 (PR #17): focus states, contrast, ARIA, keyboard nav. Needs re-audit after each major UI change |
| NHS design/service-manual alignment | AMBER | Custom design tokens exist (SF-118); not mapped to NHS design system |
| User research/usability evidence | RED | No structured user evidence yet — this is SF-210's job; the single most valuable gap to close |

## Priority order for closing gaps

1. SF-210 evaluation framework → produces the usability/user-evidence DTAC wants and the strategy needs (docs now in `evaluation-framework.md`).
2. SF-127 safety-language scan (CI enforcement of Domain 1 controls) — scoped for Mia's codex.
3. SF-222 SNOMED coding of fixtures + FHIR mapping assessment (Domain 4) — scoped for Mia's codex.
4. CSO training decision (Domain 1) — human decision, ties to CEP Cohort 11 narrative.
5. DSPT/DPIA — gated on company formation (visa + IP checks first; see strategy pack).

Review trigger: update this file whenever a listed item changes status, and before any external conversation that may reference DTAC.
