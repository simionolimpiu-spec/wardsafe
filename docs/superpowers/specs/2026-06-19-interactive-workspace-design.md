# SafeFlow Interactive Workspace Design

**Status:** Approved for implementation

## Goal

Make every visible SafeFlow navigation item, tab and action available as a coherent simulation workflow. The result remains a fictional-data prototype: no live integrations, external contact, diagnosis, prescribing or autonomous clinical action.

## Product Decisions

- Every sidebar item opens a distinct screen.
- All screens share one simulation workspace state so counters and patient details remain consistent.
- Actions update local simulated state and append audit history.
- State survives browser refresh through versioned local persistence.
- Settings provides a prominent reset control that restores the original fictional scenario.
- Existing journey tabs remain as contextual shortcuts into the same screens.

## Navigation And Screens

The sidebar is the primary navigation. It exposes these dedicated destinations:

1. **Ward Safety Board** - ward metrics, filters, patient selection and fictional board export.
2. **My Patients** - patients assigned to the simulated signed-in nurse, with quick actions and patient details.
3. **Observations** - fictional NEWS2 and observation history, plus a validated form for recording a simulated observation.
4. **Tasks** - filterable task register with create, assign, complete and reopen actions.
5. **Escalations** - active and historical simulated escalations with create, acknowledge, update and close actions.
6. **Handover** - editable SBAR and readiness information, open-task visibility and handover completion.
7. **Discharges** - discharge blockers, readiness checks and simulated blocker updates.
8. **Reports** - preview and download of fictional ward, handover and audit summaries.
9. **Audit Trail** - searchable, filterable local history of workspace actions.
10. **Settings** - display preferences, simulation identity, draft-provider mode and simulation reset.

The selected patient remains shared when moving between patient-related screens. The patient safety panel remains available where patient context is useful and is omitted from full-width operational views when it would reduce scanning space.

## Existing Control Behaviour

- Patient identifiers select the patient and open the relevant patient context.
- Patient-panel tabs continue to switch between overview, SBAR, tasks and audit details.
- **Call team** opens a clearly labelled simulated-contact dialog. Confirming records an audit event but never opens a telephone link or external service.
- **Add task** opens a validated local form and adds the task to the shared register and patient record.
- SBAR draft generation remains behind the existing server-side provider boundary with deterministic fallback.
- Saving an SBAR draft updates local state and the audit trail.
- Export actions generate files containing fictional identifiers only.

## State Architecture

A single `useSimulationWorkspace` boundary owns a reducer-driven state model. Components dispatch explicit actions instead of mutating patient fixtures directly. The state contains:

- selected view and selected patient;
- patients and observations;
- tasks and escalations;
- handover and discharge state;
- audit events;
- user-facing preferences and simulation identity.

Every successful mutation produces an audit event containing a generated identifier, timestamp, actor, action label, affected fictional entity and concise detail. Derived counts, filters and ward metrics are calculated from the shared state rather than maintained separately.

## Persistence And Reset

The workspace serialises to a versioned `localStorage` record. Startup validates the version and minimum data shape before restoring it. Missing, corrupt or incompatible records fall back to the committed fictional defaults without preventing the app from loading.

Reset requires confirmation, clears the persisted record and restores the original scenario, counters, selections and audit seed. A visible status message confirms completion.

## Validation And Feedback

- Forms require essential fields and reject invalid numeric ranges.
- Validation messages are inline and associated with their controls.
- Successful actions display concise status feedback and update the relevant screen immediately.
- Empty filters show a useful empty state rather than a blank table.
- Failed draft-provider requests continue to use the deterministic fallback.
- File-export failure produces a non-destructive error message.

## Safety Boundary

- All data remains fictional and uses synthetic references such as `DCU-031`.
- Simulated contact and escalation actions are labelled as simulation events.
- No control sends messages, makes calls, connects to clinical systems or executes AWS operations.
- UI language supports recognition, checking, escalation and documentation only.
- Generated and exported wording must not include diagnosis, prescribing or treatment instructions.
- The existing simulation banner remains visible on every screen.

## Accessibility And Responsive Behaviour

- Navigation exposes selected state and a clear page heading.
- Dialogs receive focus, support keyboard dismissal and restore focus to their trigger.
- Forms use labels, descriptions and accessible validation messages.
- Tables retain bounded horizontal scrolling on narrow screens.
- Stable layout dimensions prevent counts, loading states and status text from shifting controls.

## Test Strategy

Implementation follows test-first development:

- reducer tests for every mutation and derived count;
- persistence tests for restore, corrupt data and reset;
- component tests for all ten sidebar destinations;
- interaction tests for task, observation, escalation, handover, discharge, contact, export and settings actions;
- safety assertions for fictional identifiers and forbidden clinical wording;
- Playwright coverage that visits every destination and completes the principal simulation actions.

## Acceptance Criteria

- Every visible sidebar button opens a distinct, usable screen.
- Every visible tab and command performs an observable simulation-safe action.
- Changes remain consistent across screens and survive refresh.
- Reset restores the original fictional scenario.
- Every successful mutation appears in the audit trail.
- No action creates an external clinical, communication or infrastructure side effect.
- Unit, component, build and browser verification pass.
