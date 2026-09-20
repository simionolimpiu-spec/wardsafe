# CODEX TASK: SafeFlow Phase 1 - Connect / Voice / Point-of-Care foundation (SF-307)

Dispatched by: Claude (orchestrator, reviewer, QA gate). You are the implementer.

## 0. First action

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md before making implementation decisions.

The master specification does not exist yet. Your FIRST deliverable is to create it (section 4.A). Implement code only after it exists, and make the code match it. Also read AGENTS.md, docs/project/task-plan.md and docs/project/findings.md (orchestration files already committed on this branch). Do not edit docs/project/; Claude owns it.

## 1. OBJECTIVE

Deliver Phase 1 only: architecture documents, framework-free domain models, provider contracts, simulation providers, event definitions and focused safety tests for three new product pillars (SafeFlow Connect, SafeFlow Voice, SafeFlow Point of Care) plus shared provenance. No UI. No live integration. No new dependencies.

## 2. REPOSITORY FACTS (verified by Claude, do not re-derive differently)

- Working copy: C:\Users\oli\Documents\wardsafe-cvp-foundation (fresh clone, npm ci done).
- Branch: feature/connect-voice-poc-foundation, created from origin/codex/safeflow-prototype at be30246. One Claude commit already on it (docs/project).
- Stack: React 19 + Vite, plain JavaScript ES modules (no TypeScript), Vitest (jsdom, globals), tests co-located as `*.test.js`. Use npm (package-lock.json), not pnpm.
- Domain code convention: pure functions in `src/domain/*.js`, provider objects shaped like `src/domain/draftProvider.js` (`{ id, method() }`), deterministic, fail-closed guards (see `server/signalProvider.js` refusing silent placeholder fallback).
- Existing audit event helper: `src/domain/workflowEvents.js` (`createAuditEvent`) is a UI audit-trail helper. Do not change it.
- Safety wording: `src/domain/safetyLanguage.js` + `safetyLanguage.test.js`. The test scans a `DOCUMENTATION_FILES` list with a boundary-aware scanner. Banned terms (diagnosis, prescribe, treatment recommendation, AI decision, autonomous care/decision, clinically validated, live NHS deployment, etc.) are only allowed inside explicit boundary/negation context.
- Highest control ID in CONTROL.md is SF-306. SF-305 (agent foundation) is In progress on the separate unmerged branch `feature/agent-foundation-v0.1` with its own `src/agent/provenance.js` and trust tiers. That code is NOT on this branch. Do not import from it, do not copy it, do not create `src/agent/`.
- No `docs/architecture/` folder exists yet.

## 3. TARGET LAYOUT (create exactly this shape; small files; each module with a co-located test)

```
docs/architecture/safeflow-connect-voice-point-of-care-master.md
docs/architecture/point-of-care-hardware-profile.md
docs/architecture/fhir-observation-mapping.md

src/shared/
  domainValues.js         frozenCopy, isNonEmptyString, isIsoTimestamp, timestampFrom(now)
  provenance.js           capture-source provenance (section 5.1)
  reviewStatus.js         REVIEW_STATUSES + helpers
  platformEvents.js       event type registry + createPlatformEvent (section 5.6)
  providerContract.js     defineProviderContract / assertImplementsContract / assertSimulationProvider
  index.js

src/connect/
  roleRecipient.js
  communicationThread.js
  communicationEvent.js
  structuredRequest.js
  notificationPayload.js
  communicationProvider.js          contract
  simulationCommunicationProvider.js
  fixtures.js                        fictional roles/assignments only
  index.js

src/voice/
  speechProfile.js
  speechCandidate.js
  numericSpeechSafety.js
  voiceCaptureLifecycle.js           dictation + ambient state machine
  translationDraft.js
  providers/contracts.js             SpeechRecognition, SpeechSynthesis, AmbientDocumentation, Translation, ClinicalSpeechLexicon
  providers/simulationProviders.js
  lexicon/clinicalSpeechLexicon.js   layered lexicon model + merge
  lexicon/fixtures.js                small fictional/generic term sets
  index.js

src/pointOfCare/
  pointOfCareSession.js
  deviceObservation.js               ObservationCandidate model
  providers/contracts.js             DeviceObservationProvider, DocumentCaptureProvider
  providers/simulationProviders.js
  index.js
```

