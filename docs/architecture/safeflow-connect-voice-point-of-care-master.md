# SafeFlow Connect, Voice and Point of Care

Status: **Phase 1 foundation - simulation only**. Canonical architecture for the Phase 1 dispatch dated 20 September 2026. Subsequent phases require separate human approval.

## 1. Purpose and product principle

SafeFlow is a point-of-care workflow and intelligence layer. It is not a messaging app, standalone AI scribe, observations app, EPR clone or dashboard. The human makes the clinical decision. Existing structured review support remains central; communication and capture support the same workflow.

## 2. Product boundary

Simulation-only prototype; fictional patient data only; no real patient data. Human review required. Not clinically validated; no live NHS system; not for live clinical deployment. No NHS logo or implied endorsement. No diagnosis, no prescribing, no treatment recommendation.

Never permitted:

- Autonomous diagnosis, autonomous prescribing or autonomous treatment recommendation.
- Autonomous escalation or autonomous documentation sign-off.
- Silent submission of generated clinical information.
- LLM-calculated NEWS2 or other validated scores.
- AI sending clinically meaningful communication without human review.

Future AI may transcribe, draft, structure, summarise, translate drafts, organise, identify candidate tasks, surface information for review and prepare communication drafts. Phase 1 implements no AI calls. Candidates never become records or tasks implicitly.

## 3. Four pillars, one workflow

| Pillar | Responsibility | Integration boundary |
|---|---|---|
| Clinical | Existing review cues, tasks, handover, Patient Journey Twin and audit | Existing clinical logic remains unchanged |
| Connect | Threads, role recipients, messages and structured requests | References existing tasks; does not create them |
| Voice | Capture candidates, review, translation drafts and output contracts | Supplies editable drafts only |
| Point of Care | Clinician/patient binding and observation candidates | Human confirms patient and content |

Together: bind a fictional bedside context, capture information, review it, then explicitly choose a communication or documentation action. Phase 1 has no application wiring. Pillars depend only on shared foundation modules and their own modules, never on another pillar.

## 4. Fundamental domain rule

MESSAGE != TASK != REVIEW CUE != ESCALATION.

A message conveys text. A task is a separately owned work item. A review cue is an explainable safety cue for structured human review. Escalation is a human-led pathway governed by local policy. None silently transforms into another. A task-link event references an existing task ID only. Message body wording never changes its kind, priority or side effects. A structured request records explicit lifecycle actions; acknowledging receipt does not accept responsibility.

## 5. Connect

Capabilities: person/role addressing, scoped threads, messages, structured requests, acknowledgement, delivery/read metadata and references to existing tasks. The hierarchy is Person > Role > Team > Ward/service > Organisation > Current assignment/availability. Role resolution requires an exact current fictional assignment, including team, ward and organisation. Missing or ambiguous assignments remain unresolved; never guess a person.

Domain objects are RoleRecipient, CommunicationThread, CommunicationEvent, StructuredRequest and PrivacySafeNotification. Thread scopes: direct, team, mdt, patient, ward-service. Patient scope requires a fictional patient reference. Participants are explicit person or role recipients.

Event kinds: message, structured-request, acknowledgement, task-link, system-event. Authors: human, system, ai-draft. AI drafts begin draft/review-required and require identified human approval before simulated sending. The approver id must differ from the AI draft author id. System authors are restricted to system-event metadata; they cannot author clinically meaningful messages.

Request types: review-request, discharge-query, therapy-referral-request, medicines-query, information-request. Lifecycle: sent > delivered > read > acknowledged > accepted > in-progress > completed. Declined is available from read/acknowledged; cancellation is available from every non-terminal state. Acknowledged, accepted, in-progress, completed, declined and cancelled require a human actor. Only delivered and read may be system-recorded. Completed requires in-progress. Terminal states have no outgoing transition. No transition creates a task, cue or escalation.

Future channels: safeflow, teams, nhs-notify, email, sms, push, whatsapp, voice. Only safeflow is enabled in simulation; all others throw. Future research providers: Microsoft Teams/Graph, NHS Notify/NHS App, NHSmail, AWS End User Messaging, SMS, Amazon Connect, Twilio and official WhatsApp Business API. None is connected. Baileys, WA-AKG and unofficial WhatsApp Web automation are prohibited.

