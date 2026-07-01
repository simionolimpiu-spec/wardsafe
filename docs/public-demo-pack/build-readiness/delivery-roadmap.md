# SafeFlow Delivery Roadmap

Last updated: 2026-07-01

## Completed Prototype Work

- Status: Done - Simulation Demo Scenario selector. Commit: `6b2e4be` (presentation follow-on in `f55c51b` and `e809bfa`). Key files: `src/components/DemoScenarioSelector.jsx`, `src/data/demoScenarios.js`, `src/data/demoScenarios.test.js`, `src/App.jsx`, `src/App.test.jsx`, `src/state/simulationWorkspace.js`, `src/state/simulationWorkspace.test.js`, `src/state/simulationPersistence.js`, `src/state/simulationPersistence.test.js`, `src/styles.css`, `server/signalProvider.js`, `server/suggestionProvider.js`. Tests/build: `npm test` and `npm run build` passed on the final prototype state. Remaining risks: fictional scenarios are limited and the choice is stored locally only. Suggested next action: expand the scenario set if presenters need more demo variety.
- Status: Done - Hospital Insights drawer. Commit: `8ebcb3b`. Key files: `src/components/HospitalInsightsDrawer.jsx`, `src/services/hospitalInsightsService.js`, `src/services/hospitalInsightsService.test.js`, `src/App.jsx`, `src/App.test.jsx`, `src/styles.css`. Tests/build: `npm test` and `npm run build` passed on the final prototype state. Remaining risks: deterministic mock benchmarks are stable for demos only. Suggested next action: keep the boundary ready for future governed data sources.
- Status: Done - Simulation Review Report. Commit: `dcd5b55`. Key files: `src/components/SimulationReviewReportDrawer.jsx`, `src/services/simulationReviewReportService.js`, `src/services/simulationReviewReportService.test.js`, `src/App.jsx`, `src/App.test.jsx`, `src/styles.css`. Tests/build: `npm test` and `npm run build` passed on the final prototype state. Remaining risks: the report is a simulation summary, not a clinical document. Suggested next action: keep report copy aligned with the simulation boundary as the demo evolves.
- Status: Done - Presentation Mode. Commit: `f55c51b` (polish in `e809bfa`). Key files: `src/App.jsx`, `src/styles.css`, `src/App.test.jsx`, `infra/aws/runSynth.js`, `infra/aws/runSynth.test.js`. Tests/build: `npm test` and `npm run build` passed on the final prototype state. Remaining risks: demo mode should always keep the safety boundary visible. Suggested next action: consider future full-screen/projector refinements if stakeholders want them.
- Status: Done - Exportable Simulation Review Report with copy and print actions. Commit: `0a20cd5` (polish in `105c892`). Key files: `src/services/simulationReviewReportService.js`, `src/services/simulationReviewReportService.test.js`, `src/components/SimulationReviewReportDrawer.jsx`, `src/styles.css`, `src/App.jsx`, `src/App.test.jsx`. Tests/build: `npm test` and `npm run build` passed on the final prototype state. Remaining risks: plain-text copy/print is demo-safe, but a governed PDF/reporting path is still future work. Suggested next action: assess PDF export later if the roadmap needs it.
- Status: Done - Architecture readiness note. Commit: `a80039c`. Key files: `docs/demo-readiness-pack.md`. Tests/build: docs-only update; no app build changes required. Remaining risks: future architecture remains hypothetical until governance is approved. Suggested next action: turn the note into a formal architecture and governance workstream when ready.
- Status: Done - Demo/readiness documentation updates. Commits: `6dadce6` and `3620953`. Key files: `docs/demo-readiness-pack.md`. Tests/build: docs-only update; no app build changes required. Remaining risks: documentation can drift from the UI as the prototype evolves. Suggested next action: keep the readiness pack in sync with future demo changes.
- Status: Done - Clinical Safety and IG readiness note. Commit: `d00b66225918394b656ba54f16b933cc0a392bc7`. Key file: `docs/public-demo-pack/build-readiness/clinical-safety-ig-readiness.md`. Summary: Added NHS-facing simulation-to-live readiness guidance covering clinical safety, information governance, data protection, human review, RBAC, audit logging, future NHS/AWS readiness, risks/mitigations, open questions, and transition gates. Remaining risk: the document is readiness guidance only. It does not replace formal trust IG approval, clinical safety case development, DPIA, Caldicott review, or local pilot approval. Suggested next action: use this document as the foundation for a formal clinical safety case outline and stakeholder readiness pack.
- Status: Done - Fail-closed deployment approval guard (SF-117). Key files: `infra/aws/deploymentApproval.js`, `infra/aws/app.js`, tests. Summary: `SAFEFLOW_DEPLOYMENT_APPROVED` now fails closed unless set to the exact string `true`; unset or other values are explicitly logged as not approved. Merged via PR #10.
- Status: Done - UI design-token foundation (SF-118). Key files: `src/styles/tokens.css` and the split of the former monolithic `src/styles.css` into focused partials. Summary: established a token layer so shell and content restyles could proceed in parallel without conflicts. Merged via PR #8.
- Status: Done - Shell, navigation and presentation mode refresh (SF-119). Key files: `src/styles/shell.css`, `src/styles/forms-and-dialogs.css`, `src/styles/responsive.css`, `WorkspaceNav.jsx`, `SafetyBanner.jsx`, `App.jsx` header/nav markup. Summary: refreshed sidebar nav, topbar hierarchy, safety banner presentation, and Presentation Mode framing; safety-boundary wording unchanged. Merged via PR #11.
- Status: Done - Simulated Trend Model / ML foundation (SF-122). Key files: `ml/generateSyntheticDataset.js`, `ml/trainSimulatedTrendModel.js`, `src/domain/patientJourneyTrendModel.js`, `MODEL_CARD.md`. Summary: a small logistic-regression model (`modelVersion: simulation-risk-ml-v0`) trained entirely on procedurally-generated synthetic data, exposed as `scoreSimulatedTrend()`, wrapped in the existing simulation-safety envelope contract. Merged via PR #9.
- Status: Done - Domain/safety-logic test coverage. Key files: `src/domain/simulationRiskSupport.test.js`, `src/domain/safetyRules.test.js`, `src/domain/patientJourneyTrendModel.test.js`, `src/domain/workflowEvents.test.js`. Summary: added boundary-case coverage across the core risk/safety domain functions; found and fixed a real bug where `initialAuditEvents()` threw on `responseHistory: null`/undefined instead of returning an empty array. Merged via PR #12.
- Status: Closed as superseded - PR #7 "Add minimal role-aware GUI foundation". Reason: predated the design-token/stylesheet split and overlapped every file touched by the shell/content/Twin workstreams above; the underlying "role-aware GUI" intent is queued to be re-scoped as a fresh, small PR once the current wave of UI/Twin work lands, built on the new token system rather than rebased through it.
- Status: Done - Clinical safety case outline and hazard log skeleton (SF-109). Key file: `docs/public-demo-pack/clinical-safety-case-outline.md`. Summary: filled out the safety-case-outline-template with a 10-row hazard log grounded in the actual signal-envelope contract and the existing CONTROL.md risk register (R-001–R-008). Not yet independently reviewed; clinical safety lead and IG lead roles remain unfilled pending a future governed pilot.

