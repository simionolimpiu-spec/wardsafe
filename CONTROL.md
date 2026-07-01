# SafeFlow Control Board

**Status date:** 1 July 2026
**Project boundary:** Simulation, education and stakeholder demonstration only. No real patient data. No live NHS deployment. No automated diagnosis, prescribing or escalation.

## Current status

| Field | Current position |
|---|---|
| Overall status | Strong external-facing simulation preview package; live repo status re-confirmed 1 July 2026. |
| Current product boundary | Simulation-only education/demo prototype; human-review support language only. |
| Current branch | ui/design-foundation (working tree clean as of last check). |
| Open PR | #8 "chore(ui): design tokens + stylesheet split (foundation for UI refresh)", branch ui/design-foundation. State: OPEN and ready for review. PR #7 remains open. |
| Deployment guard | SAFEFLOW_DEPLOYMENT_APPROVED is currently UNSET (not explicitly false). Treat as not-approved by default, but this should be set explicitly to avoid ambiguity. |
| Primary unfinished control task | Keep this file updated after every commit, doc change, or PR event; review PR #8 and decide merge. |

## Completed / Done

| ID | Status | Area | Work item | Evidence |
|---|---|---|---|---|
| SF-001 | Done | Safety boundary | Simulation-only boundary established: no real patient data, no live NHS systems, no diagnosis/prescribing/escalation claims. | Project rule / control board |
| SF-002 | Done | Simulation signals | Pure cue engine, workspace signal snapshot storage, app wiring, and patient-panel review cues implemented. | Commit 1e888ae0632898fee488e12def8a1c1b5e9ae96f |
| SF-003 | Done | Patient panel | Simulation-only Review cues section added to patient panel. | Commit 1e888ae0632898fee488e12def8a1c1b5e9ae96f |
| SF-004 | Done | Presentation Mode | Header toggle, presentation banner, simplified flow strip, and projector-friendly styling added. | Commit f55c51b |
| SF-005 | Done | Testing | Presentation Mode enable/disable tests added and focused tests passed. | npm test reported passed |
| SF-006 | Done | Build | Project build validated after Presentation Mode work. | npm run build reported passed |
| SF-008 | Done | Infra tests | infra/aws/runSynth.js compatibility fix applied so Vitest can import reliably. | Commit f55c51b |
| SF-010 | Done | Roadmap | delivery-roadmap.md updated with completed demo features and backlog items. | Commit 10aceac |
| SF-011 | Done | Exportable report | Exportable Simulation Review Report added to demo/readiness status. | Commits 0a20cd5, 105c892, 3620953 |
| SF-013 | Done | Clinical safety / IG | clinical-safety-ig-readiness.md created covering simulation boundary, clinical safety, IG/data protection, human review, RBAC/audit logging, future NHS/AWS readiness, risks, open questions, and simulation-to-live gates. | Commit d00b662 |
| SF-014 | Done | Stakeholder pack | stakeholder-demo-pack.md created as a concise NHS-facing demo pack. | Commit b74ab9f |
| SF-016 | Done | Control | CONTROL.md created at repo root as the permanent control tracker. | This commit |
| SF-118 | Done | UI foundation | Design token layer added and `src/styles` split into focused partials; Phase 1 shell-vs-content restyle can now begin. | Branch `ui/design-foundation` |

## Started / Open / Ready

| ID | Status | Area | Work item | Next action |
|---|---|---|---|---|
| SF-101 | Ready for review | Release | PR #7 feature/minimal-role-aware-gui open, both CI checks passing. | Review diff for safety-boundary wording and scope, then decide merge. |
| SF-119 | Ready | UI | Phase 1 shell restyle | Apply the new token layer to the app shell, navigation, and presentation chrome. |
| SF-120 | Ready | UI | Phase 1 content restyle | Apply the new token layer to board, panel, drawer, scenario, and form surfaces in parallel with the shell pass. |
| SF-121 | Ready | UI | Panel review-cue CSS gap | `PatientSafetyPanel.jsx` still references `review-cue-stack`, `review-cue-meta`, `review-cue-evidence`, and `review-cue-notes`; add matching panel.css rules during the content-views refresh. |
| SF-102 | In progress | Product concept | Patient Journey Twin / Simulation Patient Twin concept started. | Design UI wording and docs; keep simulation-only. |
| SF-104 | In progress | AWS architecture | Architecture direction discussed: Aurora, Step Functions, Bedrock/LLM layer, tokenised backend. | Keep as mock/readiness architecture until explicit deployment approval. |
| SF-105 | In progress | Docs alignment | White paper, stakeholder deck, roadmap, and app wording exist in pieces. | Create one aligned master narrative. |
| SF-107 | In progress | Clinical safety | Digital twin / predictive learning idea explored. | Frame as review-support and education only, not clinical prediction. |
| SF-117 | Ready | Governance | Deployment guard is unset rather than explicit. | Set SAFEFLOW_DEPLOYMENT_APPROVED explicitly to false in config/env template. |
| SF-109 | Ready | Governance | Clinical safety case outline identified as next step. | Draft safety case outline and hazard log skeleton. |

