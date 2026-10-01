# WardSafe agent foundation v0.1

This simulation-only prototype uses fictional patient data for structured review support. Human review is required. It is not clinically validated and is not for clinical decision-making or live deployment. It does not diagnose, prescribe, recommend treatment, or initiate clinical actions.

Control board ID: SF-305. Code: `src/agent/`. This is the single description of the agent foundation. The earlier short note in `docs/ai/` has been merged into it.

## Architecture and implemented scope

The existing deterministic safety rules remain authoritative for reproducible simulation cues. The new flow adds an auditable, bounded review of one example without replacing those rules or the existing SBAR path.

```text
PatientSafetyPanel (DCU-031, explicit Run simulated review)
  -> AgentReviewPanel
  -> createReviewRun / immutable fictional patient snapshot
  -> append-only AgentSession
  -> allow-listed, schema-checked read tools
  -> existing simulation signals + recorded potassium trend
  -> escaped context + system-authored instructions
  -> mock AI provider + local response validation
  -> proposed review cue / awaiting-human-review / stop
  -> explicit human acceptance, edit or rejection
  -> human review and action-recorded events / completed
```

Implemented phases: B session, events and provenance; C seven read tools; D model abstraction and opt-in SBAR provider; E bounded orchestration; F one patient-panel example; G this architecture and the [trust decision](decisions/001-agent-generated-content.md).

The UI calls the in-memory orchestrator directly. There is no new agent HTTP endpoint, database persistence, background worker, or external model connection. The pre-existing API/SBAR integration remains separate.

## Trust boundaries

| Layer | Representation | Can instruct the model | Can be stored as a fact | Permitted use |
| --- | --- | --- | --- | --- |
| Source facts | `source-fact`: recorded fictional lab values with source record, observed time and import time | No | Yes | Evidence; never instructions |
| Deterministic derivations | `deterministic-derivation`: reproducible lab trend and existing simulation-rule cues | No | No, it is derived | Review context; never established source values |
| AI interpretation | `trusted: false`, `origin: model-generated`, `trustTier: ai-interpretation` | No | No, never | Proposed draft only |
| Human decision | `human-decision`: separate event, actor reference, timestamp and optional edited text | No | Recorded as an event | Record of a simulated human review; never retroactively changes source facts |
| Reference knowledge | `reference-knowledge`, wrapped as untrusted data | No | No | General cue-related context, not patient-specific truth |

Only `createSystemInstruction` produces instruction-eligible objects, using private factory identity held in a WeakSet. Copies, look-alikes, retrieved text, clinical notes, and generated summaries do not obtain instruction authority. JSON context escapes angle brackets and ampersands; free text and reference material use escaped `untrusted_data` blocks. These defences reduce injection risk; text filtering is not a complete semantic safety proof.

Tools are read-only. A tool name must be `get` followed by a capitalised name, every permission must start with `read:`, and input and output schemas are closed. Names such as `executeSQL`, `runShell`, `eval`, `query` and `fetch` are refused. Human review and recorded-action events need a human actor with a reference.

The public case corpus is excluded. Tools omit patient names, nurse names, task owners and audit-trail text. Tool output and event data are immutable copies. This is data minimisation for fictional fixtures, not an anonymisation service for real records.

## Sessions and bounds

`createReviewRun(options, dependencies)` owns its session. `run()` is idempotent for that handle and returns the same promise. The UI receives frozen snapshots, not a mutable session. It never offers the model a tool-selection or execution interface.

The fixed sequence invokes `getPatientSummary`, `getLatestLabs`, `getLabTrend`, `getCurrentMedications`, `getClinicalNotes`, `getExistingReviewCues`, and `getRelevantGuidance`, followed by one model call. The supplied policy can narrow the seven-tool allow-list and two read permissions, never widen them. Guidance accepts a cue type only. Historical facts are read from the same immutable fictional source as the tools so both readings cited by the trend are available with provenance.

The default budget is eight steps (seven tool calls plus one model call) and 5,000 ms for the whole run, including tool retrieval. Configuration accepts 1–32 steps and a positive timeout up to 30,000 ms. Exhaustion stops before the next operation. Each run requests at most one AI review even when configured with a larger budget.

`cancel()` or an external `AbortSignal` stops a pending run. The whole-run timeout also covers a tool that never resolves. A guarded session prevents late tool/model completions from appending events or publishing a cue after cancellation or failure. Timers and listeners are released. JavaScript timers cannot pre-empt synchronous code blocking the event loop; future untrusted or CPU-heavy adapters need process isolation and cancellable execution. Provider adapters and tool implementations are trusted application code, not plugins supplied by model output.

States are `open`, `awaiting-human-review`, `completed`, `cancelled`, and `error`. The run always stops at human review. Only a separate explicit review operation completes a successful session. The SF-305 session guard also blocks completion while the latest AI review has no subsequent human review event.

## Provenance and audit