Adjust file names only if a strong existing convention requires it, and say why in your report. `src/shared` must not import from connect/voice/pointOfCare. Pillars may import from `src/shared` only. Pillars must not import each other in Phase 1.

## 4. DELIVERABLES

### A. Master specification (commit 1)

`docs/architecture/safeflow-connect-voice-point-of-care-master.md`, canonical, status "Phase 1 foundation - simulation only". Required sections:

1. Purpose and product principle: SafeFlow is a point-of-care workflow and intelligence layer, not a messaging app, standalone AI scribe, observations app, EPR clone or dashboard. The human makes the clinical decision.
2. Product boundary: simulation/prototype only, fictional patient data only, no real patient data, human review required, not clinically validated, no live NHS system. Explicit "never permitted" list: autonomous diagnosis, autonomous prescribing, autonomous treatment recommendation, autonomous escalation, autonomous documentation sign-off, silent submission of generated clinical information, LLM-calculated NEWS2 or other validated scores, AI sending clinically meaningful communication without human review. "AI may" list: transcribe, draft, structure, summarise, translate drafts, organise, identify candidate tasks, surface information for review, prepare communication drafts.
3. Four pillars (Clinical, Connect, Voice, Point of Care) and how they integrate as one workflow, not four apps. Map existing modules (review cues, tasks, handover, Patient Journey Twin, audit) to the Clinical pillar.
4. Fundamental domain rule: MESSAGE != TASK != REVIEW CUE != ESCALATION, with definitions, allowed references, and the rule that none silently transforms into another.
5. Connect: capabilities list, role-based communication hierarchy (Person > Role > Team > Ward/service > Organisation > Current assignment/availability), domain objects, structured request lifecycle, future channels (safeflow, teams, nhs-notify, email, sms, push, whatsapp, voice) as NOT connected, future providers (Microsoft Teams/Graph, NHS Notify/NHS App, NHSmail, AWS End User Messaging, SMS, Amazon Connect, Twilio, official WhatsApp Business API) and the prohibition on Baileys, WA-AKG or any unofficial WhatsApp Web automation.
6. Voice: dictation workflow and explicit states (Listening, Processing, Transcript, Draft ready, Review required, Saved); ambient documentation (explicit start, visible state, never background listening, push-to-talk default in multi-bed bays, single room only if policy permits, sensitive-context disable); audio lifecycle (temporary encrypted audio > transcription > draft > review > approved > deletion per policy; prototype: no real audio, no retention, no silent upload, lifecycle metadata only); accent/dialect/code-switching distinction and the rule that SafeFlow never infers nationality, ethnicity or origin from voice; SpeechProfile; layered clinical speech lexicon; provider capability flags; confidence and safe failure (exact message: "SafeFlow could not reliably understand this input. Please repeat or enter it manually."); numeric speech safety; multilingual support (original text always kept; machine translation not equivalent to professional interpreting; interpreter pathway for consent, diagnosis discussions, treatment discussions, complex decisions - phrase with boundary context); TTS output modes private/headset/device/disabled and no confidential announcement through open speakers; vendor options listed as future research options only (Dragon Medical One, Dragon Copilot, TORTUS, Heidi, Augnito, T-Pro, G2 Speech, Azure Speech, Amazon Transcribe, Amazon Polly, Google Speech/Chirp, approved local models), no endorsement.
7. Point of Care: simulated badge tap > simulated wristband scan > binding > action menu (Record observations, Dictate note, Start bedside session, Care/forms, Tasks, Communication) > end/lock. PointOfCareSession fields. Future auth seams (CIS2, Entra, Trust SSO, Imprivata, NFC readers) not implemented.
8. Observations: device > DeviceObservationProvider > structured candidate > human confirmation > SafeFlow > future FHIR. Voice observation path with the worked example (RR 24 /min, SpO2 93 %, oxygen 2 L/min nasal cannula, Confirm / Edit / Cancel). No automatic save. No LLM NEWS2.
9. Nursing forms framework (future), initial targets later: basic nursing note, mobility entry, fluid balance.
10. Provenance model (section 5.1 below).
11. FHIR/interoperability summary pointing to fhir-observation-mapping.md.
12. Paper-to-digital (DocumentCaptureProvider seam, future).
13. Future AI communication assistant: AI draft > human review > human action; never autonomous sending.
14. Privacy-safe notifications (lock-screen text such as "SafeFlow - new review request").
15. Event model (section 5.6).
16. Accessibility: WCAG 2.2 AA direction, voice supplementary, manual controls always available, recording state not colour-only, keyboard support, ~44px targets, reduced motion, TTS optional.
17. Speech safety evaluation: test conditions and measures (WER, clinical term, medication name, numeric, negation, unit error rates). Evaluate the engine, never rank clinicians.
18. Governance requirements to meet in future (DCB0129, DCB0160, DTAC, DPIA, clinical safety case, hazard log, cyber assurance, AVT governance, MHRA device assessment where applicable, interoperability, accessibility, human factors). State plainly that none is claimed now.
19. Implementation programme Phases 1-10 exactly: 1 Architecture/domain/provider foundations; 2 Connect simulation UI; 3 Voice dictation + TTS; 4 Point-of-Care bedside session; 5 Voice/device observation capture; 6 Nursing forms/documentation; 7 Accent/multilingual/speech safety; 8 AI-assisted communication/documentation; 9 External adapter simulations; 10 Hardening/evaluation/governance. Each with scope, exit criteria, and "no phase starts without human approval".
20. Relationship to SF-305 agent foundation: SF-305 trust tiers (source fact, deterministic derivation, AI interpretation, human decision) describe how a fact was derived; this spec's provenance describes how an item was captured. Reconciliation is a deferred item for when SF-305 merges.
21. Phase 1 code map: table of every module created and which spec section it implements.