The communication contract exposes sendEvent, listThreadEvents and recordDeliveryState, with supportsDeliveryReceipts, supportsReadReceipts, supportsAttachments and supportsExternalChannels flags. Simulation stores are per instance, in memory, with no body logging.

## 6. Voice

Dictation states: idle > Listening > Processing > Transcript > Draft ready > Review required > Saved, with explicit cancellation. Listening requires a human start action. Saved requires explicit human approval from review-required and an approved, reliable (reviewable), human-confirmed speech candidate reviewed by the approving clinician. When numeric confirmation is required, a non-empty array of separately confirmed numeric values with non-empty units is also required. Captures store only savedCandidateRef (reviewedBy and reviewedAt) and confirmedNumericValueCount, never transcript text. This lifecycle records workflow metadata, never confirms numeric values on its own.

Ambient documentation requires explicit start and visible recording state; never background listening. Push-to-talk is the default in multi-bed bays. Ambient is permitted only in a single room with explicit policy permission and no sensitive context. No real audio exists in this prototype: metadata is fixed to retention none, uploaded false, realAudio false. Future governed lifecycle: temporary encrypted audio > transcription > draft > review > approved > deletion per policy; no silent upload.

Accent is pronunciation variation, dialect includes vocabulary/grammar, and code-switching alternates languages or varieties. SafeFlow never infers nationality, ethnicity or origin from voice and never ranks clinicians. SpeechProfile contains userId, preferredLocale, preferredProvider, microphoneProfile, personalLexicon, recognitionCorrections and preferredOutputLanguage only. Unknown keys, origin attributes and clinician-scoring fields are rejected by name.

Lexicon layers, in order: general, nhs, trust, specialty, ward, patient-context, clinician-personal. Later layers add entries without deleting earlier entries; each entry preserves its source layer. Small generic fixtures only, outside UI components.

SpeechRecognitionProvider capabilities are supportedLocales (array), supportsLanguageIdentification, supportsCodeSwitching, supportsDiarisation, supportsCustomVocabulary, supportsCustomModels, supportsStreaming and supportsConfidence. Additional contracts: SpeechSynthesisProvider, AmbientDocumentationProvider, TranslationProvider, ClinicalSpeechLexiconProvider. All providers must pass the simulation guard (mode simulation, live false). Provider identity strings in capture records are metadata, not executable providers.

SpeechCandidate retains rawText, normalisedText, alternatives, provider, locale, capturedAt and confidence. Confidence must be null or 0-1. Below 0.85 or null is unreliable and cannot be approved. Exact safe failure message: "SafeFlow could not reliably understand this input. Please repeat or enter it manually." No alternative or plausible text is substituted automatically. Human edits are stored separately; original text is immutable.

Numeric content detection flags digits, English number words, teen/ty confusables (13/30 through 19/90), decimals, negatives and missing units. Numeric candidates always retain numericConfirmationRequired true; transcript review alone does not confirm numbers. confirmNumericValue requires label, finite value, unit, sourceSpan, reviewer and review time. It produces a separate confirmed value, never an observation parser or score.

Translation preserves original text and language alongside the draft translation, target language, provider and confidence. Machine translation is not equivalent to professional interpreting. Consent, clinical-explanation, treatment-discussion and complex-decision contexts flag professional interpreting; the boundary includes no autonomous diagnosis discussion or treatment advice. TTS modes are private, headset, device and disabled; patient information is refused for device mode. No confidential open-speaker announcement. Simulation synthesis returns metadata only.

Future research options only, no endorsement or integration: Dragon Medical One, Dragon Copilot, TORTUS, Heidi, Augnito, T-Pro, G2 Speech, Azure Speech, Amazon Transcribe, Amazon Polly, Google Speech/Chirp and approved local models.

## 7. Point of Care

Simulated badge tap > simulated wristband scan > patient binding > action menu > end/lock. Actions only when patient-bound: Record observations, Dictate note, Start bedside session, Care/forms, Tasks, Communication. A wrong or ambiguous wristband cannot bind. Supplied lookups contain explicitly fictional patients only.