## Backlog

| ID | Status | Area | Work item | Notes |
|---|---|---|---|---|
| SF-201 | Backlog | UI | Full-screen presentation mode | Improve stakeholder demo flow further. |
| SF-202 | Backlog | UI | Cleaner NHS-realistic version 2 screen concept | Use minimal, customisable, safer NHS-realistic visual language. |
| SF-204 | Backlog | AWS docs | AWS mock docs and architecture diagrams | Aurora, Step Functions, Bedrock/LLM, tokenisation, RBAC/audit. |
| SF-205 | Backlog | Research | NHS Digital API research only | Research mode only; no live integration. |
| SF-206 | Backlog | Governance | IG checklist | Prepare for future data protection and access-control review. |
| SF-207 | Backlog | Security | RBAC/audit logging implementation concept | Keep as mock/demo unless implementing locally. |
| SF-209 | Backlog | Data model | Fictional patient timeline + observations + review cues | Must use fictional data only. |
| SF-210 | Backlog | Evaluation | Demo evaluation framework | Usability, nursing review, documentation safety, learning value. |

## Risks and controls

| ID | Risk | Control |
|---|---|---|
| R-001 | Project sounds like a live clinical prediction tool. | Use simulation-only, education, human review, and review-support wording everywhere. |
| R-002 | Scope creep into diagnosis, prescribing, or automated escalation. | Avoid diagnosis engine, prescribing recommendation, and escalation automation claims. |
| R-003 | AWS deploy risk or accidental cost. | Keep SAFEFLOW_DEPLOYMENT_APPROVED false (explicitly set, not merely unset) unless explicitly preparing controlled simulation deployment. |
| R-004 | Real patient data accidentally enters demo material. | Use fictional patients, fictional observations, and sanitised examples only. |
| R-005 | Docs, slides, and app language drift apart. | Update this control board after each change; treat exported chat docs as history, not live truth. |
| R-006 | Public preview shared before release review. | Confirm PR status, CI, branch cleanliness, and wording before merge/tag. |
| R-007 | LLM/digital twin wording creates unsafe expectations. | Call it Patient Journey Twin / Simulation Patient Twin and explain that it supports learning and review, not autonomous care. |
| R-008 | Control docs reference the wrong PR number after external export/import. | Always re-pull live git/GitHub state before updating this file; do not trust prior chat summaries alone. |

## Core decisions to preserve

- SafeFlow / WardSafe remains simulation-only unless governance and deployment approval change.
- No real patient data is used in the demo or project materials.
- No live NHS integrations are included at this stage.
- No AWS SDK/live deployment should occur unless explicitly approved.
- All clinical language must remain human-review focused.
- Digital twin language should be controlled as Patient Journey Twin or Simulation Patient Twin.
- This file (CONTROL.md) is now the source of truth for what has been done, what is open, and what happens next; update it after every commit, doc change, or PR event.

## Recommended next actions

| Priority | Action |
|---|---|
| 1 | Review PR #7 diff for safety-boundary wording and scope, then decide merge. |
| 2 | Set SAFEFLOW_DEPLOYMENT_APPROVED explicitly to false rather than leaving it unset. |
| 3 | Draft a clinical safety case outline and hazard log skeleton. |
| 4 | Align app wording, stakeholder pack, roadmap, white paper, and slides into one controlled narrative. |
| 5 | Decide the next build focus: Patient Journey Twin UI, AWS mock architecture, or full-screen presentation polish. |
| 6 | Keep this file updated after every commit, document, or design decision. |
