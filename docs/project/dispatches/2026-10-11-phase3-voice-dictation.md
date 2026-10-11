# CODEX TASK: SafeFlow Phase 3 - Voice dictation and speech output (SF-316)

Dispatched by: Claude (orchestrator, reviewer, QA gate). You are the implementer. Oli approved Phase 3 on 11 October 2026. Phases 4 to 10 each still need a separate approval. Do not start Phase 4.

## 0. First action

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md (sections 2, 3, 4, 6, 10, 15, 16, 17 and 19) before making implementation decisions. Then read AGENTS.md, docs/design/SAFeflow-DESIGN.md (sections 2, 5, 8, 9, 10, 11, 14, 17), docs/project/task-plan.md, docs/project/findings.md and docs/implementation/2026-09-21-connect-phase2-codex-handoff.md. Phase 2 is your pattern: read src/connect/connectWorkspace.js, src/components/connect/ and their tests before you design anything. Do not edit docs/project/ or CONTROL.md; Claude owns them.

## 1. OBJECTIVE

Build a simulation-only "Voice dictation" view inside the existing ward workspace that demonstrates, with fixed fictional scripts only, the reviewed transcript workflow and the private speech output controls. It must visibly prove four things: a transcript is a draft and never a record, numbers are confirmed separately by a human, unreliable input fails safe, and spoken output respects privacy modes. It must use the Phase 1 modules in src/voice and src/shared as the only source of rules. No new rules in the UI.

## 2. REPOSITORY FACTS (verified by Claude)