## Active Follow-up Backlog

### Replace placeholder signal and risk providers with ML-backed DB read models

Acceptance criteria:

- Database read model is available in the preview stack.
- Placeholder fallback is used only when explicitly configured for preview or simulation mode.
- API responses expose source and provider metadata for both signal and risk-suggestion routes.
- Tests cover both DB-backed and placeholder-backed modes.
- The simulation safety disclaimer remains visible in the public preview UI.
- No silent placeholder fallback is allowed in production-intent environments.

## In Progress (as of 1 July 2026)

- Status: In progress - Content views refresh (board, panel, drawers, scenarios), including the
  missing `review-cue-*` CSS rules in `PatientSafetyPanel.jsx` (SF-120, SF-121). Branch
  `ui/content-views-refresh`.
- Status: In progress - Patient Journey Twin timeline view, importing the real
  `scoreSimulatedTrend()` now that PR #9 is merged (SF-102). Branch `feature/patient-journey-twin`.
- Status: Queued - WCAG AA accessibility pass (focus states, contrast, ARIA, keyboard nav) once the
  two items above land. Branch `feature/accessibility-pass`.

## Prototype Backlog

- Status: Backlog - Full-screen Presentation Mode refinement.
- Status: Backlog - PDF export later.
- Status: Backlog - AWS architecture mock documentation.
- Status: Backlog - NHS Digital API research only, no live integration.
- Status: Backlog - Information governance checklist.
- Status: Backlog - Role-based access/audit logging design.
- Status: Backlog - Stakeholder demo pack alignment with this roadmap and CONTROL.md.

## Phase 0: Public Simulation Prototype

Status: current PR.

Deliverables:

- Ward Safety Board.
- Handover/discharge workflow.
- Potassium safety-gap journey.
- Editable SBAR draft.
- Audit and learning timeline.
- Public demo pack.

Exit criteria:

- Prototype can be run locally.
- Safety boundary is visible.
- Public docs do not expose confidential invention material.
- Basic tests and browser journey pass.

## Phase 1: Product Discovery

Goal: Validate workflow value with nurses and ward leaders using fictional scenarios.

Deliverables:

- Workshop scripts.
- Scenario templates.
- Feedback form.
- Prioritised backlog.
- Initial hazard log.

Exit criteria:

- At least three realistic safety-gap scenarios ranked.
- Users understand the board without training-heavy explanation.
- Safety boundary remains clear.

## Phase 2: Secure Pilot Build

Goal: Build a production-intent app using synthetic or de-identified data.

Deliverables:

- Authenticated app.
- Backend APIs.
- Database persistence.
- Audit event store.
- Server-side AI draft provider.
- Admin/config area for scenarios and rules.
- CI/CD and environment separation.

Exit criteria:

- Role-based access works.
- Audit trail captures all key actions.
- AI draft output is evidence-bound and editable.
- Safety tests catch unsafe wording.

## Phase 3: Non-Live Ward Simulation

Goal: Test SafeFlow in a realistic workflow setting without live patient data.

Deliverables:

- Ward simulation scripts.
- Facilitator guide.
- Observation sheets.
- Usability findings.
- Updated hazard log.

Exit criteria:

- Nurses can complete a handover scenario.
- Escalation documentation is clearer or faster.
- False-positive and false-negative concerns are documented.

## Phase 4: Integration Feasibility

Goal: Assess whether controlled read-only clinical integration is viable.

Deliverables:

- Integration inventory.
- Data protection assessment draft.
- Clinical safety case draft.
- Technical architecture review.
- Partner system API assessment.

Exit criteria:

- Clear data source for each required signal.
- Approved path for identity, observations, labs and notes.
- No unresolved high-risk safety blockers.

## Phase 5: Controlled Pilot

Goal: Run SafeFlow in a governed pilot if approved.

Deliverables:

- Support model.
- Monitoring.
- Incident response process.
- Training and onboarding.
- Pilot metrics.
- Post-pilot evaluation.

Exit criteria:

- Evidence shows workflow value.
- Safety and governance conditions are met.
- Decision made: stop, iterate or scale.