### B. `docs/architecture/point-of-care-hardware-profile.md`

Fixed bedside terminal: 15-22 inch medical touchscreen, VESA/bedhead mount, cleanable enclosure, Wi-Fi 6/6E, Ethernet where appropriate, NFC/badge reader, 2D barcode reader, directional push-to-talk microphone, optional ambient microphone, speaker, private headset/earpiece, optional camera, privacy filter. Handheld: healthcare/disinfectant-ready, barcode, NFC, Wi-Fi, optional cellular, camera, push-to-talk, hot-swappable/replaceable battery where useful. Hardware classes (Advantech, DT Research, Ascom Myco, Zebra Healthcare) as research options, not procurement endorsements. Infection-control and privacy notes. No browser prototype needs hardware.

### C. `docs/architecture/fhir-observation-mapping.md`

Map SafeFlow ObservationCandidate, PointOfCareSession and provenance to FHIR R4 / UK Core resources: Observation, Patient, Encounter, Device, Practitioner, Provenance. Include a field table, LOINC/SNOMED placeholders marked "to be confirmed against UK Core", UCUM units, note ISO/IEEE 11073 for devices, and the rule that only human-confirmed observations would ever map to `Observation.status = final`; unconfirmed candidates are never exported. State no live NHS APIs.

Add all three new docs to `DOCUMENTATION_FILES` in `src/domain/safetyLanguage.test.js` so they are wording-scanned. Every banned term must sit in explicit boundary context. Do not weaken the scanner or its patterns.

### D. Domain foundations, E. Provider contracts, F. Simulation providers

Rules for every factory: pure, deterministic, injected `{ now, createId }` (no Date.now or Math.random inside domain factories), validates input and throws a named Error subclass on invalid input, returns deep-frozen plain data via `frozenCopy`, sets `simulationOnly: true`. Reject unknown keys where the section says so.