Events have immutable IDs, session and correlation IDs, increasing sequence numbers, timestamps, actor kinds and payloads. Clock and ID factories are injected. Context loads, requested/completed tools, deterministic signals, model requests/results, required/completed review, and failures are recorded.

The proposed cue retains source facts, the deterministic trend and existing cues, model/provider identity, source event IDs, tool completion event IDs, the generated event ID, review-required event ID, and cited evidence IDs. For DCU-031 the recorded potassium readings are 3.8 and 3.2 mmol/L; the reproducible change is -0.6 mmol/L. Their times are fixture labels on the explicit synthetic reference date in `clinicalFact.js`, not live observations.

Failures store allow-listed reason codes, not arbitrary provider exception messages or rejected model output. Validated generated text and fictional source context remain in the in-memory audit with their distinct trust tiers. No prompts, events or decisions are sent to a logging service.

## Model adapters and output validation

The review orchestrator accepts only the mock provider. Its output passes the closed response schema, evidence allow-list, length bounds and unsafe-wording checks before a cue is created. Tests inject malformed output, failures and hanging mock providers. No API key is needed.

The separate, existing server SBAR provider is off by default. External AI is selected only if `SAFEFLOW_EXTERNAL_AI_ENABLED` and `SAFEFLOW_SIMULATION_ONLY` are each exactly `true`, and `OPENAI_API_KEY` is a non-empty string. A leftover key alone is ignored with a secret-free warning. The enabled state and reason are logged at startup. Its request has `store: false`, separates free text, omits fixture names/private fields, and validates returned SBAR structure locally. Returned model drafts are untrusted and require human review; unknown evidence links are dropped. These flags never enable an external provider in the new orchestrator.

## Human review and UI example

Open DCU-031 in the existing patient safety panel, stay on Safety Overview, and choose **Run simulated review**. The card distinguishes source facts, deterministic signal, untrusted AI interpretation and human decision. **Why this review cue appeared** exposes the source records and event chain. **Review session audit** exposes the ordered events.

**Accept review**, **Edit review**, and **Reject review** require a separate user action. Edits are stored beside the unchanged AI interpretation. A `HUMAN_REVIEW_COMPLETED` event links the exact generated event; `ACTION_RECORDED` means only that a simulation review was recorded. `clinicalAction` stays null. The original generated text remains untrusted after acceptance. There is no automatic task creation, escalation, prescribing, record sign-off or clinical action.

The reviewer is explicitly the fictional demo reviewer. Actor references are not authentication. A future clinical system needs authenticated identity, authorisation, retention policies and independently assured review gates.

Controls have labels, native keyboard behaviour, visible focus and 44px minimum heights. Progress and completion are announced through a polite live region. Cancellation and retry have explicit outcomes. Reviews persist across the panel's detail tabs, but patient changes, replacing the patient context, leaving the mounted panel, reset, and reload discard the in-memory session. Pending work is cancelled on unmount or context replacement, and late results are ignored. This is not a durable clinical audit store.

## Context compaction

Generated summaries can be represented and audited, but this bounded run does not perform automatic compaction. Any future reuse must keep `trusted: false`, provenance, model metadata and source event IDs and enter prompts only as untrusted data. An accepted or edited draft must never become system/developer instructions or overwrite original clinical evidence.

## Evolution seams

Future server orchestration can sit behind an authenticated API without changing the four trust domains. An append-only event-store adapter could persist events using the existing approved AWS architecture (including the current eu-west-2 direction), with least-privilege IAM, encryption, retention and auditable access. Long-running work would need durable cancellation, idempotency and concurrency control. No infrastructure is provisioned by this feature.

Future NHS/FHIR work may map facts and provenance to appropriate FHIR R4/UK Core resources through validated adapters. Mapping, clinical validation, governance and deployment approval remain future work. No live EPR/NHS connection is present. ECG interpretation and the deferred ECG documentation tool are outside this milestone.

## Related work

The Go 6 PEARLS simulation debrief (SF-325, see `docs/ai/go6-codex-handover.md`) reuses the session, generated-content, system-instruction and untrusted-content primitives. It is rule-based and makes no model call. The existing server SBAR provider reuses the unsafe-wording pattern and the schema validation. A real model provider for the review orchestrator is not built and stays off.

## Validation

Focused commands:

```sh
npx vitest run src/agent server src/components/AgentReviewPanel.test.jsx src/components/PatientSafetyPanel.test.jsx --config ./vitest.config.js --configLoader native --maxWorkers 2
npx playwright test e2e/agent-review.spec.js
npm run build
git diff --check
```

The tests cover fixture provenance, offline execution, deterministic trends, instruction injection, tool policy, limits, cancellation, whole-run timeout, late completion, malformed model output, human-only decisions, preserved source data, tab changes, patient changes and the browser journey. Full-suite validation and any timing exceptions are recorded in the continuation report. Larger TrustNetworkView tests may need the existing 120-second timeout workaround on this PC; that is not a relaxation of agent limits.