- Working copy: C:\Users\oli\Documents\SafeFlow\worktrees\voice-ui-phase3. Branch: feature/voice-ui-phase3, created by Claude or Oli from codex/safeflow-prototype at 1217a5a or newer before you start. If the folder does not exist, stop and report. Use npm.
- The base already contains Phase 1 (PR #101), Phase 2 Connect UI (PR #103, including its keyboard focus fix), the agent foundation (PR #104) and the simulation access gate (SF-306). Browser tests must call signIn(page) from e2e/shell.js before they navigate.
- Stack: React 19, Vite, plain JS, Vitest + Testing Library (jsdom), Playwright e2e in e2e/ (desktop and mobile Chromium projects), lucide-react icons.
- Routing: `state.selectedView` in src/state/simulationWorkspace.js. Views render in src/App.jsx as `{state.selectedView === 'x' && <XView ... />}`. Navigation groups live in src/components/WorkspaceNav.jsx. Phone bottom tabs in src/components/MobileTabBar.jsx stay unchanged; More already opens the full nav drawer.
- Design system: src/design-system (Badge, SimulationLabel, InformationPanel, EmptyState and more). Tokens in src/styles/tokens.css (`--sf-space-*`, `--sf-target-min` 44px, duration tokens zeroed under reduced motion). Stylesheets are imported from src/styles/index.css.
- Safety wording: src/domain/safetyLanguage.js; rendered-surface scans in src/components/safetyLanguageSurfaces.test.jsx.
- Phase 1 voice API (import from src/voice/index.js and src/shared/index.js):
  - createVoiceCapture({ mode, location, policy, sensitiveContext }, { now, createId }) and transitionVoiceCapture(capture, { to, action, actor, at, approvedCandidate?, confirmedNumericValues? }). VOICE_CAPTURE_TRANSITIONS is the only legal path: idle > listening > processing > transcript > draft-ready > review-required > saved, with cancelled reachable from every non-final state. Listening, saved and cancelled need a human actor.
  - createSimulationSpeechRecognitionProvider({ now }).recognise({ fixture }) with the fixed fixtures `clear`, `uncertain` and `numeric`. It returns a SpeechCandidate (rawText, normalisedText, confidence, reliability, safeFailureMessage, provenance, numericConfirmationRequired).
  - approveSpeechCandidate(candidate, { reviewedBy, reviewedAt, editedText? }), SPEECH_CONFIDENCE_THRESHOLD (0.85), SPEECH_SAFE_FAILURE_MESSAGE, detectNumericContent(text), confirmNumericValue({ label, value, unit, sourceSpan }, { reviewedBy, reviewedAt }).
  - createSimulationSpeechSynthesisProvider().synthesise({ mode, containsPatientInformation }) and SPEECH_OUTPUT_MODES (private, headset, device, disabled). It returns metadata only and refuses patient information in device mode.
  - createPlatformEvent with the registered types voice.captureStarted (human actor), voice.transcriptionCreated, voice.draftReviewed (human actor) and voice.captureStopped; createCaptureProvenance.
- Fictional people for the demo: reuse src/connect/demoFixtures.js names (currentUser, staffNames) by import only. Do not change that file.

## 3. TARGET LAYOUT

```
src/voice/voiceWorkspace.js              pure reducer for the view: state + actions -> next state, built only on Phase 1 functions; co-located test
src/voice/voiceDemoFixtures.js           small fictional constants for the view (script labels, reviewer, output samples); co-located test
src/components/voice/VoiceView.jsx       screen shell
src/components/voice/CaptureControls.jsx
src/components/voice/TranscriptReview.jsx
src/components/voice/NumericConfirmation.jsx
src/components/voice/SpeechOutputPanel.jsx
src/components/voice/VoiceView.test.jsx  (plus focused tests per component where useful)
src/components/voice/voiceUiBoundary.test.js
src/styles/voice.css                     imported from src/styles/index.css
e2e/voice.spec.js
```

Minimal wiring only: add `{ id: 'voice', label: 'Voice dictation', icon: Mic }` to the Coordination group in WorkspaceNav.jsx, render VoiceView in App.jsx for `selectedView === 'voice'`, import voice.css. Do not change other views, reducers, persistence or the phone tabs.

## 4. REQUIRED BEHAVIOUR

State
- The view owns its state with `useReducer(voiceReducer, initialState)`. voiceWorkspace.js is a pure module in src/voice and obeys the Phase 1 pillar rules (no pillar-to-pillar imports, no Date.now, Math.random, console, storage or network). The component supplies injected `now` and `createId` (monotonic counter, fixed simulated clock advancing one minute per action).
- In-memory only. Reset on reload. A "Simulation activity" list shows platform events (type, actor, subject ref, time). Events carry references only, never transcript text.
- The reducer catches only FoundationValidationError and returns the previous state plus an "Action refused: ..." announcement. Validate argument types before calling string methods, so a non-string or empty edit is refused with an announcement and never throws a TypeError. Other exceptions propagate.

Boundary copy
- Top of the view: SimulationLabel and the text "Simulation only. No microphone is used and no audio is recorded, stored or sent. Dictation uses fixed fictional scripts. Human review required."
- Push-to-talk only in this phase. Say in words that ambient capture is not available. Do not offer an ambient mode.

Capture
- Context fields required by createVoiceCapture: location type (single room, multi-bed bay, other) and a sensitive context checkbox, both with visible labels. Mode is fixed to push-to-talk.
- Script picker with three fixed options mapped to the provider fixtures: "Clear dictation", "Unclear dictation", "Dictation with a number". Say that these are fixed fictional scripts.
- "Start listening (simulation)" is an explicit human action. While listening, a persistent status line reads "Simulated listening. No microphone is in use." State is shown in words, never by colour alone.
- "Stop listening" moves the capture to processing. The remaining system steps (processing, transcript, draft-ready, review-required) may advance in one reducer action, but every step must go through transitionVoiceCapture and appear in a visible "State trail" list. No state may be skipped.
- "Cancel" is available from every non-final state and clears any candidate, announces "Dictation cancelled. Nothing saved." and records voice.captureStopped.

Transcript review
- Show the raw text read-only (it is immutable) and the confidence in words (for example "Confidence 96 percent. Reviewable." or "Confidence 40 percent. Not reliable enough to approve.").
- "Your edit" is a separate text area stored as editedText. The raw text stays visible and unchanged after an edit.
- Unreliable input shows the exact SPEECH_SAFE_FAILURE_MESSAGE. "Approve and save" stays disabled and says why. Offer "Repeat dictation" (cancel and start a fresh capture). Do not substitute or guess text.
- Numeric content: show a "Numbers need separate confirmation" panel that lists what detectNumericContent found (including teen/ty confusables such as thirteen and thirty, and missing units) and states "Transcript review does not confirm numbers". For each value the reviewer enters label, value, unit and source span, then presses "Confirm value", which calls confirmNumericValue. Approve and save stays disabled until Phase 1 rules are met (at least one confirmed value with a unit when confirmation is required). Do not parse the transcript into observations, scores or early-warning values.
- "Approve and save review (simulation)" calls approveSpeechCandidate and then transitionVoiceCapture to saved, with the fictional reviewer as the human actor. Records voice.draftReviewed.
- After saving, show only metadata: "Saved. Reviewed by <name> at <time>. <n> confirmed numbers. Transcript text is not stored." The reducer must drop the candidate and any text from state at that point. Only savedCandidateRef and confirmedNumericValueCount remain.
- After saved or cancelled, "Start new dictation" returns to idle.

Speech output (simulation)
- A "Speech output (simulation)" panel with output mode (Private, Headset, Device speaker, Disabled) and a content choice ("General message, no patient information" or "Message with patient information"), plus a fixed fictional sample line shown as text.
- "Preview speech output" calls the simulation synthesis provider. The provider, not the UI, makes the refusal: device mode with patient information must come back as "Action refused: ..." in the live region. The UI may show a plain-words hint but must still call the provider.
- Result is metadata in words: "No audio is produced. Mode: private. Simulation only." and "Speech output is disabled" for the disabled mode. State that there is no confidential open-speaker announcement.
- No use of speechSynthesis, SpeechSynthesisUtterance, Audio, audio elements or any sound. Metadata only.

Accessibility (WCAG 2.2 AA)
- Landmarks and headings: section with aria-labelledby; one polite aria-live region for all status changes ("Listening started", "Transcript ready for review", "Action refused: ...").
- Every control has a visible label. Targets at least 44px (use --sf-target-min). Visible focus using the existing focus tokens. No state by colour alone. Respect reduced motion.
- Focus order (WCAG 2.4.3). This is new in Phase 3 because it was the main finding in the Phase 2 review. Any action that disables or unmounts the control the user just used must hand focus to the next sensible element, never to the top of the page. Required targets: after Start, the Stop listening button; after Stop, the "Transcript review" heading (tabIndex -1); after Confirm value, the next unconfirmed field, or the Approve button when none is left; after Approve or Cancel, the "Start new dictation" button; after a refused speech preview, the output mode control. Move focus only when it was lost (document.body) or is still inside the view, so focus is never taken from somewhere else. Use the pattern from the merged fixes in src/components/connect/StructuredRequestCard.jsx and src/components/AgentReviewPanel.jsx.
- Reflow: no horizontal scroll at 320px. Layout works at 860px and below with controls stacked.
- Keyboard: the whole flow works by keyboard alone.

Privacy and security
- No console calls, storage, network, Notification API, service worker, clipboard or dangerouslySetInnerHTML. Transcript text is rendered as text only.
- No real microphone or audio of any kind. Never reference getUserMedia, mediaDevices, MediaRecorder, AudioContext, webkitAudioContext, SpeechRecognition, webkitSpeechRecognition, speechSynthesis, SpeechSynthesisUtterance, new Audio( or audio or video elements.

## 5. TESTS

Vitest + Testing Library (behavioural, no snapshots):
1. voiceWorkspace reducer: the full happy path follows VOICE_CAPTURE_TRANSITIONS; illegal moves are refused with state unchanged; the state trail lists every step.
2. Unreliable dictation ("uncertain"): exact safe failure message, approval refused by the reducer, saved never reached, "Repeat dictation" works.
3. Numeric dictation ("numeric"): cannot save without a confirmed value with a unit; transcript approval alone does not satisfy it; confusables and missing units are listed.
4. Saved state: contains only savedCandidateRef and confirmedNumericValueCount. JSON.stringify of the whole state after saving contains none of the script strings.
5. Edit is stored separately: rawText is unchanged after an edit; empty and non-string edits are refused with an announcement and no exception.
6. Cancel from each non-final state clears the candidate and records voice.captureStopped.
7. Speech output: device mode with patient information is refused by the provider; disabled mode reports disabled; every result shows audioProduced false; no audio.
8. Platform events: voice.captureStarted and voice.draftReviewed use a human actor; no event holds text.
9. VoiceView: boundary copy present, keyboard-operable main flow with userEvent, aria-live messages, "Simulated listening. No microphone is in use." while listening, and focus assertions (`toHaveFocus`) after every step listed under Focus order. Include a guard test showing focus is not taken when it is elsewhere.
10. Safety-language surface scans: append Voice cases to src/components/safetyLanguageSurfaces.test.jsx that scan rendered text after interaction, not only the initial render: initial, transcript shown, unreliable failure, numeric confirmation, saved, and speech refusal. Append only; do not weaken any existing case.
11. voiceUiBoundary.test.js: scan src/components/voice/*.jsx, src/voice/voiceWorkspace.js and src/voice/voiceDemoFixtures.js for: fetch(, XMLHttpRequest, WebSocket, localStorage, sessionStorage, console., Notification, serviceWorker, navigator.clipboard, dangerouslySetInnerHTML, Date.now(, Math.random(, getUserMedia, mediaDevices, MediaRecorder, AudioContext, webkitAudioContext, SpeechRecognition, webkitSpeechRecognition, speechSynthesis, SpeechSynthesisUtterance, new Audio(, <audio, <video.
12. Existing tests still pass. Add Voice dictation as an additive entry to the destinations list in src/App.test.jsx (the "opens %s as a distinct workspace" cases) and to the destinations list in e2e/safeflow.spec.js, mapping the nav label to the view heading. Do not remove or weaken any existing entry.

Playwright e2e/voice.spec.js (both projects, starting with signIn(page)): open Voice dictation from the nav (on mobile via More), run the clear dictation to saved and see the metadata-only result, run the unclear dictation and see the exact failure message with Approve disabled, run the number dictation and confirm a value before saving, preview device output with patient information and see the refusal, assert focus with toBeFocused at the steps under Focus order, and check no horizontal scroll at the mobile width.

## 6. SAFETY CONSTRAINTS (hard)

Simulation only. Fictional data only. No real audio, no microphone, no live providers, no network, no persistence of any text. A transcript is a draft until a named human approves it. Numbers are never confirmed by transcript review, and are never turned into observations or scores. Unreliable input is never replaced by plausible text. Nothing in Voice creates a task, review cue or escalation. Use AGENTS.md preferred language; avoid banned terms outside boundary context.

## 7. NON-GOALS

No dictation into the Connect composer or any other view (Phases 5 and 6). No bedside session (Phase 4). No observations (Phase 5). No forms (Phase 6). No ambient mode, translation, interpreter flags, accent features or speech profile editing (Phase 7). No AI beyond the fixed provider fixtures (Phase 8). No adapters (Phase 9). No changes to Phase 1 domain rules unless a genuine defect blocks the UI; if so, stop and report instead of changing them. No new npm dependencies. No changes to server/, infra/, database/, src/agent/ or src/connect/. No global CSS refactors; voice.css only plus one import line.

## 8. VERIFICATION (run and report)

Your sandbox cannot load the default vitest config or write .git. Use:
1. `npx vitest run --configLoader native src/voice src/components/voice src/components/safetyLanguageSurfaces.test.jsx src/shared`
2. `npx vitest run --configLoader native` (full; report any failures exactly, infra bundling failures are expected in your sandbox)
3. `npx vite build --configLoader native` if the default build fails in the sandbox
4. `git diff --check` and `git status --short`

Do not run Playwright if it cannot launch in your sandbox; say so. Claude will run npm test, build, audit and e2e outside the sandbox. If you do run Playwright, check which checkout owns port 5173 first; Phase 2 hit a stale server from another checkout. Keep any temporary config outside the repository.

## 9. GIT

Do not stage or commit (your sandbox blocks .git). Claude will commit after review using these messages:
1. feat: add Voice demo fixtures and workspace reducer
2. feat: add SafeFlow Voice dictation and speech output view
3. test: cover Voice UI boundaries and e2e flow
Keep files aligned to that split. No junk files, screenshots, logs or local paths.

## 10. STOP CONDITION

Stop when the behaviour, tests and verification above are done. Write docs/implementation/2026-10-11-voice-phase3-codex-handoff.md in the same format as the Phase 2 handoff. Final message: files created, files modified, focused and full test results, build result, diff-check, git status, deviations with reasons, open questions. Do not start Phase 4.