#### 5.1 src/shared/provenance.js
- `PROVENANCE_SOURCE_TYPES`: manual, voice, device, ambient-draft, imported, scanned-document, simulation-fixture.
- `createCaptureProvenance({ type, provider, capturedAt })` returns `{ type, provider, capturedAt, humanConfirmed: false, reviewedBy: null, reviewedAt: null, simulationOnly: true }`. Always starts unconfirmed. There is no parameter that sets humanConfirmed at creation.
- `confirmCaptureProvenance(provenance, { reviewedBy, reviewedAt })` returns a NEW frozen object with humanConfirmed true; reviewedBy and reviewedAt required; throws if already confirmed.
- Name the exports `createCaptureProvenance` / `confirmCaptureProvenance` to avoid collision with SF-305's `createProvenance`.

#### 5.2 src/shared/reviewStatus.js
`REVIEW_STATUSES`: draft, review-required, approved, rejected. Helper `requiresHumanReview(status)`.

#### 5.3 src/shared/providerContract.js
- `defineProviderContract({ name, methods, capabilityKeys })` frozen description.
- `assertImplementsContract(provider, contract)`: provider must have non-empty `id`, `mode`, `capabilities` object containing every capability key, and every method as a function.
- `assertSimulationProvider(provider)`: throws unless `mode === 'simulation'` and `live === false`. Every Phase 1 registry or factory that accepts a provider must call it (fail closed). No live provider implementations exist in Phase 1.

#### 5.4 src/connect
- `roleRecipient.js`: `ROLE_KEYS` (medical-team, pharmacist, physiotherapist, occupational-therapist, discharge-coordinator, senior-nurse, clinical-educator, on-call) and `createRoleRecipient({ roleKey, teamId, wardId, organisationId })`. `resolveRoleRecipient(recipient, assignments)` returns the fictional currently assigned person or `{ resolved: false, reason }`; never guesses a person.
- `communicationThread.js`: thread `scope` one of direct, team, mdt, patient, ward-service; patient scope requires `patientRef` (fictional id). Participants are person or role recipients.
- `communicationEvent.js`: `COMMUNICATION_EVENT_KINDS` exactly message, structured-request, acknowledgement, task-link, system-event. There is no escalation kind and no task kind. `channel` from the future channel list, but Phase 1 only accepts `safeflow` (others throw "channel not enabled in simulation"). Author kind: human, system, ai-draft. `ai-draft` events have `status: 'draft'`, `reviewStatus: 'review-required'` and cannot be sent until `approveAiDraft(event, { approvedBy, approvedAt })` by a human. `task-link` carries a reference `{ taskId }` to an existing task id only, and creates nothing. Body text is never parsed for intent: a message containing words like "urgent" or "escalate" stays a message.
- `structuredRequest.js`: request types (review-request, discharge-query, therapy-referral-request, medicines-query, information-request; adjust wording to avoid banned terms). Lifecycle: sent > delivered > read > acknowledged > accepted > in-progress > completed, plus declined and cancelled. Pure `transitionStructuredRequest(request, { to, actor, at })` with an explicit allowed-transition table. Acknowledged does not imply accepted. Completed only from in-progress. acknowledged/accepted/in-progress/completed/declined require a human actor. No transition ever creates a task, review cue or escalation.
- `notificationPayload.js`: `createPrivacySafeNotification({ category })` produces generic lock-screen text only (for example "SafeFlow - new review request", "SafeFlow - new message"). It accepts no free text, patient or clinical fields; unknown keys throw.
- `communicationProvider.js`: contract methods `sendEvent`, `listThreadEvents`, `recordDeliveryState`. Capabilities: supportsDeliveryReceipts, supportsReadReceipts, supportsAttachments, supportsExternalChannels.
- `simulationCommunicationProvider.js`: in-memory, per-instance store, mode simulation, live false, supportsExternalChannels false. `sendEvent` rejects unapproved ai-draft events and non-safeflow channels. Never logs message bodies (no console calls at all).

