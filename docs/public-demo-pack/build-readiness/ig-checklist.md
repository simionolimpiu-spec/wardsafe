# Information Governance Checklist (SF-206)

Status date: 7 July 2026
Board item: SF-233 (delivers backlog item SF-206)
Authored directly (Claude, Oli's-codex role), docs-only change. Companion to `clinical-safety-ig-readiness.md`, `dtac-v2-self-assessment.md` (Domain 2) and `evaluation-framework.md` §4.

Purpose: one honest checklist of what information governance requires at each stage of SafeFlow's life, so nothing is discovered late. SafeFlow today processes **no personal data** — fictional patients only — which keeps Stage 1 short and true.

## Stage 1 — Today (simulation, fictional data)

| # | Item | Status | Note |
|---|---|---|---|
| 1.1 | No real patient data anywhere in repo, fixtures, screenshots, demos | HOLDING | Controlled by R-004; fictional scenarios only (`demoScenarios.js`, scenario library). Re-verify before every external demo |
| 1.2 | No staff personal data processed by the app | HOLDING | No accounts, no names; identity seam (SF-207) must ship with mock personas only |
| 1.3 | Demo devices/screens contain no NHS credentials or Trust systems side-by-side | MANUAL | Presenter discipline: close Trust apps before demoing; never demo on a ward PC |
| 1.4 | Repo hygiene: no secrets, no NHS documents, no employer-identifiable material committed | HOLDING | `.env.example` pattern only; founder log kept outside repo |
| 1.5 | UK GDPR lawful basis | N/A | No personal data processed — no basis required yet |

## Stage 2 — Evaluation sessions (anonymous staff feedback)

| # | Item | Status | Note |
|---|---|---|---|
| 2.1 | Feedback forms anonymous by design (participant codes, no names/employers) | READY | `evaluation-framework.md` §3–4; capture sheet SF-230 consent line |
| 2.2 | Paper/offline forms; nothing entered into the app | READY | Framework rule |
| 2.3 | Raw forms stored privately; only aggregates published | READY | Founder holds; note storage location in session report |
| 2.4 | If any identifiable staff data ever collected (e.g. named quotes) | GATE | Requires consent wording + becomes personal data processing → DPIA-lite first |
| 2.5 | Session inside a trust = education team's direction + COI declaration stands | READY | Framework §4 |

## Stage 3 — Company formation (before any DSPT)

| # | Item | Status | Note |
|---|---|---|---|
| 3.1 | Immigration check complete (non-UK founder) | **OPEN — BLOCKING** | OISC-registered adviser before incorporation |
| 3.2 | Employment contract IP clause reviewed | **OPEN — BLOCKING** | Before any company owns SafeFlow IP |
| 3.3 | ICO registration (data protection fee) | LATER | Required once the company processes personal data |
| 3.4 | DSPT registration ("Company" category until patient data) | LATER | Needed for NHS API onboarding; see `nhs-integration-readiness.md` |
| 3.5 | Privacy notice + records of processing (ROPA) | LATER | Template at company formation |

## Stage 4 — Governed pilot (only after trust approval)

| # | Item | Status | Note |
|---|---|---|---|
| 4.1 | Full DPIA | GATE | Before any real data, including staff accounts |
| 4.2 | Data-flow diagram | GATE | Flagged AMBER in DTAC Domain 2; produce with pilot scope |
| 4.3 | RBAC enforced + security audit logging | GATE | SF-207 seam → enforcement task; distinct from simulation audit trail |
| 4.4 | Data-sharing/processing agreement with trust | GATE | Trust IG team leads; Caldicott review if patient data |
| 4.5 | Retention & deletion schedule | GATE | Define before first byte of real data |
| 4.6 | DCB0160 support to deploying trust | GATE | Our hazard log hands over as their seed |

## Standing rules

1. The cheapest IG strategy is the current one: process no personal data until there is an organisation, an agreement, and a reason.
2. Any new feature that would touch personal data (competency passport across institutions, patient/family views, named feedback) hits this checklist *before* design, not after build — see `future-discovery-register.md` for items already parked on exactly this ground.
3. Review this checklist when: a stage boundary approaches, DTAC Domain 2 changes, or any external partner asks an IG question.
