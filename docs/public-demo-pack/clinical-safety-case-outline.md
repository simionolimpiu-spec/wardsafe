# SafeFlow Clinical Safety Case Outline

Status date: 1 July 2026
Author: Drafted directly against the current prototype state (post PR #12), for stakeholder and internal review.

This is a planning outline, not a completed clinical safety case. It follows the structure of
`docs/public-demo-pack/templates/safety-case-outline-template.md` and should be read alongside
`docs/public-demo-pack/build-readiness/clinical-safety-ig-readiness.md`, which covers the broader
information-governance and data-protection picture. Nothing in this document authorises a move
beyond simulation. SafeFlow remains simulation-only, education and demonstration use until a
formal safety case is independently reviewed and signed off, and until deployment approval is
explicitly granted (see `SAFEFLOW_DEPLOYMENT_APPROVED` in `infra/aws/deploymentApproval.js`).

## Intended Use

- Product: SafeFlow (WardSafe) simulation prototype.
- Version: Current `codex/safeflow-prototype` branch state, PR #12 and earlier merged.
- Users (simulation phase): Product, engineering, and stakeholder audiences reviewing the
  prototype for demo, discovery, and design-feedback purposes. Not currently used by practising
  clinical staff on real wards.
- Users (future, out of scope today): Ward nurses, ward managers, clinical educators, and digital
  safety leads, subject to a future governed pilot.
- Care setting: None today. Simulation runs against fictional ward and patient data only, on
  developer machines or a public simulation preview deployment.
- Intended workflow (simulation phase): Explore the Ward Safety Board, Patient Safety Panel,
  Handover, Discharge, Potassium safety-gap scenario, Simulation Review Report, Hospital Insights
  comparison, and Patient Journey Twin timeline, using fictional demo scenarios only.
- Explicit exclusions: No diagnosis, no treatment recommendation, no prescribing, no autonomous
  escalation, no live NHS system connection, no real patient-identifiable data, no unattended
  action of any kind.

## Clinical Safety Roles

This project does not currently have a formally appointed clinical safety officer, IG lead, or
implementation owner — it is a prototype without a live deployment. The roles below are
placeholders to be filled before any move toward a governed pilot, not filled today:

- Clinical safety lead: Not yet appointed.
- Product owner: Project owner (Olimpiu).
- Technical lead: Project owner, supported by AI coding agents (Claude, Codex) under human review.
- Information-governance lead: Not yet appointed.
- Implementation owner: Not applicable — no live implementation exists.

## Hazard Log Summary

This expands the single example row in the template into a first working hazard log for the
current prototype. IDs are prefixed `HAZ-` and are separate from the `SF-*` control-board IDs used
elsewhere in this repository. Severity and likelihood are qualitative placeholders for discussion,
not a formal clinical risk assessment.

| ID | Hazard | Cause | Potential Harm | Control | Verification |
| --- | --- | --- | --- | --- | --- |
| HAZ-01 | Unsafe draft wording | AI-drafted SBAR or review text overstates certainty or recommends an action | User follows inappropriate advice as if clinically validated | Boundary prompt language, `isSafeSimulationEnvelope` wording checks, human edit required before use | `src/services/signalClient.js` tests; safety-boundary text-scan in CI |
| HAZ-02 | Simulation output mistaken for clinical advice | Product framing or UI copy implies a live clinical recommendation | Inappropriate reliance on a non-validated signal | "Simulation only" banner (`SafetyBanner.jsx`) always visible; every signal/suggestion carries `simulationOnly: true`, `clinicalUse: false`, `requiresHumanReview: true` | `SafetyBanner` render tests; envelope validator in `signalClient.js` |
| HAZ-03 | Fictional data mistaken for real patient data | Demo scenarios look realistic enough to be assumed genuine | Confusion about data provenance; risk of real data being pasted in by mistake | Deterministic fictional scenarios only (`demoScenarios.js`); no free-text real-identifier fields exposed | `demoScenarios.test.js`; manual review of scenario copy |
| HAZ-04 | Scope creep into diagnosis, prescribing, or escalation automation | Feature requests gradually add "helpful" automated actions | Product silently becomes a de facto clinical decision tool without safety review | Explicit exclusion in CONTROL.md (R-002); every new signal/suggestion type must pass through `isSafeSimulationEnvelope` and this hazard log before merge | Manual review at PR time; control board (CONTROL.md) sign-off |
| HAZ-05 | Accidental live deployment or cost exposure | `SAFEFLOW_DEPLOYMENT_APPROVED` unset or misconfigured | Unapproved AWS resources provisioned; unintended spend or exposure | Guard fails closed unless the exact string `true` is set (SF-117, `infra/aws/deploymentApproval.js`) | `deploymentApproval.test.js`; infra preflight check |
| HAZ-06 | Docs/UI wording drift | Multiple docs (white paper, stakeholder pack, roadmap, app copy) updated independently | Inconsistent safety framing across audiences; stakeholders shown outdated claims | CONTROL.md as single source of truth (R-005); this document cross-referenced from CONTROL.md | Periodic docs-alignment pass (SF-105) |
| HAZ-07 | Public preview shared before review complete | Preview URL or build shared externally ahead of a safety/wording check | External audience sees unreviewed or unsafe copy | Review checklist (`docs/public-demo-pack/review-checklist.md`) gate before any external share | Manual pre-share checklist completion |
| HAZ-08 | "Digital twin" wording creates unsafe expectations | Marketing or casual language calls the timeline feature a predictive/autonomous "digital twin" | Stakeholders expect predictive or autonomous clinical capability that does not exist | Controlled terminology: always "Patient Journey Twin" / "Simulation Patient Twin", explicitly described as review/learning support, not prediction (R-007) | Copy review on every PR touching `PatientJourneyTwin.jsx` or related docs |
| HAZ-09 | Missing or incomplete data displayed without a "missing data" label | A cue or signal is generated against partial input | User assumes the picture is complete when it is not | Every domain function (`simulationRiskSupport.js`, `safetyRules.js`, `patientJourneyTrendModel.js`) documents `missingInformation`/`limitations` fields; UI is expected to surface them | `simulationRiskSupport.test.js`, `safetyRules.test.js` boundary-case coverage (PR #12) |
| HAZ-10 | Audit trail gap for safety-relevant actions | An action (e.g. review-cue acknowledgement, signal action) is not recorded | No traceable record if a decision is later questioned | `workflowEvents.js` records audit-trail entries for scenario/history events; `recordRiskSuggestionAction` requires action type and reason | `workflowEvents.test.js`; `signalClient.js` action tests |

## Safety Requirements

- Evidence must be visible for every review cue or signal shown to a user.
- Missing information must be explicitly labelled, never silently omitted.
- Draft notes and AI-generated text must remain editable, never auto-submitted.
- Unsafe clinical action wording (diagnosis, prescribing, autonomous escalation) must be blocked
  before it reaches the UI.
- Every simulation signal or suggestion must satisfy the existing envelope contract: it must
  declare itself `simulationOnly: true`, `clinicalUse: false`, `requiresHumanReview: true` (where
  applicable), and carry a `validationStatus` of `not-clinically-validated`, with explanation text
  matching the required safety phrases (see `isSafeSimulationEnvelope` in
  `src/services/signalClient.js`).
- Audit trail must record safety-relevant actions, including who acted, when, and why.
- No feature may connect to a live NHS system, live AWS production resource, or real patient data
  source without explicit, separately documented deployment approval.

## Verification

- Scenario testing: Exercise all fictional demo scenarios (`demoScenarios.js`) end to end,
  including edge cases with missing or boundary-value fields.
- Usability testing: Not yet conducted with real ward staff; planned for Phase 1 (Product
  Discovery) per `delivery-roadmap.md`.
- Clinical review: Not yet conducted; requires an appointed clinical safety lead.
- Technical testing: Automated unit/integration test suite (`npm test`) and build (`npm run
  build`), plus the safety-boundary wording scan run at PR review time.
- Residual risk review: To be conducted once a clinical safety lead is appointed and before any
  Phase 2+ (Secure Pilot Build) work begins.

## Approval Notes

- Decision: Not approved for any use beyond simulation, demonstration, and internal/stakeholder
  review. This outline itself requires independent review before it can be treated as a working
  safety case.
- Conditions: Requires an appointed clinical safety lead, a completed information-governance
  review (see `clinical-safety-ig-readiness.md`), and explicit deployment approval before any
  further use is considered.
- Review date: Recommend revisiting this outline at the start of Phase 1 (Product Discovery), or
  sooner if a new signal/suggestion type, hazard, or external-facing change is introduced.