PointOfCareSession fields: sessionId, clinicianId, clinicianRole, patientId, wardId, bedId, deviceId, authenticatedAt, patientBoundAt, lastActivityAt, status. Statuses: locked, clinician-authenticated, patient-bound, ended. Inactivity locks and clears patient binding; ending clears binding. Only simulated-badge authentication is accepted. Future CIS2, Entra, Trust SSO, Imprivata and NFC-reader seams are not implemented.

## 8. Observations

Device > DeviceObservationProvider > structured candidate > human confirmation > SafeFlow > future FHIR. Candidates contain patientId, code, value, unit and source, with unconfirmed capture provenance and review-required status. No score or aggregate is computed.

Future voice example, fictional only: "RR 24 /min, SpO2 93 %, oxygen 2 L/min nasal cannula" becomes separately reviewable candidates with Confirm / Edit / Cancel. No automatic save, no LLM NEWS2, no parsing implementation in Phase 1. Confirming a transcript is not confirmation of an observation or number.

## 9. Nursing forms framework

Future forms retain source references, editable entries, review status and explicit human sign-off. Initial later targets: basic nursing note, mobility entry and fluid balance. No forms are implemented in Phase 1.

## 10. Capture provenance and domain values

Sources: manual, voice, device, ambient-draft, imported, scanned-document, simulation-fixture. createCaptureProvenance returns type, provider, capturedAt, humanConfirmed false, reviewedBy null, reviewedAt null and simulationOnly true. Creation cannot assert confirmation. confirmCaptureProvenance requires reviewer and ISO time, returns a new frozen object and rejects double confirmation.

Factories validate input using a named error subclass, copy and deeply freeze plain data, and mark records simulationOnly true. Clock and ID generation are injected as { now, createId } where needed; callers supply timestamps otherwise. No ambient clock/randomness. Review statuses: draft, review-required, approved, rejected. Provider contracts validate method presence and capability types; live providers fail closed.

## 11. Interoperability

See [FHIR observation mapping](fhir-observation-mapping.md). Proposed FHIR R4/UK Core resource relationships only; no exporter or live NHS APIs. Only human-confirmed observations could ever become final Observation resources. Unconfirmed candidates are never exported. Terminology and profiles require future UK Core verification.

## 12. Paper to digital

DocumentCaptureProvider returns review-required candidate extractions from fictional fixture text. No OCR library, camera access or uploads. Future paper capture must preserve source and uncertainty, with human confirmation before any record is accepted.

## 13. Future AI communication assistant

AI draft > human review > human action. No autonomous sending, task creation or documentation sign-off. Phase 1 models only the review boundary; there is no model connection.

## 14. Privacy-safe notifications

Notifications accept a category only and reject unknown keys. Fixed generic text such as "SafeFlow - new review request" contains no patient names, IDs, numbers, message excerpts or clinical details. Notification content is never constructed from free text.

## 15. Platform events

Events are UI-independent immutable records with injected ID/time, type, actor reference, subject reference and capture provenance. Strict schemas exclude body, text and transcript payloads, including nested fields. Allowed types:

- communication.messageCreated, communication.requestCreated, communication.acknowledged, communication.accepted, communication.completed
- voice.captureStarted, voice.captureStopped, voice.transcriptionCreated, voice.draftReviewed
- pointOfCare.sessionStarted, pointOfCare.patientBound, pointOfCare.sessionEnded
- observation.draftCreated, observation.confirmed
- documentation.draftCreated, documentation.approved

Human actors are required for communication.acknowledged, communication.accepted, communication.completed, voice.captureStarted, voice.draftReviewed, pointOfCare.sessionStarted, pointOfCare.patientBound, observation.confirmed and documentation.approved. Additionally, observation.confirmed and documentation.approved require human-confirmed provenance whose reviewedBy equals the event actor id.

These are metadata envelopes, not an event bus or an automatic clinical-action mechanism. Existing workflowEvents/createAuditEvent is unchanged.

## 16. Accessibility direction

WCAG 2.2 AA direction, not a conformity claim. Voice is supplementary; manual controls always available. Recording state uses words/icons as well as colour. Keyboard support, approximately 44px targets, reduced motion and optional TTS are future UI acceptance criteria. No UI is delivered here.

