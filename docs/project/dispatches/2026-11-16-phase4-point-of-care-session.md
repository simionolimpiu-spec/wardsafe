# CODEX TASK: SafeFlow Phase 4 - Point of Care bedside session (SF-317)

Dispatched by: Claude (orchestrator, reviewer, QA gate). You are the implementer. Oli approved Phase 4 on 16 November 2026. Phases 5 to 10 each still need a separate approval. Do not start Phase 5.

## 0. First action

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md (sections 2, 3, 4, 7, 10, 15, 16 and 19) before making implementation decisions. Then read AGENTS.md, docs/design/SAFeflow-DESIGN.md (sections 2, 5, 8, 9, 10, 11, 12, 14, 17 and 18), docs/project/task-plan.md, docs/project/findings.md and docs/implementation/2026-10-11-voice-phase3-codex-handoff.md. Phase 3 is your pattern: read src/voice/voiceWorkspace.js, src/components/voice/ and their tests before you design anything. Do not edit docs/project/ or CONTROL.md; Claude owns them.

## 1. OBJECTIVE

Build a simulation-only "Point of care" view inside the existing ward workspace that demonstrates, with fixed fictional badges and wristbands only, the bedside session: simulated badge tap, simulated wristband scan, patient binding, the action menu, and lock or end. It must visibly prove four things: the patient binding is always shown in words, a wrong or ambiguous wristband cannot bind, actions exist only while a patient is bound, and inactivity or ending clears the clinician and the binding. It must use the Phase 1 modules in src/pointOfCare and src/shared as the only source of rules. No new rules in the UI.

## 2. REPOSITORY FACTS (verified by Claude on 16 November 2026)

