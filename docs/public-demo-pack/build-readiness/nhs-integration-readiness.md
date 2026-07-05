# NHS Integration Readiness (SF-205 — research only, no live integration)

Status date: 3 July 2026
Authored directly (Claude, Oli's-codex role) from primary research on digital.nhs.uk/developer (verified 3 July 2026). Research mode only per SF-205; nothing here authorises integration work.

## 1. The onboarding path a live SafeFlow would follow

Verified 7-step flow ([getting started](https://digital.nhs.uk/developer/getting-started)): learn APIs → create developer account on the API platform → confirm use case → design/build → test (sandbox → integration) → onboarding/assurance ("SCAL" or "digital onboarding") → go live. The assurance gate requires: ODS code, DSPT completion, DCB0129 conformance (our hazard log is the seed), medical-device status check, conformance + penetration testing, signed connection agreement.

Cheap now: create the free developer account; nothing else.

## 2. APIs that matter to SafeFlow (and when)

| API / service | What | When it matters |
|---|---|---|
| Personal Demographics Service (PDS) FHIR | Patient identity: NHS number, demographics, registered GP | First live integration candidate — identity is the root of everything |
| CIS2 authentication + National RBAC | Staff identity; roles/activities/permissions model | Design seam NOW (see §4); integrate at pilot |
| Terminology Server FHIR | SNOMED CT lookup/validate/expand | Code fixtures now via browser lookup (no integration); system-to-system at pilot |
| MESH | Org-to-org messaging (discharge/transfer-of-care messages ride on it) | Live handover/discharge messaging, post-pilot |
| NHS login | Patient-facing identity | Not applicable — SafeFlow is staff-facing; ignore unless a patient/family view is ever built |

**Negative finding worth preserving:** there is no national NHS API for ward/bed state, patient flow at ward level, or NEWS2. Live ward-state data will come from a *local* MEDITECH Expanse interface negotiated with the trusts (HL7v2/FHIR). Design that layer as an adapter with our own internal model in the middle — do not guess a national schema that doesn't exist.

## 3. Standards that shape the data model

- **UK Core FHIR R4** (DAPB4020) — the mandated England profile set. Target internal shapes: Patient, Encounter, Observation, Task, Communication. We are not FHIR-native today (SF-209/SF-216 are bespoke); a mapping assessment is the first step, not a rewrite.
- **SNOMED CT** — mandatory clinical terminology. Simulated observations/events should carry real SNOMED codes even for fictional patients (task SF-220): near-zero cost now, makes every fixture portable later.
- **DCB0129/0160** — manufacturer/deployer clinical risk. Note: public consultation on both standards open until 11 Sept 2026 — responding is a visibility opportunity (strategy pack item).
- **DTAC v2** — tracked in `dtac-v2-self-assessment.md`.

## 4. The CIS2 seam (design now, integrate later)

CIS2 uses OAuth 2.0 with a roles/activities/permissions RBAC model ([security & authorisation guide](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation)). The cheap future-proofing move: define an identity-provider interface in the app — `getCurrentUser() → { id, displayName, roles: [], activities: [] }` — backed today by a mock provider with SafeFlow's simulation roles (nurse, nurse-in-charge, educator, observer). Swapping the backend to CIS2 later becomes a provider implementation, not an app rewrite. Scoped as SF-207 concept work.

## 5. Build-now / don't-build-yet (the rule)

**Now (zero external dependencies):** SNOMED-code fixtures (SF-220); FHIR mapping assessment doc; identity seam (SF-207); free developer account; keep hazard log and DTAC self-assessment current.

**Not yet (each needs an org, an agreement, or a pilot):** any system-to-system API integration (PDS/CIS2/Terminology/MESH), HSCN connectivity, DSPT registration (needs company — gated on visa/IP checks), MESH mailbox, penetration testing, NHS login (n/a).

## 6. digital.nhs.uk/dashboards — reviewed, no overlap

The dashboards index is national statistical reporting (GP access, e-RS, screening, UEC triage metrics). Nothing there competes with or feeds a ward-level operational simulation. Only the Triage External Metrics dashboards are conceptually adjacent (linked patient-journey data, retrospective) — methodology inspiration for Patient Journey Twin, nothing more.