#### 5.5 src/voice
- `speechProfile.js`: `createSpeechProfile({ userId, preferredLocale, preferredProvider, microphoneProfile, personalLexicon, recognitionCorrections, preferredOutputLanguage })`. Rejects unknown keys. Must reject, by name, keys such as nationality, ethnicity, countryOfOrigin, accentOrigin, accentScore, accuracyScore, clinicianRating. No field evaluates the clinician.
- `speechCandidate.js`: `createSpeechCandidate({ rawText, normalisedText, confidence, alternatives, provider, locale, capturedAt })`. rawText is always kept and never overwritten. confidence is number 0-1 or null. `reviewStatus` is always review-required at creation. `reliability`: 'unreliable' when confidence is null or below `SPEECH_CONFIDENCE_THRESHOLD` (export it; 0.85), then `safeFailureMessage` is exactly "SafeFlow could not reliably understand this input. Please repeat or enter it manually." and the candidate cannot be approved. Provenance type voice, unconfirmed. `approveSpeechCandidate(candidate, { reviewedBy, reviewedAt, editedText })` returns a new object with provenance confirmed; editedText kept separately from rawText. There is no path that substitutes an alternative or plausible text automatically.
- `numericSpeechSafety.js`: `detectNumericContent(text)` finds digits and English number words, and flags teen/ty confusables (13/30, 14/40, 15/50, 16/60, 17/70, 18/80, 19/90), decimals, negatives and missing units. Any candidate with numeric content has `containsNumericContent: true` and `numericConfirmationRequired: true`. `confirmNumericValue({ label, value, unit, sourceSpan }, { reviewedBy, reviewedAt })` is the only way to mark a number confirmed and requires a unit. Do NOT build an observation parser (that is Phase 5).
- `voiceCaptureLifecycle.js`: states idle, listening, processing, transcript, draft-ready, review-required, saved, cancelled. Transitions table; listening only from an explicit `start` with a human actor; saved only from review-required with an explicit human approval. Capture modes push-to-talk and ambient: ambient allowed only when `location.type === 'single-room'`, `policy.ambientPermitted === true` and `sensitiveContext !== true`; multi-bed bay defaults to push-to-talk. `audio` metadata is `{ retention: 'none', uploaded: false, realAudio: false }` and cannot be changed in Phase 1.
- `translationDraft.js`: keeps originalText, originalLanguage, translatedText, targetLanguage, provider, confidence, reviewStatus. Original is immutable. For contexts consent, clinical-explanation, treatment-discussion, complex-decision: `professionalInterpreterRecommended: true` and a boundary note that machine translation is not equivalent to professional interpreting.
- `providers/contracts.js`: five contracts. SpeechRecognitionProvider capability keys exactly: supportedLocales (array, not boolean), supportsLanguageIdentification, supportsCodeSwitching, supportsDiarisation, supportsCustomVocabulary, supportsCustomModels, supportsStreaming, supportsConfidence. SpeechSynthesisProvider output modes private, headset, device, disabled; content flagged `containsPatientInformation` is refused for `device` mode. AmbientDocumentationProvider, TranslationProvider, ClinicalSpeechLexiconProvider contracts.
- `providers/simulationProviders.js`: scripted simulation providers returning fixed fictional transcripts as SpeechCandidates, including one low-confidence case and one numeric case. Synthesis returns metadata only (no audio). No microphone, no Web Speech API, no MediaRecorder, no network.
- `lexicon/clinicalSpeechLexicon.js`: layers in order general, nhs, trust, specialty, ward, patient-context, clinician-personal; `mergeLexiconLayers(layers)` keeps each term's source layer; later layers can add, never silently delete. Fixtures small and generic (for example "SBAR", "NEWS2", "nasal cannula", fictional ward names). No large vocabulary lists and nothing in UI components.