- Working copy: C:\Users\oli\Documents\SafeFlow\worktrees\point-of-care-phase4. Branch: feature/point-of-care-phase4, created by Claude from codex/safeflow-prototype after the SF-326 house style merge (PR #110, merge 9c773b3) or newer. If the folder does not exist, stop and report. Use npm.
- The base already contains Phase 1 (PR #101), Phase 2 Connect UI (PR #103), the agent foundation (PR #104), Phase 3 Voice (PR #108), the simulation access gate (SF-306) and the house style (SF-326, PR #110). Browser tests must call signIn(page) from e2e/shell.js before they navigate.
- Stack: React 19, Vite, plain JS, Vitest + Testing Library (jsdom), Playwright e2e in e2e/ (desktop and mobile Chromium projects), lucide-react icons.
- Routing: `state.selectedView` in src/state/simulationWorkspace.js. Views render in src/App.jsx as `{state.selectedView === 'x' && <XView ... />}`. Navigation groups live in src/components/WorkspaceNav.jsx. Phone bottom tabs in src/components/MobileTabBar.jsx stay unchanged; More already opens the full nav drawer.
- Design system: src/design-system (Badge, SimulationLabel, InformationPanel, EmptyState and more). Tokens in src/styles/tokens.css. Stylesheets are imported from src/styles/index.css.
- House style (DESIGN.md section 18) applies to every new surface: flat bordered panels with no shadows or gradients, ink headings, blue for interactive elements only, sentence-case labels, square chips, one primary and one secondary button style, tokens only. src/styles/house-style.css is in the raw-colour guard, so no hard-coded colours. No nested bordered boxes; use one panel with ruled sections. No long dashes in interface copy.
- Safety wording: src/domain/safetyLanguage.js; rendered-surface scans in src/components/safetyLanguageSurfaces.test.jsx.
- Phase 1 point of care API (import from src/pointOfCare/index.js and src/shared/index.js):
  - createPointOfCareSession({ deviceId }, { now, createId }) returns a locked session.
  - authenticateClinician(session, { method, clinicianId, clinicianRole, at }). Only method 'simulated-badge' is accepted and only from locked.
  - bindPatient(session, { patientId, simulatedWristbandId, patients, at }). Needs clinician-authenticated. Exactly one patient in the supplied lookup may carry the wristband, its id must equal patientId and it must have fictional true, wardId and bedId. Anything else throws 'Wristband mismatch or ambiguous fictional patient'.
  - recordActivity(session, { at }), evaluateInactivity(session, { now, timeoutMs }) which locks and clears clinician and binding once the timeout has passed, and endSession(session, { at }) which clears both and sets ended.
  - availablePointOfCareActions(session) returns POINT_OF_CARE_ACTIONS (record-observations, dictate-note, start-bedside-session, care-forms, tasks, communication) only when the session is patient-bound, otherwise an empty list. POINT_OF_CARE_STATUSES is locked, clinician-authenticated, patient-bound, ended.
  - createPlatformEvent with the registered types pointOfCare.sessionStarted (human actor), pointOfCare.patientBound (human actor) and pointOfCare.sessionEnded; createCaptureProvenance.
  - There is no platform event type for an inactivity lock. Do not invent one and do not change the registered list. Show the lock in the state trail only and raise it as an open question in your handoff.
- Fictional people for the demo: reuse src/connect/demoFixtures.js names (currentUser, staffNames) by import only. Do not change that file.

## 3. TARGET LAYOUT

```
src/pointOfCare/pointOfCareWorkspace.js        pure reducer for the view: state + actions -> next state, built only on Phase 1 functions; co-located test
src/pointOfCare/pointOfCareDemoFixtures.js     fictional constants: device, badges, wristbands, patient lookup; co-located test
src/components/pointOfCare/PointOfCareView.jsx screen shell
src/components/pointOfCare/SessionStatusBar.jsx
src/components/pointOfCare/BadgeStep.jsx
src/components/pointOfCare/WristbandStep.jsx
src/components/pointOfCare/ActionMenu.jsx
src/components/pointOfCare/PointOfCareView.test.jsx  (plus focused tests per component where useful)
src/components/pointOfCare/pointOfCareUiBoundary.test.js
src/styles/point-of-care.css                   imported from src/styles/index.css
e2e/point-of-care.spec.js
```

Minimal wiring only: add `{ id: 'point-of-care', label: 'Point of care', icon: ScanLine }` to the ward Coordination group in WorkspaceNav.jsx directly after Voice dictation, render PointOfCareView in App.jsx for `selectedView === 'point-of-care'`, import point-of-care.css. Do not change other views, reducers, persistence or the phone tabs.

## 4. REQUIRED BEHAVIOUR

State
- The view owns its state with `useReducer(pointOfCareReducer, initialState)`. pointOfCareWorkspace.js is a pure module in src/pointOfCare and obeys the Phase 1 pillar rules (no pillar-to-pillar imports, no Date.now, Math.random, console, storage, timers or network). The component supplies injected `now` and `createId` (monotonic counter, fixed simulated clock advancing one minute per action).
- In-memory only. Reset on reload. A "Simulation activity" list shows platform events (type, actor, subject ref, time). Events carry references only.
- The reducer catches only FoundationValidationError and returns the previous state plus an "Action refused: ..." announcement. Validate argument types before use so bad input is refused with an announcement and never throws a TypeError. Other exceptions propagate.
- Every status change goes through the Phase 1 functions and appears in a visible "State trail" list in words. No status may be set directly.

Boundary copy
- Top of the view: SimulationLabel and the text "Simulation only. No badge reader, scanner, camera or device is used. Badges, wristbands and patients are fixed and fictional. Human review required."
- Say in words that sign-in here is a simulated badge only and that no hospital sign-in system is connected.

Session status bar (always visible while the view is open)
- Shows the session status in words (Locked, Clinician signed in, Patient bound, Ended), the fictional clinician name and role when signed in, and the bound patient in words when bound: fictional name, ward and bed, with the label "Fictional patient". Follow DESIGN.md section 12 for patient-context hierarchy.
- When no patient is bound it reads "No patient bound". State is never shown by colour alone.

Badge step
- A picker of fixed fictional badges (at least two staff from the fixtures) and a "Tap badge (simulation)" button. This is an explicit human action that calls authenticateClinician with method 'simulated-badge' and records pointOfCare.sessionStarted with the clinician as the human actor.
- The reducer must also prove the fail-closed rule: an action carrying any other method is refused by Phase 1 and announced as "Action refused: ...". Cover this in the reducer test. Do not offer other methods in the UI. Say in words that other sign-in methods are not available in simulation.

Wristband step (only when the clinician is signed in)
- Two visible choices: the expected patient (a picker of fictional patients from the fixture lookup) and the wristband to scan (a picker of fixed fictional wristbands). "Scan wristband (simulation)" calls bindPatient.
- The fixtures must include: at least three fictional patients each with fictional true, wardId, bedId and a unique simulatedWristbandId; one wristband that belongs to a different patient than the one usually chosen (mismatch case); and one wristband id carried by two fixture entries (ambiguous case); and one wristband id that matches nobody.
- Phase 1, not the UI, makes the refusal. A mismatch, an ambiguous wristband or an unknown wristband comes back as "Action refused: ..." in the live region, the status stays Clinician signed in, and the status bar still reads "No patient bound". Do not guess, suggest or auto-correct a patient.
- A successful scan binds the patient, records pointOfCare.patientBound with the clinician as the human actor, and the status bar shows the bound patient.

Action menu
- Rendered from availablePointOfCareActions(session) only. Before a patient is bound, show the heading and the sentence "Actions are available only when a patient is bound." with no action buttons in the DOM, not disabled buttons.
- When bound, show the six actions with these labels: Record observations, Dictate note, Start bedside session, Care and forms, Tasks, Communication.
- In this phase choosing an action calls recordActivity and announces "<Label> selected for <fictional patient>. Simulation only. Nothing is opened in this phase." It must not navigate, open another view, pass patient context anywhere, or create a task, message, observation, note or review cue.

Lock and end
- "Lock now" is not a Phase 1 function. Do not add it. Locking is demonstrated through inactivity only.
- Inactivity: show the timeout in words ("This simulated session locks after 5 minutes without activity"). A button "Advance simulated clock by 5 minutes" moves the injected clock and calls evaluateInactivity. No real timers: never use setTimeout, setInterval or requestAnimationFrame for this. When the timeout has passed the session locks, the clinician and patient are cleared from state and from the screen, and the live region announces "Session locked after inactivity. Patient binding cleared."
- "End session" is available from any status except Ended. It calls endSession, records pointOfCare.sessionEnded, clears clinician and patient, and announces "Session ended. Patient binding cleared."
- After Ended, "Start new session" creates a fresh locked session.
- After a lock or an end, JSON.stringify of the whole reducer state must contain no patient id, patient name, ward or bed from the previous binding outside the event references and the state trail wording. The state trail must name statuses only, never the patient.

Accessibility (WCAG 2.2 AA)
- Landmarks and headings: section with aria-labelledby; one polite aria-live region for all status changes.
- Every control has a visible label. Targets at least 44px (use --sf-target-min). Visible focus using the existing focus tokens. No state by colour alone. Respect reduced motion.
- Focus order (WCAG 2.4.3). Any action that disables or unmounts the control the user just used must hand focus to the next sensible element, never to the top of the page. Required targets: after Tap badge, the "Scan wristband" heading (tabIndex -1); after a successful scan, the "Actions" heading (tabIndex -1); after a refused scan, the wristband picker; after an action is chosen, focus stays on that action; after an inactivity lock, the "Tap badge (simulation)" button; after End session, the "Start new session" button; after Start new session, the badge picker. Move focus only when it was lost (document.body) or is still inside the view. Use the pattern from the merged fixes in src/components/connect/StructuredRequestCard.jsx, src/components/AgentReviewPanel.jsx and src/components/voice/.
- Reflow: no horizontal scroll at 320px. Layout works at 860px and below with controls stacked.
- Keyboard: the whole flow works by keyboard alone.

Privacy and security
- No console calls, storage, network, Notification API, service worker, clipboard or dangerouslySetInnerHTML.
- No real hardware of any kind. Never reference NDEFReader, navigator.nfc, navigator.usb, navigator.hid, navigator.serial, navigator.bluetooth, BarcodeDetector, getUserMedia, mediaDevices or video or canvas elements.

## 5. TESTS

Vitest + Testing Library (behavioural, no snapshots):
1. pointOfCareWorkspace reducer: the full happy path (locked, clinician-authenticated, patient-bound, ended) uses only Phase 1 functions; illegal moves are refused with state unchanged; the state trail lists every step.
2. Authentication: only 'simulated-badge' is accepted; any other method is refused and the session stays locked.
3. Binding: mismatch, ambiguous and unknown wristbands are each refused with the session still clinician-authenticated and patientId null; binding before sign-in is refused; a correct scan binds the right ward and bed from the lookup.
4. Action gating: availablePointOfCareActions is empty in locked, clinician-authenticated and ended, and has six entries when patient-bound. Choosing an action when not bound is refused by the reducer.
5. Inactivity: advancing the clock below the timeout changes nothing; at or past the timeout the session locks and clinicianId, clinicianRole, patientId, wardId, bedId and patientBoundAt are null. Activity before the timeout resets the window.
6. End: from each non-ended status endSession clears clinician and binding; ending twice is refused.
7. Cleared state: after lock and after end, JSON.stringify of the state contains none of the fixture patient names, ward ids or bed ids.
8. Platform events: pointOfCare.sessionStarted and pointOfCare.patientBound use a human actor; pointOfCare.sessionEnded is recorded on end; no event is recorded for a refused scan; no event holds a patient name.
9. Fixtures: every patient has fictional true; the mismatch, ambiguous and unknown wristband cases exist; names do not collide with real ward data files.
10. PointOfCareView: boundary copy present, "No patient bound" before binding, no action buttons in the DOM before binding, bound patient shown in words after binding, keyboard-operable main flow with userEvent, aria-live messages, and focus assertions (`toHaveFocus`) after every step listed under Focus order. Include a guard test showing focus is not taken when it is elsewhere.
11. Safety-language surface scans: append Point of care cases to src/components/safetyLanguageSurfaces.test.jsx that scan rendered text after interaction: initial, clinician signed in, refused scan, patient bound, action chosen, locked after inactivity, ended. Append only; do not weaken any existing case.
12. pointOfCareUiBoundary.test.js: scan src/components/pointOfCare/*.jsx, src/pointOfCare/pointOfCareWorkspace.js and src/pointOfCare/pointOfCareDemoFixtures.js for: fetch(, XMLHttpRequest, WebSocket, localStorage, sessionStorage, console., Notification, serviceWorker, navigator.clipboard, dangerouslySetInnerHTML, Date.now(, Math.random(, setTimeout(, setInterval(, requestAnimationFrame(, NDEFReader, navigator.nfc, navigator.usb, navigator.hid, navigator.serial, navigator.bluetooth, BarcodeDetector, getUserMedia, mediaDevices, <video, <canvas.
13. Existing tests still pass. Add Point of care as an additive entry to the destinations list in src/App.test.jsx (the "opens %s as a distinct workspace" cases) and to the destinations list in e2e/safeflow.spec.js, mapping the nav label to the view heading. Do not remove or weaken any existing entry.

Playwright e2e/point-of-care.spec.js (both projects, starting with signIn(page)): open Point of care from the nav (on mobile via More), tap a badge, try the mismatched wristband and see the refusal with "No patient bound", scan the correct wristband and see the bound patient and six actions, choose an action and see the simulation-only message, advance the simulated clock and see the lock with the patient cleared, sign in and bind again, end the session and see the cleared state, assert focus with toBeFocused at the steps under Focus order, and check no horizontal scroll at the mobile width.

## 6. SAFETY CONSTRAINTS (hard)

Simulation only. Fictional data only. No real badge, wristband, scanner, camera, device, sign-in system, network or persistence. A patient is bound only by an exact single match in the fictional lookup. A refused scan never binds and never suggests a patient. Actions exist only while a patient is bound. Lock and end always clear the clinician and the binding. Nothing in Point of care creates a task, message, observation, note, review cue or escalation. No score or aggregate is computed. Use AGENTS.md preferred language; avoid banned terms outside boundary context.

## 7. NON-GOALS

No observation capture or device readings (Phase 5); do not call the device observation or document capture providers. No forms or notes (Phase 6). No dictation from the bedside and no hand-off of patient context into Voice, Connect, Tasks or any other view. No accent, translation or interpreter features (Phase 7). No AI (Phase 8). No adapters, CIS2, Entra, Trust SSO, Imprivata or NFC reader seams (Phase 9). No manual "Lock now" control. No changes to Phase 1 domain rules or the platform event list unless a genuine defect blocks the UI; if so, stop and report instead of changing them. No new npm dependencies. No changes to server/, infra/, database/, src/agent/, src/connect/ or src/voice/. No global CSS refactors; point-of-care.css only plus one import line. The small Voice edit-box follow-up from SF-316 is not part of this task.

## 8. VERIFICATION (run and report)

Your sandbox cannot load the default vitest config or write .git. Use:
1. `npx vitest run --configLoader native src/pointOfCare src/components/pointOfCare src/components/safetyLanguageSurfaces.test.jsx src/shared`
2. `npx vitest run --configLoader native` (full; report any failures exactly, infra bundling failures are expected in your sandbox)
3. `npx vite build --configLoader native` if the default build fails in the sandbox
4. `git diff --check` and `git status --short`

Do not run Playwright if it cannot launch in your sandbox; say so. Claude will run npm test, build, audit and e2e outside the sandbox. If you do run Playwright, check which checkout owns port 5173 first. Keep any temporary config outside the repository.

## 9. GIT

Do not stage or commit (your sandbox blocks .git). Claude will commit after review using these messages:
1. feat: add Point of Care demo fixtures and workspace reducer
2. feat: add SafeFlow Point of Care bedside session view
3. test: cover Point of Care UI boundaries and e2e flow
Keep files aligned to that split. No junk files, screenshots, logs or local paths.

## 10. STOP CONDITION

Stop when the behaviour, tests and verification above are done. Write docs/implementation/2026-11-16-point-of-care-phase4-codex-handoff.md in the same format as the Phase 3 handoff. Final message: files created, files modified, focused and full test results, build result, diff-check, git status, deviations with reasons, open questions. Do not start Phase 5.
