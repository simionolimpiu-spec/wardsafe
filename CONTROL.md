# SafeFlow Control Board

**Status date:** 5 July 2026
**Project boundary:** Simulation, education and stakeholder demonstration only. No real patient data. No live NHS deployment. No automated prescribing or escalation.

## Current status

| Field | Current position |
|---|---|
| Overall status | Strong external-facing simulation preview package; live repo status re-confirmed 5 July 2026. |
| Current product boundary | Simulation-only education/demo prototype; human-review support language only. |
| Current branch | codex/safeflow-prototype |
| Open PR | None open as of 5 July 2026 (post-merge check). |
| Closed PR | #7 "Add minimal role-aware GUI foundation", branch feature/minimal-role-aware-gui. State: CLOSED as superseded on 1 July 2026. |
| Merged PR | #29 "test(safety): add regression scans for demo surfaces" (squash merge `c0bbb8a`), #30 "docs: align public demo pack master narrative" (squash merge `29c1974`), and #31 "feat: add ward quality and safety review export" (squash merge `8e1dcbb`, SF-217), all merged 5 July 2026. Post-merge verification: `npm test` 70 files/400 tests passed, `npm run build` passed. |
| Merged PR | #13 "Content views refresh", branch ui/content-views-refresh. Rebased onto latest base, `npm test` (56 files, 338 tests) and `npm run build` passed, safety-wording scan clean, merged 1 July 2026. |
| Deployment guard | SAFEFLOW_DEPLOYMENT_APPROVED now fails closed unless the exact string `true` is present; unset or other values are logged as not approved, and local dev-server providers also refuse placeholder fallback outside allowed preview environments. |
| Primary unfinished control task | Keep this file updated after every commit, doc change, or PR event; keep the app-copy naming cleanup queued as a Mia task. |

## Completed / Done

