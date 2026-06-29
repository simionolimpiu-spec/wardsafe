# SafeFlow Signal And Intelligence Engine Design

Date: 2026-06-27
Status: approved design direction
Product mark: SafeFlow
Confidential pack name: SafeFlow Nursing

## Purpose

SafeFlow Signal and Intelligence Engine is the predictive layer that helps nurses notice likely missed clinical actions before harm develops. It should combine clinical signals from labs, observations, microbiology, urine, faecal, swab and workflow evidence, then surface nurse-confirmed suggestions.

The first prediction target is missed clinical action risk:

- A result, trend or missing result may require review.
- The expected acknowledgement, escalation, handover, task or blocker is not visible.
- The nurse needs a clear evidence summary and a safe next workflow action.

The engine must not diagnose, prescribe, order treatment, or autonomously change the record. It supports nurse-led review.

## Current SafeFlow Position

SafeFlow currently has:

- Simulation-only UI workflows for board, patients, observations, tasks, escalations, handover, discharge, reports and audit.
- AWS/RDS simulation foundation in eu-west-2.
- RDS-backed simulation workspace read models and audit-event routes.
- Server-side OpenAI draft boundary for wording support.
- Synthetic PostgreSQL seed data and public-safe integration planning docs.

SafeFlow does not yet have:

- Live ICE, LIMS, EPR, observations or microbiology integration.
- A trained deterioration or missed-action ML model.
- Clinical safety approval for live patient data.
- Production identity, public API ingress or live pilot governance.

## Non-Negotiable Safety Boundaries

- Simulation and de-identified modes come before live patient data.
- Live read-only feeds require approved information governance, clinical safety and supplier/Trust integration approval.
- No model output can be presented as diagnosis, prescription, or treatment instruction.
- All suggestions must show source evidence, timestamps, missing data and uncertainty.
- Nurse confirmation is required before a suggested flag, blocker or task becomes active.
- Every suggestion, acceptance, dismissal, snooze and escalation must be audited.
- If a feed is stale or unavailable, SafeFlow must show data unavailable or stale, not silence.
- Rules can override or suppress model output where safety requires.
- LLMs may explain evidence and draft wording only; they do not make the risk decision.

## First Product Scope

Build a simulation-first, ML-first architecture for combined signal risk detection.

The first implementation uses synthetic/RDS signals shaped like real clinical feeds. It designs a clear live read-only integration path for ICE/EPR later, but does not activate live ingestion.

Signal domains:

- Blood work and ICE-style pathology: potassium, magnesium, creatinine, CRP, WBC, lactate, cultures pending/resulted.
- Observations: NEWS2, vital signs, observation time, trend and stale-observation status.
- Microbiology: urine, blood cultures, wound swabs, respiratory swabs, faecal results and status.
- Workflow evidence: tasks, escalations, handover notes, discharge blockers, audit events and acknowledgement state.
- Medication/allergy context when available and approved.
- Future sensor, neural-link or external AI inputs through the same signal adapter boundary.

Outputs:

- Suggested safety flag.
- Suggested blocker.
- Suggested task.
- Evidence summary.
- Missing-data note.
- Audit event.

Each output starts as suggested and requires nurse action: accept, dismiss, snooze, escalate or convert to a task/blocker.

## Architecture

```text
Source systems or synthetic feed
  -> Integration Gateway
  -> Signal Normaliser
  -> Clinical Signal Store
  -> Feature Builder
  -> Risk Engine
       - ML predictor
       - deterministic guardrail rules
       - deduplication and cooldown controls
  -> Explanation Builder
       - structured evidence summary
       - optional LLM wording support
  -> Suggestion Store
  -> SafeFlow API/read models
  -> Nurse UI
  -> Audit Event Store
```

### Integration Gateway

The gateway receives source-specific data and converts it into SafeFlow internal signal events.

Simulation mode:

- Reads synthetic signal events from RDS seed data or deterministic generators.
- Produces ICE-like, NEWS2-like and microbiology-like events without patient-identifiable data.