#### 5.6 src/pointOfCare and events
- `pointOfCareSession.js`: fields sessionId, clinicianId, clinicianRole, patientId, wardId, bedId, deviceId, authenticatedAt, patientBoundAt, lastActivityAt, status. Statuses locked, clinician-authenticated, patient-bound, ended. Functions `authenticateClinician` (method must be 'simulated-badge'; any other method throws "not available in simulation"), `bindPatient` (requires clinician-authenticated and a simulated wristband id that matches a fictional patient in a supplied lookup; mismatch throws and does not bind), `recordActivity`, `evaluateInactivity(session, { now, timeoutMs })` returning locked session with patient binding cleared, `endSession` clearing patient binding. `POINT_OF_CARE_ACTIONS` list (record-observations, dictate-note, start-bedside-session, care-forms, tasks, communication) available only when patient-bound.
- `deviceObservation.js`: `createObservationCandidate({ patientId, code, value, unit, source })` with provenance unconfirmed, reviewStatus review-required; `confirmObservationCandidate` requires human reviewer. No score, no NEWS2, no aggregate field is computed anywhere.
- `providers/contracts.js` + simulation: DeviceObservationProvider returns candidates only; DocumentCaptureProvider returns candidate extractions (review-required) from fictional fixture text only, no OCR library.
- `src/shared/platformEvents.js`: `PLATFORM_EVENT_TYPES` exactly: communication.messageCreated, communication.requestCreated, communication.acknowledged, communication.accepted, communication.completed, voice.captureStarted, voice.captureStopped, voice.transcriptionCreated, voice.draftReviewed, pointOfCare.sessionStarted, pointOfCare.patientBound, pointOfCare.sessionEnded, observation.draftCreated, observation.confirmed, documentation.draftCreated, documentation.approved. `createPlatformEvent({ type, actor, subjectRef, provenance }, { now, createId })`. Event payloads carry references and metadata only, never message bodies or transcript text. Events are UI-independent.

### H. Tests (focused, behavioural, no snapshots)