| ID | Status | Area | Work item | Evidence |
|---|---|---|---|---|
| SF-001 | Done | Safety boundary | Simulation-only boundary established: no real patient data, no live NHS systems, no prescribing/escalation claims. | Project rule / control board |
| SF-002 | Done | Simulation signals | Pure cue engine, workspace signal snapshot storage, app wiring, and patient-panel review cues implemented. | Commit 1e888ae0632898fee488e12def8a1c1b5e9ae96f |
| SF-003 | Done | Patient panel | Simulation-only Review cues section added to patient panel. | Commit 1e888ae0632898fee488e12def8a1c1b5e9ae96f |
| SF-004 | Done | Presentation Mode | Header toggle, presentation banner, simplified flow strip, and projector-friendly styling added. | Commit f55c51b |
| SF-005 | Done | Testing | Presentation Mode enable/disable tests added and focused tests passed. | npm test reported passed |
| SF-006 | Done | Build | Project build validated after Presentation Mode work. | npm run build reported passed |
| SF-008 | Done | Infra tests | infra/aws/runSynth.js compatibility fix applied so Vitest can import reliably. | Commit f55c51b |
| SF-010 | Done | Roadmap | delivery-roadmap.md updated with completed demo features and backlog items. | Commit 10aceac |
| SF-011 | Done | Exportable report | Exportable Simulation Review Report added to demo/readiness status. | Commits 0a20cd5, 105c892, 3620953 |
| SF-102 | Done | Product concept | Patient Journey Twin v2 timeline view shipped with the minimal app/nav wiring and scenario styling. | Squash merge commit `6d98cd9` via PR [#20](https://github.com/simionolimpiu-spec/wardsafe/pull/20). |
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
| SF-125 | Done | Dashboard data layer | Chart-ready aggregation service for ward comparison, simulated trend, and cue breakdowns. | Merge commit `f83d4bb` via PR [#21](https://github.com/simionolimpiu-spec/wardsafe/pull/21). |
| SF-126 | Done | Hospital insights dashboard | Hospital insights section with ward comparison and Patient Journey Twin simulated trend charts, using the shared chart-ready dashboard data service. | Squash merge commit `ccede12` via PR [#22](https://github.com/simionolimpiu-spec/wardsafe/pull/22). |
| SF-209 | Done | Data model | Fictional patient timeline + observations + review cues. | Merge commit `91c727c` via PR [#18](https://github.com/simionolimpiu-spec/wardsafe/pull/18); synthetic-only data only. |
| SF-211 | Done | Education | Clinical education, interprofessional learning, and portable competency passport | Simulation-only learning layer with micro-learning and structured courses tagged by ward/trust/profession/topic; squash merge commit `cf1577804876428723956b52e101cf0066b660af` via PR [#23](https://github.com/simionolimpiu-spec/wardsafe/pull/23). |
| SF-212 | Done | Simulation | More scenarios + safety flags | Merge commit `2abb2a04ce891bc390a132bb045535bce84a6653` via PR [#24](https://github.com/simionolimpiu-spec/wardsafe/pull/24); fictional ward scenarios and explainable safety cues only. |
| SF-213 | Done | Safety | Heuristic cue engine (explainable 'intuition') | Merge commit `fb6a9cef22158ad02f7a5e59bc94c68238d96621` via PR [#25](https://github.com/simionolimpiu-spec/wardsafe/pull/25); deterministic cue layer with transparent explanations and human review required. |
| SF-215 | Done | Safety / UI | Scope low-potassium flag and clean top nav | Merge commit `f63591d0e77dffc17611ad8ad25ef5038011ac1e` via PR [#26](https://github.com/simionolimpiu-spec/wardsafe/pull/26); scoped lab-signal flag wording to structured review support and refreshed navigation. |
| SF-214 | Done | ML | Extend simulation-risk ML model | Merge commit `ed4e5b60d1f150c5dfe258f4f52060887c8cb8e9` via PR [#27](https://github.com/simionolimpiu-spec/wardsafe/pull/27); synthetic-only model extension remains illustrative and not clinically validated. |
| SF-216 | Done | Data model | Ward simulation database | Squash merge commit `17971040696045291281b45c4d77d1120e72a724` via PR [#28](https://github.com/simionolimpiu-spec/wardsafe/pull/28); pure ward artifact rendering split out from the SQLite writer so CI can import the database fixtures safely. |
| SF-219 | Done | Governance | DTAC v2 self-assessment (working RAG, five domains) | `docs/public-demo-pack/build-readiness/dtac-v2-self-assessment.md`; honest gap register against the Feb 2026 DTAC form. Authored directly (Claude, docs-only), 3 July 2026. |
| SF-220 | Done (docs) | Evaluation | SF-210 evaluation framework: measures M1–M8, pre/post forms, SUS, facilitator sheet, data handling, pre-registered thresholds | `docs/public-demo-pack/evaluation-framework.md`. First real session still pending — see SF-210. Authored directly (Claude, docs-only), 3 July 2026. |
| SF-221 | Done | Research | NHS integration readiness research (closes SF-205): onboarding path, relevant APIs, UK Core FHIR/SNOMED implications, CIS2 seam design, ward-state negative finding | `docs/public-demo-pack/build-readiness/nhs-integration-readiness.md`; primary-source verified against digital.nhs.uk/developer on 3 July 2026. Research only; no integration authorised. |
| SF-223 | Done (docs) | Evaluation | First evaluation-session run plan: concrete, paternity-aware run-book for SafeFlow's FIRST simulation evaluation session (3–6 nurses/students; reads cues, generates a Ward Quality & Safety Review export SF-217, completes a Competency Passport module), operationalising the SF-210/SF-220 framework. Produces usability/usefulness evidence only, not clinical evidence. | `docs/public-demo-pack/build-readiness/first-evaluation-session-plan.md` (+ strategy-pack copy outside repo). Authored directly (Claude, Oli's-codex role, docs-only), 6 July 2026. Task O8. |
| SF-224 | Done (docs) | Quality reporting | SafeFlow Quality Intelligence stakeholder one-pager: single-page, plain-English description of the Ward Quality & Safety Review export (SF-217) pitched at Band 6/7/8a users (ward managers, practice educators, matrons, clinical governance leads), with a load-bearing "what it does not do" section (no staff scoring, no escalation-pathway start, does not replace EPR/RRT/Call-for-Concern or any live clinical/quality system, simulation-only). Every claim traceable to master-narrative.md. | Squash merge commit `7e9a126` via PR [#35](https://github.com/simionolimpiu-spec/wardsafe/pull/35); one new file `docs/public-demo-pack/quality-intelligence-one-pager.md` (+23/-0), no code/CONTROL.md changes in the feature PR; diff independently checked for banned wording (clean — Optica not named). Task O9. |
| SF-225 | Done (docs) | Scope discipline | Future Discovery Register: formally parks the three out-of-scope senior-nurse-feedback ideas — patient feedback stations, ward social hub, and cross-team discharge coordination (generically named; no competitor product named) — each with why-attractive / why-out-of-scope / open-governance-questions (framed as questions) / FUTURE DISCOVERY status. Points to the external IG/DPIA-lite checklist. Holds the simulation-only boundary and gives an honest "could SafeFlow also do X?" answer without building. | Squash merge commit `abcab4c` via PR [#36](https://github.com/simionolimpiu-spec/wardsafe/pull/36); one new file `docs/public-demo-pack/future-discovery-register.md` (+74/-0), no code/CONTROL.md changes in the feature PR; diff independently checked for banned wording (clean). Task O10. |
| SF-226 | Done (docs) | Quality reporting | Verified-learning-evidence narrative: adds the approved narrative home for a future ward-level verified-learning rollup (Mia's M10) to master-narrative.md — aggregated, NON-IDENTIFYING counts of completed simulation learning modules / Competency-Passport credits presented as "ward-level learning assurance (simulation)", human-review-framed, never individual staff scoring or person-level comparison. Adds approved terms ("verified learning evidence", "ward-level learning assurance (simulation)") and banned terms ("staff scoring", "competency ranking", "performance league table", "individual nurse rating"). | Squash merge commit `1c5e523` via PR [#37](https://github.com/simionolimpiu-spec/wardsafe/pull/37); one file `docs/public-demo-pack/master-narrative.md` (+11/-1); approved terms verified in the Approved Terminology list and banned terms in the Banned Wording list (correct placement independently confirmed); no code/CONTROL.md changes in the feature PR. Task O11. |
| SF-228 | Done | Scenarios | Deterioration-pattern review scenarios (Mia, M6): 3 fictional patterns — rising respiratory rate, new-onset confusion, falling oxygen saturation — that produce explainable, simulation-only, human-review-framed review cues through the existing signal engine. Each scenario carries success signals ("stays calm and explainable", "simulation-only and human-review required") and hazard guards (avoid treatment language / live-alert framing); signalEngine gains a guard regex blocking clinical wording. | Squash merge commit `28f54f0` via PR [#38](https://github.com/simionolimpiu-spec/wardsafe/pull/38); 3 files additive (`src/data/scenarioLibrary.js`, `src/domain/signalEngine.js`, `src/domain/signalEngine.test.js`, +184/-1), no server/infra/package/CONTROL.md changes in the feature PR; diff independently checked — banned-term matches were only the scenarios' own hazard labels (what to avoid) and the new guard regex, no banned usage; both CI checks green + CLEAN. From Mia's Codex. |
| SF-127 | Done | Safety QA | Safety-language regression scan coverage extended to Twin/Hospital Insights/newer surfaces. | Squash merge commit `c0bbb8a` via PR [#29](https://github.com/simionolimpiu-spec/wardsafe/pull/29); adds `src/domain/safetyLanguageScans.test.js` and `src/components/safetyLanguageSurfaces.test.jsx` so future fixture/copy edits on these surfaces are caught automatically. |

## Started / Open / Ready

| ID | Status | Area | Work item | Next action |
|---|---|---|---|---|
| SF-101 | Closed | Release | PR #7 feature/minimal-role-aware-gui closed as superseded. | No merge planned. |
| SF-104 | Done | AWS architecture | Mock/readiness AWS direction documented in `docs/public-demo-pack/build-readiness/architecture-options.md` and `docs/public-demo-pack/build-readiness/technology-stack.md` (Aurora, Step Functions, Bedrock/LLM draft provider, tokenised backend, RBAC/audit logging). | Merged via [PR #19](https://github.com/simionolimpiu-spec/wardsafe/pull/19) on 2 July 2026; squash merge commit `5384b54b7f71d61b9b614df7c753255edab39d18`. Keep as mock/readiness architecture only; no live AWS deployment or SDK wiring until explicit approval. |
| SF-105 | Done | Docs alignment | `docs/public-demo-pack/master-narrative.md` is now the controlled description; `stakeholder-demo-pack.md`, `demo-script.md`, `safety-boundary.md`, and `README.md` are aligned to it. | Branch `docs/narrative-alignment`; app-copy naming cleanup remains a Mia follow-up. |
| SF-107 | In progress | Clinical safety | Simulation twin / learning idea explored. | Frame as review-support and education only, not live clinical action. |
| SF-109 | Done | Governance | Clinical safety case outline and hazard log skeleton drafted. | `docs/public-demo-pack/clinical-safety-case-outline.md`, using `templates/safety-case-outline-template.md`; 10-row hazard log grounded in the actual signal-envelope contract (`signalClient.js`) and existing risks R-001â€“R-008. Not yet independently reviewed; roles unfilled pending a future pilot. |

## Quality Intelligence lane (5 July 2026, from senior-nurse feedback pressure-test)

Senior-nurse feedback (Band 6/7 quality reports, deteriorating-patient review, RRT/Call-for-Concern, patient feedback stations, social hub, Optica-style discharge coordination) was pressure-tested against the simulation-only boundary; full memo saved outside this repo as `SafeFlow_Senior_Nurse_Feedback_Strategy_Memo_2026-07-05.md`. Verdict: patient feedback stations and a social hub stay out as future discovery (real IG/consent gap, SF-206 still backlog); Optica-style discharge coordination and naming a real competitor product stay out of external material entirely. The two in-scope items below are dispatched as SF-217 (Oli) and SF-218 (Mia).

| ID | Status | Area | Work item | Next action |
|---|---|---|---|---|
| SF-217 | Done | Quality reporting | Ward Quality & Safety Review export — assembles heuristic cue engine flags, simulation-risk trend summary, and Competency Passport verified-learning evidence into one Band-6/7-styled exportable report, reusing the existing Simulation Review Report export pattern. | Squash merge commit `8e1dcbb` via PR [#31](https://github.com/simionolimpiu-spec/wardsafe/pull/31); 9 files (`src/App.jsx`, `src/App.test.jsx`, `src/components/ReportsView.jsx`, new `WardQualitySafetyReviewDrawer.jsx`+test, extended `safetyLanguageSurfaces.test.jsx`/`safetyLanguageScans.test.js`, new `wardQualitySafetyReviewService.js`+test); post-merge `npm test` 70 files/400 tests passed, `npm run build` passed; diff independently checked for banned wording (clean — only approved terms like "escalation readiness cue" and the standard boundary phrase appear). No server/infra/package.json/CONTROL.md changes. |
| SF-218 | Ready | Education | Deterioration + escalation-pathway learning modules — 2–3 new Learning Hub micro-learning modules covering deteriorating-patient recognition and RRT-call/Call-for-Concern conversation structure, education only, no live escalation logic. | Prompt sent to Mia 5 July 2026; awaiting her Codex session. |

## Backlog

| ID | Status | Area | Work item | Notes |
|---|---|---|---|---|
| SF-201 | Backlog | UI | Full-screen presentation mode | Improve stakeholder demo flow further. |
| SF-202 | Backlog | UI | Cleaner NHS-realistic version 2 screen concept | Use minimal, customisable, safer NHS-realistic visual language. |
| SF-204 | Closed (superseded) | AWS docs | AWS mock docs and architecture diagrams | Delivered by SF-104 (PR #19, `docs/public-demo-pack/build-readiness/architecture-options.md` + `technology-stack.md`). No further action. |
| SF-205 | Backlog | Research | NHS Digital API research only | Research mode only; no live integration. |
| SF-206 | Backlog | Governance | IG checklist | Prepare for future data protection and access-control review. |
| SF-207 | Backlog | Security | RBAC/audit logging implementation concept | Keep as mock/demo unless implementing locally. |
| SF-210 | Backlog | Evaluation | Demo evaluation framework | Usability, nursing review, documentation safety, learning value. |

## Risks and controls

| ID | Risk | Control |
|---|---|---|
| R-001 | Project sounds like a live clinical decision tool. | Use simulation-only, education, human review, and review-support wording everywhere. |
| R-002 | Scope creep into prescribing, treatment advice, or automated escalation. | Avoid live-clinical action claims and keep the review-support boundary explicit. |
| R-003 | AWS deploy risk or accidental cost. | Keep SAFEFLOW_DEPLOYMENT_APPROVED false (explicitly set, not merely unset) unless explicitly preparing controlled simulation deployment. |
| R-004 | Real patient data accidentally enters demo material. | Use fictional patients, fictional observations, and sanitised examples only. |
| R-005 | Docs, slides, and app language drift apart. | Update this control board after each change; treat exported chat docs as history, not live truth. |
| R-006 | Public preview shared before release review. | Confirm PR status, CI, branch cleanliness, and wording before merge/tag. |
| R-007 | LLM/digital twin wording creates unsafe expectations. | Call it Patient Journey Twin / Simulation Patient Twin and explain that it supports learning and review, not autonomous care. |
| R-008 | Control docs reference the wrong PR number after external export/import. | Always re-pull live git/GitHub state before updating this file; do not trust prior chat summaries alone. |
| R-009 | Simulated ML trend output (`patientJourneyTrendModel.js`, weights in `patientJourneyTrendModel.json`) gets read as a validated clinical result. | Keep "Illustrative model output, not clinically validated" on every rendered trend chart/summary; never surface `testMetrics` (accuracy/precision/recall) in the UI â€” confirmed today they are data-layer only, not rendered. See SF-127 for closing the automated-scan gap on this and the Twin/Hospital Insights surfaces. |
| R-010 | Next-phase scope drifts into live or black-box claims. | Keep this phase simulation-only, with no real-patient data, no autonomous clinical action, no AGI/black-box language, and ship each item as its own scoped PR. |

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
| 2 | Draft a clinical safety case outline and hazard log skeleton. (Done â€” see SF-109) |
| 3 | Keep the public docs aligned with the master narrative and raise the remaining app-copy naming cleanup as a Mia task. |
| 4 | Decide the next build focus: Patient Journey Twin UI, AWS mock architecture, or full-screen presentation polish. |
| 5 | Get the clinical safety case outline (SF-109) independently reviewed once a clinical safety lead is identified. |
| 6 | Keep this file updated after every commit, document, or design decision. |

## Changelog

- ID reconciliation note: SF-217 stayed with the Ward Quality & Safety Review export; the governance docs moved SF-217→SF-219, SF-218→SF-220, and SF-219→SF-221. The doc-only SNOMED/FHIR placeholder was advanced to SF-222 so it stays clear of the new board IDs.

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
`WorkspaceNav.jsx` wiring â€” nothing else. See SF-102 above for the full file list this ruled out.