Future live read-only mode:

- Receives approved feeds through Trust integration infrastructure.
- Candidate patterns: FHIR APIs, HL7 v2 feeds, MESH, vendor-specific ICE/LIMS interface, or EPR data platform feed.
- Must be read-only until a separate writeback safety case exists.

The browser never connects directly to ICE, LIMS, EPR or AI providers.

### Signal Normaliser

Converts every inbound event into a common shape:

```text
ClinicalSignal
- signalId
- syntheticPatientRef or approved patient/encounter reference
- sourceSystem
- sourceMessageId
- sourceType: lab | observation | microbiology | workflow | medication | allergy | sensor | external_ai
- signalCode
- displayName
- value
- unit
- referenceRange
- status: preliminary | final | amended | cancelled | missing | unavailable
- collectedAt
- resultedAt
- receivedAt
- effectiveAt
- sourceFreshness
- confidence
- provenance
- simulationOnly
```

Patient matching is part of normalisation. A signal must not enter the risk engine unless the patient and encounter match is safe for the environment. In simulation, synthetic references such as `DCU-031` remain mandatory.

### Clinical Signal Store

Stores append-only signal events plus derived current-state projections.

Minimum tables or logical models:

- `clinical_signals`
- `signal_source_status`
- `signal_acknowledgements`
- `risk_predictions`
- `risk_suggestions`
- `suggestion_actions`

Signals are immutable. Corrections arrive as amended/cancelled/replacement events with provenance.

### Feature Builder

Turns signals into model-ready features:

- Latest value and trend.
- Delta over time.
- Missing expected result.
- Stale observation window.
- Result status: preliminary/final/amended.
- Action evidence: acknowledged, escalated, task created, handover updated, blocker present.
- Cross-signal context: abnormal lab plus rising NEWS2 plus no acknowledgement.
- Source freshness and reliability.

Features must be versioned. A prediction must record the feature-set version used.

### Risk Engine

The first risk target is missed clinical action risk.

Risk engine components:

- ML predictor: estimates likelihood that a signal/action gap needs nurse review.
- Guardrail rules: deterministic suppressions, escalations and missing-data rules.
- Deduplication: prevents repeated alerts for the same unresolved issue.
- Cooldowns: prevents alert fatigue after acknowledgement/snooze.
- Severity tiering: separates information, watch, urgent and unavailable-data states.

The ML predictor can be trained or evaluated only with approved labelled data. Before approved de-identified or live-labelled data exists, the system may run a simulated/shadow predictor for workflow demonstration, but it must be labelled as simulation evidence only.

### Explanation Builder

The explanation builder creates nurse-facing wording from structured evidence.

It must include:

- Why this suggestion exists.
- Which signals contributed.
- What is missing or stale.
- What has already been acknowledged.
- What SafeFlow suggests as workflow action.
- Confidence/uncertainty in plain language.

LLM use is limited to wording and summarisation. The LLM receives only the evidence bundle allowed by the environment. It must not invent source evidence or produce clinical instructions.

## Suggestion Lifecycle

Suggestion states:

- `suggested`
- `accepted`
- `dismissed`
- `snoozed`
- `escalated`
- `converted_to_task`
- `converted_to_blocker`
- `resolved`
- `superseded`

Nurse actions:

- Accept as flag.
- Convert to task.
- Convert to blocker.
- Escalate.
- Dismiss with reason.
- Snooze for a defined period.
- Mark already actioned.

Every transition writes an audit event with actor, timestamp, suggestion id, patient reference, action, reason and evidence version.

## Example Scenarios

### Abnormal Blood Work And No Visible Review

Signals:

- Potassium falling.
- Magnesium missing.
- Creatinine rising.
- No task or escalation after result receipt.

Suggestion:

- Flag: electrolyte result review may be needed.
- Blocker: unresolved abnormal blood result.
- Task: review blood trend and document action.

Evidence shown:

- Latest values and timestamps.
- Missing magnesium status.
- No acknowledgement found.

### Positive Microbiology Result And Handover Gap

Signals:

- Positive urine culture or swab finalised.
- No acknowledgement.
- Handover note does not mention result.

Suggestion:

- Flag: microbiology result not visibly reviewed.
- Blocker: infection-related result pending nurse confirmation.
- Task: acknowledge result and update handover if relevant.

### Rising NEWS2 And Stale Observations

Signals:

- NEWS2 rising.
- Latest observations older than expected for risk tier.
- No active escalation.

Suggestion:

- Flag: observation trend review suggested.
- Blocker: observations stale for current risk.
- Task: confirm observation plan.

## Integration With ICE And Other Systems

SafeFlow should not hard-code to one vendor. It should define adapters.

Potential live paths:

- ICE/LIMS -> HL7 v2 pathology result feed -> Trust integration engine -> SafeFlow gateway.
- ICE/LIMS -> FHIR DiagnosticReport/Observation API -> SafeFlow gateway.
- Trust data platform -> approved results and observations extract -> SafeFlow gateway.
- MESH or other approved NHS messaging route where appropriate.
- EPR -> observations, tasks, notes, allergies and medications where approved.

Integration inventory must be completed per Trust/system:

- Supplier and owner.
- Test environment availability.
- Authentication and network route.
- Patient/encounter identity fields.
- Message/API format.
- Result status semantics.
- Update/amendment semantics.
- Read-only and writeback availability.
- Safety and information-governance constraints.

Live integration blockers must be surfaced as product blockers:

- Feed unavailable.
- Feed stale.
- Patient matching uncertain.
- Result status unknown.
- Duplicate or amended result unresolved.
- Source system down.
- Authentication or permission failure.

## ML Design

### Prediction Target

Primary target:

- A missed clinical action risk exists when a signal or pattern likely warrants nurse review and no matching acknowledgement/action is visible within the expected workflow window.

Examples of positive labels:

- Abnormal result not acknowledged.
- Positive microbiology result not handed over.
- Rising NEWS2 without matching escalation or observation plan.
- Missing follow-up result after relevant abnormal signal.

Examples of negative labels:

- Result acknowledged and task/escalation exists.
- Result clinically irrelevant to the configured scenario.
- Duplicate signal already handled.
- Feed stale/unavailable, where unavailable-data warning is the right output instead of clinical-action risk.

### Model Inputs

Use structured, versioned features only:

- Signal values and trends.
- Time since result/observation.
- Result status and source freshness.
- Missing-data indicators.
- Existing tasks/escalations/handover evidence.
- Patient risk tier in simulation.
- Unit/reference-range-normalised values where available.

Do not use free-text clinical notes as direct model input in the first version. If later approved, note text must be transformed into bounded, audited features.

### Model Output

The predictor emits:

- `riskScore`: 0 to 1.
- `riskTier`: info | watch | urgent.
- `modelVersion`.
- `featureSetVersion`.
- `topContributors`.
- `uncertainty`.
- `requiresHumanReview: true`.

The engine then applies guardrails and workflow context before creating a suggestion.

### Evaluation

Before any live pilot:

- Define labelled review set.
- Measure precision, recall, false positives, false negatives and time-to-review impact.
- Stratify by signal type and ward scenario.
- Review false negatives clinically.
- Track alert burden per nurse/shift.
- Define threshold change process.
- Run shadow mode before nurse-facing activation.

The acceptable threshold is not just statistical. It must be approved through clinical safety review.

### Drift Monitoring

Monitor:

- Prediction volume by source.
- Acceptance/dismissal/snooze rates.
- Time to nurse action.
- False-positive themes.
- Feed freshness.
- Missing-data frequency.
- Model confidence distribution.
- Differences between simulation, de-identified and live pilot environments.

Any meaningful drift triggers model review before threshold changes.

## Error Handling

Source or integration errors:

- Show source unavailable/stale status.
- Do not infer normality.
- Suppress clinical-action suggestions that depend on missing source data.
- Create a data-quality blocker if the absence itself is unsafe.

Model errors:

- Fall back to deterministic safety rules where available.
- Mark model unavailable.
- Do not call LLM explanation if risk decision failed.

LLM errors:

- Fall back to structured explanation templates.
- Keep suggestion evidence visible.

Patient matching errors:

- Quarantine signal.
- Do not show patient-level suggestion.
- Create technical/integration audit event.

## UI Requirements

Ward board:

- Show new intelligence suggestions as distinct from confirmed flags.
- Display severity, evidence count, source freshness and suggested action.
- Avoid colour-only meaning.

Patient panel:

- Intelligence tab or section with evidence bundle.
- Suggested flag/blocker/task actions.
- Missing data panel.
- Provenance and timestamps.

Tasks/blockers:

- Suggested items must be visually distinct until accepted.
- Accepted items become normal workflow items with audit link.

Audit:

- Show model version, feature version and explanation version.
- Show nurse action and reason.
- Do not expose secrets, direct identifiers or raw integration payloads.

## Security And Governance

Required before live or de-identified external data:

- Data protection impact assessment.
- Clinical safety hazard log.
- DCB0129 manufacturer clinical safety case.
- DCB0160 deployment/use safety case with partner organisation.
- Medical device and AI/SaMD classification review.
- Role-based access and authentication.
- Data minimisation and retention policy.
- Incident response and model rollback plan.
- Supplier/Trust integration approval.

## Implementation Phases

### Phase 1: Simulation Signal Model

- Add synthetic clinical signal tables/events.
- Add signal normaliser interfaces.
- Seed combined lab, observation, microbiology and workflow scenarios.
- Add read model for patient signal timeline.

### Phase 2: Shadow Risk Engine

- Build feature builder.
- Add simulated ML predictor interface.
- Add deterministic guardrails.
- Store predictions and suggestions.
- Keep output simulation-labelled.

### Phase 3: Nurse Confirmation Workflow

- Add suggested flag/blocker/task UI.
- Add accept/dismiss/snooze/escalate actions.
- Audit every transition.

### Phase 4: Explanation Layer

- Add structured evidence summaries.
- Add optional server-side LLM wording support.
- Add unsafe wording and missing-evidence tests.

### Phase 5: Integration Feasibility Pack

- Complete ICE/EPR integration inventory.
- Map FHIR/HL7/MESH/vendor feed options.
- Define patient matching and result status semantics.
- Produce clinical safety and governance evidence pack.

### Phase 6: De-Identified Or Shadow Pilot Readiness

- Ingest approved de-identified data if available.
- Evaluate model thresholds.
- Run shadow mode with no nurse-facing clinical suggestions until approved.

## Acceptance Criteria

- Synthetic combined signals can generate a missed-action risk suggestion.
- The suggestion creates proposed flag, blocker and task records.
- Nurse can accept, dismiss, snooze or escalate.
- Every output includes evidence, missing-data status and source freshness.
- Unsafe wording and direct identifiers are blocked.
- Model decision and LLM wording are separated.
- LLM failure does not prevent structured evidence display.
- Integration failure is visible as unavailable/stale, not hidden.
- Tests cover false-positive suppression, missing-data warnings and audit events.
- Current RDS simulation mode remains safe and does not require live feeds.

## Out Of Scope For First Build

- Live ICE/LIMS/EPR connection.
- Production clinical deployment.
- Autonomous escalation.
- Prescribing, diagnosis or treatment recommendations.
- Writeback to EPR/ICE.
- Training a live clinical model from patient-identifiable data.
- Direct browser access to clinical systems or AI providers.

## Open Decisions For Later

- Exact Trust integration route.
- Whether model hosting is in AWS Lambda, ECS, SageMaker or another approved platform.
- Whether de-identified data can be used for model evaluation.
- Which clinical owner signs off thresholds and hazard controls.
- Whether any writeback workflow is ever allowed.