## 17. Speech safety evaluation

Future evaluation covers quiet/noisy rooms, multi-speaker overlap, microphone variation, accents, dialects, code-switching, negation, decimals, units and teen/ty confusables. Measure WER plus clinical-term, medication-name, numeric, negation and unit error rates; record refusals and correction burden. Evaluate the engine, never rank clinicians. Scripted fixtures are behavioural tests, not accuracy evidence.

## 18. Future governance gates

Future work must address DCB0129, DCB0160, DTAC, DPIA, clinical safety case, hazard log, cyber assurance, AVT governance, MHRA device assessment where applicable, interoperability, accessibility and human factors. None is claimed now. This is an internal planning checklist, not regulatory or deployment assurance.

## 19. Implementation programme

For every row: **no phase starts without human approval**. The current dispatch authorises Phase 1 only.

| Phase | Scope | Exit criteria |
|---|---|---|
| 1 | Architecture/domain/provider foundations | Three docs, immutable domain records, simulation contracts/providers, safety tests, verification and review |
| 2 | Connect simulation UI | Explicit communication/request actions demonstrated accessibly with fictional fixtures |
| 3 | Voice dictation + TTS | Reviewed transcript workflow and private output controls demonstrated |
| 4 | Point-of-Care bedside session | Visible binding, lock/end and action gating demonstrated |
| 5 | Voice/device observation capture | Separate numeric and observation confirmation, edit/cancel tested |
| 6 | Nursing forms/documentation | Reviewable forms with explicit human sign-off tested |
| 7 | Accent/multilingual/speech safety | Engine evaluation and interpreter boundaries reviewed |
| 8 | AI-assisted communication/documentation | Draft-only assistance and human-action gates verified |
| 9 | External adapter simulations | Adapter contracts tested without live connections |
| 10 | Hardening/evaluation/governance | Evaluation evidence and applicable governance gaps reviewed; no implied live approval |

## 20. Relationship to SF-305

SF-305 trust tiers (source fact, deterministic derivation, AI interpretation, human decision) describe how a fact was derived. Capture provenance describes how an item was captured. They are different dimensions. Reconciliation is deferred until SF-305 merges; no imports from or changes to its separate branch. Exports are createCaptureProvenance/confirmCaptureProvenance to avoid its createProvenance name.

## 21. Phase 1 code map

Each source module has a co-located behavioural test; index tests verify the public surface. Cross-cutting foundationBoundary.test.js enforces section 2 and section 3 isolation. Paths below are relative to src/.

| Module | Spec sections |
|---|---|
| shared/domainValues.js | 10 |
| shared/provenance.js | 10 |
| shared/reviewStatus.js | 10 |
| shared/providerContract.js | 6, 10 |
| shared/platformEvents.js | 15 |
| shared/index.js | 10, 15 |
| connect/roleRecipient.js | 5 |
| connect/communicationThread.js | 5 |
| connect/communicationEvent.js | 4, 5, 13 |
| connect/structuredRequest.js | 4, 5 |
| connect/notificationPayload.js | 14 |
| connect/communicationProvider.js | 5 |
| connect/simulationCommunicationProvider.js | 5, 13 |
| connect/fixtures.js | 5 |
| connect/index.js | 5 |
| voice/speechProfile.js | 6 |
| voice/speechCandidate.js | 6, 10 |
| voice/numericSpeechSafety.js | 6 |
| voice/voiceCaptureLifecycle.js | 6 |
| voice/translationDraft.js | 6 |
| voice/providers/contracts.js | 6 |
| voice/providers/simulationProviders.js | 6 |
| voice/lexicon/clinicalSpeechLexicon.js | 6 |
| voice/lexicon/fixtures.js | 6 |
| voice/index.js | 6 |
| pointOfCare/pointOfCareSession.js | 7 |
| pointOfCare/deviceObservation.js | 8, 10 |
| pointOfCare/providers/contracts.js | 8, 12 |
| pointOfCare/providers/simulationProviders.js | 8, 12 |
| pointOfCare/index.js | 7, 8, 12 |

Hardware direction is documented separately in [Point-of-care hardware profile](point-of-care-hardware-profile.md). Browser simulation needs no hardware.
