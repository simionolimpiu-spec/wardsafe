# CODEX TASK: SafeFlow Phase 2 - Connect simulation UI (SF-315)

Dispatched by: Claude (orchestrator, reviewer, QA gate). You are the implementer. Oli approved Phase 2 on 20 September 2026.

## 0. First action

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md before making implementation decisions. Then read AGENTS.md, docs/design/SAFeflow-DESIGN.md (sections 2, 5, 8, 9, 10, 11, 14, 17), docs/project/task-plan.md and docs/project/findings.md. Do not edit docs/project/ or CONTROL.md; Claude owns them.

## 1. OBJECTIVE

Build the first user-facing SafeFlow Connect screen: a simulation-only "Communication" view inside the existing ward workspace that demonstrates, with fictional fixtures only, patient-linked and team threads, role-based addressing, structured requests with their explicit lifecycle, an AI-draft review gate, links to EXISTING tasks, and privacy-safe notification previews. It must visibly prove MESSAGE != TASK != REVIEW CUE != ESCALATION. It must use the Phase 1 domain modules in src/connect and src/shared as the only source of rules. No new rules in the UI.

## 2. REPOSITORY FACTS (verified by Claude)

- Working copy: C:\Users\oli\Documents\wardsafe-cvp-foundation. Branch: feature/connect-ui-phase2, created from codex/safeflow-prototype at f36bb32 (the Phase 1 merge, PR #101). Use npm.
- Stack: React 19, Vite, plain JS, Vitest + Testing Library (jsdom), Playwright e2e in e2e/ (desktop and mobile Chromium projects), lucide-react icons, framer-motion available but not required.
- Routing: `state.selectedView` in src/state/simulationWorkspace.js via `navigation/changed`. Views render in src/App.jsx as `{state.selectedView === 'x' && <XView ... />}`. Navigation groups live in src/components/WorkspaceNav.jsx (`wardNavGroups`). Phone bottom tabs in src/components/MobileTabBar.jsx (do NOT change the four tabs; More already opens the full nav drawer).
- Existing tasks live in workspace state (`state.tasks`, see TasksView). Patients: the current scenario's fictional patients.
- Design system: src/design-system (index.js exports Badge, SimulationLabel, InformationPanel, EmptyState, ClinicalStatusBadge and more). Tokens in src/styles/tokens.css (`--sf-space-*`, `--sf-target-min` 44px, duration tokens zeroed under reduced motion). Stylesheets are imported from src/styles/index.css.
- Safety wording: src/domain/safetyLanguage.js; rendered-surface scans in src/components/safetyLanguageSurfaces.test.jsx.
- Phase 1 domain API (import from the pillar index files): createCommunicationThread, createCommunicationEvent, approveAiDraft, createStructuredRequest, transitionStructuredRequest, REQUEST_TRANSITIONS, STRUCTURED_REQUEST_TYPES, createRoleRecipient, resolveRoleRecipient, ROLE_KEYS, createPrivacySafeNotification, createSimulationCommunicationProvider, fictionalAssignments, createPlatformEvent, createCaptureProvenance.

## 3. TARGET LAYOUT

```
src/connect/demoFixtures.js            fictional threads, people, role assignments for the demo (pure data + small builder); co-located test
src/connect/connectWorkspace.js        pure reducer for the view: state + actions -> next state, built only on Phase 1 functions; co-located test
src/components/connect/ConnectView.jsx          screen shell: thread list + selected thread
src/components/connect/ThreadList.jsx
src/components/connect/ThreadDetail.jsx         timeline of events, composer, request cards
src/components/connect/MessageComposer.jsx
src/components/connect/StructuredRequestCard.jsx
src/components/connect/AiDraftReviewPanel.jsx
src/components/connect/RoleRecipientPicker.jsx
src/components/connect/TaskLinkPicker.jsx
src/components/connect/NotificationPreview.jsx
src/components/connect/ConnectView.test.jsx     (plus focused tests per component where useful)
src/components/connect/connectUiBoundary.test.js
src/styles/connect.css                           imported from src/styles/index.css
e2e/connect.spec.js
```

Minimal wiring changes only: add `{ id: 'communication', label: 'Communication', icon: MessagesSquare }` to the Coordination group in WorkspaceNav.jsx, render ConnectView in App.jsx for `selectedView === 'communication'`, import connect.css. Pass `patients`, `tasks` and the selected patient id as props. Do not change other views, reducers, persistence or the phone tabs.

## 4. REQUIRED BEHAVIOUR

State
- The view owns its state with `useReducer(connectReducer, initialState)`. connectWorkspace.js is a pure module in src/connect (pillar rules from Phase 1 still apply: no pillar-to-pillar imports, no Date.now/Math.random/console/storage/network). The component supplies injected `now` and `createId` (use a monotonic counter and a fixed simulated clock that advances by one minute per action; do not use Date.now or Math.random anywhere in src/connect or src/components/connect).
- In-memory only. Reset on reload. No localStorage, no persistence, no server calls.
- A small "Simulation activity" list shows platform events created with createPlatformEvent (type, actor, subject ref, time). Events carry references only, never message text.

Threads
- Seed at least: one patient thread per first two fictional patients of the current scenario (scope patient, patientRef = patient.id), one team thread (ward nursing team), one MDT thread. Thread list shows scope label in words, patient name only inside patient-scoped threads, unread count in words (for example "2 unread"), never colour alone.
- Selecting a thread shows its timeline. Each event shows kind in words ("Message", "Structured request", "Acknowledgement", "Task link", "System event"), author and author kind ("Clinician", "System", "AI draft"), time and status.

Messages
- Composer posts a human message (author = the fictional current user shown in a visible "Signed in as (simulation)" line). Body text never changes the kind: typing "urgent" or "escalate" still posts a Message. Show a persistent inline note in the composer: "Messages do not create tasks, review cues or escalations. Use your local escalation process for urgent concerns."

Role-based addressing
- RoleRecipientPicker lists ROLE_KEYS with human labels. Resolving uses resolveRoleRecipient against demo assignments. Show the resolved fictional person, or the unresolved reason in words ("No current available assignment"). Never guess or pick a person when unresolved; the send button stays disabled with that reason.

Structured requests
- "New request" form: type (STRUCTURED_REQUEST_TYPES with human labels), recipient role, required short summary. Creates a structured-request event plus a StructuredRequest.
- StructuredRequestCard shows current state in words and a history list. Buttons appear ONLY for transitions allowed by REQUEST_TRANSITIONS from the current state. Delivered and read are recorded by a "Simulate delivery" / "Simulate read" system control. Recipient actions (acknowledge, accept, start, complete, decline) are under a clearly labelled "Recipient actions (simulation)" group and use the fictional recipient as the human actor. Show text "Acknowledged does not mean accepted" next to the Acknowledge button. Cancel requires a confirm step.
- No request action creates a task, cue or escalation. There is no "convert" control anywhere.

AI draft review gate
- "Draft reply (simulation)" creates a fixed template ai-draft event (no LLM, no network; choose from 2 or 3 fixed fictional strings). The draft appears in AiDraftReviewPanel with "AI draft - review required" in words, the draft text, and actions: "Approve and send" (approveAiDraft by the current user, then provider.sendEvent), "Edit as my message" (copies text into the composer, draft discarded, message then sent as a human message), "Discard". The provider must refuse sending an unapproved draft; do not bypass it.

Task links
- TaskLinkPicker lists EXISTING workspace tasks for the thread's patient (or all for non-patient threads). Linking creates a task-link event with existingTaskIds from props. There is no "create task" control in Connect. If there are no tasks, show EmptyState "No existing tasks to link".

Notifications
- NotificationPreview shows the createPrivacySafeNotification text for the last incoming event category ("SafeFlow - new message" and similar) inside a mock lock-screen panel labelled "Lock-screen preview (simulation)". It never shows names, ids, numbers or message text.

Boundary copy
- Top of the view: SimulationLabel and the text "Simulation only. Fictional patients and staff. Not connected to Teams, NHSmail, SMS, WhatsApp or any live service. Human review required."
- External channels are not offered anywhere in the UI.

Accessibility (WCAG 2.2 AA)
- Landmarks and headings: section with aria-labelledby; thread list as a list of buttons with aria-current="true" on the open thread.
- Every control has a visible label. Targets at least 44px (use --sf-target-min). Visible focus using existing focus tokens.
- Status changes announced through one polite aria-live region ("Request acknowledged", "Draft discarded").
- States never colour alone. No motion beyond duration tokens; respect reduced motion.
- Keyboard: full flow operable by keyboard; Escape closes the cancel confirmation and returns focus to the Cancel button.
- Reflow: no horizontal page scroll at 320px; at 860px and below the thread list and detail stack vertically with a "Back to threads" button.

Privacy and security
- No console calls, no storage, no network, no Notification API, no service worker, no clipboard, no dangerouslySetInnerHTML. Message text rendered as text only.

## 5. TESTS

Vitest + Testing Library (behavioural, no snapshots):
1. connectWorkspace reducer: posting "please escalate urgently" yields a message event only; state has no tasks/escalations/cues collections.
2. Request lifecycle through the reducer: only allowed transitions; acknowledge is not accept; completed only after in-progress; cancel by the current human.
3. AI draft: cannot be sent before approval; approve and send works; discard removes it; edit-as-my-message produces a human-authored message with the draft text.
4. Role picker: unresolved role disables send and shows the reason.
5. Task link: only existing task ids; no create-task control in the rendered view.
6. Notification preview text never contains patient names, ids or digits.
7. ConnectView renders boundary copy, is keyboard-navigable for the main flow (userEvent.tab / keyboard), exposes aria-live messages and aria-current on the open thread.
8. Add a Connect case to src/components/safetyLanguageSurfaces.test.jsx scanning the rendered ConnectView text (append only; do not weaken existing cases).
9. connectUiBoundary.test.js: scan src/components/connect/*.jsx and src/connect/connectWorkspace.js and demoFixtures.js for: fetch(, XMLHttpRequest, WebSocket, localStorage, sessionStorage, console., Notification, serviceWorker, navigator.clipboard, dangerouslySetInnerHTML, Date.now(, Math.random(, getUserMedia.
10. Existing tests must still pass. The existing nav expectations are inclusion-only, so nothing breaks, but add Communication as an additive entry to the destinations list in src/App.test.jsx (the "opens %s as a distinct workspace" cases, around line 950) and to the destinations list in e2e/safeflow.spec.js (around line 122), mapping the nav label "Communication" to the view heading you give ConnectView. Do not remove or weaken any existing entry.

Playwright e2e/connect.spec.js (runs in both existing projects): open Communication from the nav (on mobile via More), open a patient thread, post a message containing "escalate" and see it listed as Message, create a review request, simulate delivery and read, acknowledge, accept, start, complete, generate an AI draft and approve it, check no horizontal scroll at the mobile width.

## 6. SAFETY CONSTRAINTS (hard)

Simulation only. Fictional data only. No LLM calls, no live providers, no external channels, no persistence of messages, no real notifications. No message, request or draft ever creates or converts into a task, review cue or escalation. AI content is never sent without a human approval that is not the AI author. Use AGENTS.md preferred language; avoid banned terms outside boundary context.

## 7. NON-GOALS

No voice (Phase 3), no bedside session (Phase 4), no observations (Phase 5), no forms (Phase 6), no AI beyond fixed simulation templates (Phase 8), no adapters (Phase 9). No changes to Phase 1 domain rules unless a genuine defect blocks the UI: if so, stop and report instead of changing them. No new npm dependencies. No changes to server/, infra/, database/, src/agent/. No global CSS refactors; connect.css only (plus one import line).

## 8. VERIFICATION (run and report)

Your sandbox cannot load the default vitest config or write .git. Use:
1. `npx vitest run --configLoader native src/connect src/components/connect src/components/safetyLanguageSurfaces.test.jsx src/shared`
2. `npx vitest run --configLoader native` (full; report any failures exactly, infra bundling failures are expected in your sandbox)
3. `npx vite build --configLoader native` if the default build fails in the sandbox
4. `git diff --check` and `git status --short`
Do not run Playwright if it cannot launch in your sandbox; say so. Claude will run npm test, build and e2e outside the sandbox.

## 9. GIT

Do not stage or commit (your sandbox blocks .git). Claude will commit after review using these messages:
1. feat: add Connect demo fixtures and view reducer
2. feat: add SafeFlow Connect simulation view
3. test: cover Connect UI boundaries and e2e flow
Keep files aligned to that split. No junk files, screenshots, logs or local paths.

## 10. STOP CONDITION

Stop when the behaviour, tests and verification above are done. Final message: files created, files modified, focused and full test results, build result, diff-check, git status, deviations with reasons, open questions. Do not start Phase 3.