Minimum coverage, each as a named test:
1. Provenance starts unconfirmed; confirm requires reviewer + time; double confirm throws; objects frozen.
2. Communication event kinds exact list; creating a message whose body says "please escalate urgently" yields kind message and nothing else; there is no exported function that converts message to task/review cue/escalation (assert module export names).
3. Structured request: acknowledged does not equal accepted; completed only via in-progress; human-actor rule; illegal transitions throw; transitions return new objects.
4. AI draft cannot be sent by the simulation provider until human approved; non-safeflow channels rejected.
5. Privacy-safe notification contains no patient name, ids, numbers or free text; unknown keys throw.
6. SpeechProfile rejects nationality/ethnicity/accent-origin/scoring keys.
7. SpeechCandidate: rawText retained after approval with edit; null and low confidence produce the exact safe failure message and cannot be approved; no automatic substitution of alternatives.
8. Numeric safety: "thirteen" and "30" style confusables flagged; numeric content forces confirmation; confirm without unit throws.
9. Voice lifecycle: cannot reach saved without human approval; ambient refused in a multi-bed bay, in sensitive context, or without policy; audio metadata fixed to no retention.
10. Translation keeps original text; interpreter flag for consent context.
11. TTS simulation refuses patient information in device mode.
12. Point-of-care: patient cannot bind before clinician; wrong wristband does not bind; inactivity locks and clears patient; non-simulated auth method throws; actions only when patient-bound.
13. Observation candidates carry unconfirmed device provenance and no score field.
14. Every simulation provider passes `assertImplementsContract` and `assertSimulationProvider`; a provider with `live: true` is refused.
15. Static boundary scan test (`src/shared/foundationBoundary.test.js`): read every non-test source file under src/shared, src/connect, src/voice, src/pointOfCare and assert none contains: fetch(, XMLHttpRequest, WebSocket, getUserMedia, MediaRecorder, SpeechRecognition(, speechSynthesis, localStorage, sessionStorage, console., openai, baileys, whatsapp-web, process.env, Date.now(, Math.random(. Also assert pillar folders do not import each other and src/shared imports no pillar.
16. Platform event factory rejects unknown types and payloads carrying body/text/transcript fields.

### I. CONTROL.md (last commit)

Add rows. Verify the highest existing ID again with a search before writing; if it is still SF-306:
- SF-307 In progress | Architecture | Parent: SafeFlow Connect + Voice + Point of Care foundation (Phase 1 of 10) | branch, commits, test counts.
- SF-308 Done (review pending) | Architecture docs | master spec, hardware profile, FHIR mapping.
- SF-309 Done (review pending) | Connect | communication domain foundation + simulation provider.
- SF-310 Done (review pending) | Voice | speech profile, candidate, numeric safety, lifecycle, translation, lexicon, provider contracts + simulation.
- SF-311 Done (review pending) | Point of Care | session, observation candidates, device/document capture contracts + simulation.
- SF-312 Done (review pending) | Shared | capture provenance, review status, provider contract guard, platform events.
- SF-313 Done (review pending) | Safety tests | foundation boundary tests.
- SF-314 to SF-322 Planned | Phases 2 to 10, one row each, "Not started - requires human approval".
- SF-323 Future discovery | Reconcile capture provenance with SF-305 trust tiers after SF-305 merges.
Put the SF-307 to SF-313 rows in "Started / Open / Ready" and SF-314 to SF-323 in "Backlog". Add one Changelog line. Do not mark any integration as done. Do not edit other rows. Use plain ASCII punctuation in new rows. If the highest ID is no longer SF-306, stop and report instead of renumbering.

## 6. SAFETY CONSTRAINTS (hard)

Simulation only. Fictional data only. No real audio, no microphone access, no uploads, no network calls, no secrets, no .env, no live NHS APIs, no production auth, no WhatsApp or unofficial messaging libraries, no LLM calls, no NEWS2 or any score computed from speech or AI. Human review is the only route to confirmed/approved/saved/sent for clinically meaningful content.

## 7. NON-GOALS (do not do)

No UI components, CSS, routes or App.jsx changes (Phase 2+). No observation parsing from speech (Phase 5). No forms (Phase 6). No new npm dependencies (package.json and package-lock.json must be unchanged). No state-management framework. No changes to existing clinical logic, existing tests (other than appending 3 paths to DOCUMENTATION_FILES), AWS/infra, server/, or the SF-305 branch. No refactors of unrelated code. Do not start Phase 2.

## 8. VERIFICATION

Run in order and report exact output summaries:
1. `npx vitest run src/shared src/connect src/voice src/pointOfCare src/domain/safetyLanguage.test.js`
2. `npm test`
3. `npm run build`
4. `git diff --check` and, after staging, `git diff --cached --check` (diff --check skips untracked files)
5. `git status --short`
If the full suite fails for a reason unrelated to this work (for example infra/Lambda bundling blocked by your sandbox, or worker start failure under load), report the exact failing test file and error. Do not modify tests to hide it.

## 9. GIT

Branch feature/connect-voice-poc-foundation already checked out. Commit in this order, one logical change each, messages exactly:
1. `docs: define SafeFlow Connect Voice and Point of Care architecture` (3 docs + DOCUMENTATION_FILES paths)
2. `feat: add shared capture provenance and platform event foundation`
3. `feat: add communication domain foundation`
4. `feat: add SafeFlow voice provider foundation`
5. `feat: add point of care domain foundation`
6. `test: lock foundation safety boundaries`
7. `docs: update SafeFlow control board`
Tests for a module go in the same commit as the module; commit 6 holds cross-cutting boundary tests. End each commit message body with:
`Co-Authored-By: Codex <noreply@openai.com>`
Do not push. Do not squash. Do not amend earlier commits. Do not commit node_modules, dist, screenshots, logs, local paths or scratch files.

## 10. STOP CONDITION

Stop after commit 7 and verification. Final message must list: commits (hash + subject), files created, files modified, focused test result, full test result, build result, diff-check results, git status, any deviations from this brief with reasons, and open questions. Do not continue to any further work.
