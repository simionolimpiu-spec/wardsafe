# SafeFlow Control Board

**Status date:** 2 July 2026
**Project boundary:** Simulation, education and stakeholder demonstration only. No real patient data. No live NHS deployment. No automated diagnosis, prescribing or escalation.

## Current status

| Field | Current position |
|---|---|
| Overall status | Strong external-facing simulation preview package; live repo status re-confirmed 1 July 2026. |
| Current product boundary | Simulation-only education/demo prototype; human-review support language only. |
| Current branch | codex/safeflow-prototype (SF-124 merged via PR #17 on 2 July 2026, merge commit 46ef3c0). |
| Closed PR | #7 "Add minimal role-aware GUI foundation", branch feature/minimal-role-aware-gui. State: CLOSED as superseded on 1 July 2026. |
| Merged PR | #13 "Content views refresh", branch ui/content-views-refresh. Rebased onto latest base, `npm test` (56 files, 338 tests) and `npm run build` passed, safety-wording scan clean, merged 1 July 2026. |
| Deployment guard | SAFEFLOW_DEPLOYMENT_APPROVED now fails closed unless the exact string `true` is present; unset or other values are logged as not approved, and local dev-server providers also refuse placeholder fallback outside allowed preview environments. |
| Primary unfinished control task | Keep this file updated after every commit, doc change, or PR event; PR #7 was closed as superseded. |

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
| SF-117 | Done | Governance | Deployment guard now fails closed and logs when SAFEFLOW_DEPLOYMENT_APPROVED is unset or not exactly `true`. | Added shared deployment approval reader plus tests; deploy approval is explicit only for the exact string `true`. |
| SF-118 | Done | UI foundation | Design token layer added and `src/styles` split into focused partials; Phase 1 shell-vs-content restyle can now begin. | Branch `ui/design-foundation` |
| SF-119 | Done | UI | Phase 1 shell restyle | Shell, navigation, presentation mode, forms, dialogs, and responsive affordances refreshed on `ui/shell-and-navigation-refresh`. | Branch `ui/shell-and-navigation-refresh` |
| SF-120 | Done | UI | Phase 1 content restyle | Applied the new token layer to board, panel, drawer, scenario, and form surfaces in the content-views refresh. | Branch `ui/content-views-refresh`; commit `e900176`. |
| SF-121 | Done | UI | Panel review-cue CSS gap | Added matching panel.css rules for the review cue stack during the content-views refresh. | Branch `ui/content-views-refresh`; commit `e900176`. |
| SF-122 | Done | ML foundation | Simulated Trend Model (simulation-risk-ml-v0) shipped with synthetic-only training data, plain-JS logistic regression, and a checked-in model artifact. | Merged via PR #9 on 1 July 2026 after rebasing onto `codex/safeflow-prototype`. |
| SF-123 | Done | Backend safety gap | Local dev-server signal/suggestion providers (`createConfiguredSignalProvider`, `createConfiguredSuggestionProvider`) now refuse to silently serve placeholder fixtures when `SAFEFLOW_ENVIRONMENT` is not an allowed preview value, matching the guard already used by the Lambda handler (`allowsSimulationPreviewFallback`). Closes the "no silent placeholder fallback in production-intent environments" acceptance criterion from the delivery roadmap's DB-read-model backlog item. | `server/signalProvider.js`, `server/suggestionProvider.js`, plus new tests in `server/signalProvider.test.js` and `server/suggestionProvider.test.js`. Authored directly (Claude), not via Codex CLI, to conserve Codex usage. |
| SF-124 | Done | UI accessibility | WCAG AA accessibility pass across current UI surfaces: focus states, contrast, ARIA, keyboard navigation. | Merge commit `46ef3c0` via PR [#17](https://github.com/simionolimpiu-spec/wardsafe/pull/17). |

## Started / Open / Ready

| ID | Status | Area | Work item | Next action |
|---|---|---|---|---|
| SF-101 | Closed | Release | PR #7 feature/minimal-role-aware-gui closed as superseded. | No merge planned. |
| SF-102 | Blocked — needs rescoping | Product concept | Patient Journey Twin / Simulation Patient Twin concept started; PR #14 opened but is far out of scope. | PR #14 was rebased locally (disposable, never pushed) onto latest `origin/codex/safeflow-prototype` on 1 July 2026 to measure its true diff once stale-base noise was removed: **88 files changed, +15,617/-5,819**, and `WorkspaceNav.jsx` does not even appear in the diff. The intended scope was "new Patient Journey Twin component(s) plus wiring into `App.jsx`/`WorkspaceNav.jsx`." The actual branch touches CI workflows, `AGENTS.md`, `infra/aws/*`, `package.json`/`package-lock.json`, most of `server/*`, and deletes existing files (`src/App.signalWiring.test.jsx`, `infra/ci/projectInstructions.test.js`, `infra/ci/riskSupportTechnicalExplainer.test.js`, `src/domain/simulationScenarioCoverage.test.js`, `src/components/PatientSafetyPanel.test.jsx`, `src/components/SafetyBanner.jsx`). **Do not merge PR #14 as-is.** Needs to go back to Mia to rescope down to just the new Twin files plus minimal wiring — likely easiest as a fresh branch off current `codex/safeflow-prototype` rather than trying to salvage this one. |
| SF-104 | In progress | AWS architecture | Architecture direction discussed: Aurora, Step Functions, Bedrock/LLM layer, tokenised backend. | Keep as mock/readiness architecture until explicit deployment approval. |
| SF-105 | In progress | Docs alignment | White paper, stakeholder deck, roadmap, and app wording exist in pieces. | Create one aligned master narrative. |
| SF-107 | In progress | Clinical safety | Digital twin / predictive learning idea explored. | Frame as review-support and education only, not clinical prediction. |
| SF-109 | Done | Governance | Clinical safety case outline and hazard log skeleton drafted. | `docs/public-demo-pack/clinical-safety-case-outline.md`, using `templates/safety-case-outline-template.md`; 10-row hazard log grounded in the actual signal-envelope contract (`signalClient.js`) and existing risks R-001–R-008. Not yet independently reviewed; roles unfilled pending a future pilot. |
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
| 1 | Record PR #7 as closed as superseded and keep the tracker aligned with GitHub. (Done) |
| 2 | Draft a clinical safety case outline and hazard log skeleton. (Done — see SF-109) |
| 3 | Align app wording, stakeholder pack, roadmap, white paper, and slides into one controlled narrative. (In progress — delivery-roadmap.md refreshed 1 July 2026; stakeholder pack/white paper still to check.) |
| 4 | Decide the next build focus: Patient Journey Twin UI, AWS mock architecture, or full-screen presentation polish. |
| 5 | Get the clinical safety case outline (SF-109) independently reviewed once a clinical safety lead is identified. |
| 6 | Keep this file updated after every commit, document, or design decision. |

## Authoring note (1 July 2026)

This safety-case work (SF-109) and the roadmap refresh were authored directly against the
repository files rather than via a Codex CLI session, to conserve Codex usage for code changes
that need build/test verification. Docs-only changes like this one carry no build risk, so direct
authoring plus a short terminal-only commit/push/PR step is the lighter-weight path going forward
for non-code control-board and documentation work.

## PR #14 scope-creep finding (1 July 2026, for Mia)

PR #14 (`patient-journey-twin`) is **not ready to merge**. A disposable, unpushed local rebase
onto the latest `origin/codex/safeflow-prototype` was used to separate genuine branch content
from stale-base noise. After rebasing, the branch still shows 88 changed files and roughly
15.6k/5.8k line insertions/deletions against current base, and the expected `WorkspaceNav.jsx`
wiring change is not present at all. This is real scope creep, not a rebase artifact. Recommended
fix: start a clean branch from current `codex/safeflow-prototype` and re-apply just the new
Patient Journey Twin component(s), their domain/test files, and the intended `App.jsx` /
`WorkspaceNav.jsx` wiring — nothing else. See SF-102 above for the full file list this ruled out.
