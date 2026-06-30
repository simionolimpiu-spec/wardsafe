# Role-Aware GUI And Graphs

SafeFlow is still a simulation-only prototype. This note explains the minimal, premium GUI direction for demo and review work, and how the interface changes by role without losing the safety boundary.

## Minimal GUI Principles

- Calm clinical surface rather than a busy prototype.
- Clear hierarchy, generous spacing, and fewer noisy cards.
- Presentation-friendly flow for nursing leadership, ward managers, clinical educators, digital safety leads, and innovation teams.
- Plain language where possible, with explainable review detail only when the viewer is a staff user.
- No NHS branding or implied endorsement.

## Role-Aware Display Scope

### Clinical staff view

Clinical staff can see:

- Patient Journey Twin
- simulation review cues
- Hospital Insights
- benchmark comparisons
- unresolved task burden
- discharge readiness
- documentation gaps
- handover completeness
- escalation readiness
- Simulation Review Report
- clinical-only trend and benchmark graphs

### Educator / simulation view

Educator and simulation users see the same staff surfaces, with the same simulation-only boundary, so they can review the workflow and talk through the learning points.

### Family-safe preview

Family-safe preview hides:

- internal risk-support signals
- deterioration labels
- sepsis / electrolyte / AKI cue labels
- raw review cue load
- internal documentation scores
- alarming clinical-risk language
- diagnosis / prescribing / treatment recommendation language

Family-safe preview may show:

- a calm plain-language journey summary
- what has been reviewed
- what is still being checked
- a next update placeholder
- a clear statement that the clinical team remains responsible

## Clinical-Only Graph Rationale

The graphs are staff-facing only because they are there to support review, discussion, and ward comparison rather than to predict treatment or automate escalation.

The graph surfaces are fictional and simulation-only:

- patient journey trend
- improvement / readiness trend
- unresolved tasks
- discharge readiness
- review cue load
- documentation completeness
- hospital benchmark comparison

These visuals are intentionally calm and compact, so they can work during a shift without turning the screen into a dashboard wall.

## Patient Journey Twin

The Patient Journey Twin is the main staff-only graph strip in the patient panel.

It is meant to show:

- the current simulated journey state
- how readiness is changing
- how many tasks remain open
- whether discharge is blocked
- how many review cues are active
- how complete the documentation trail looks

It is not a diagnostic view, not a prediction engine, and not treatment guidance.

## Relation To The Simulation Signal Engine

The Simulation Signal Engine turns fictional patient and workflow data into explainable review cues.

This GUI layer is the presentation surface for that engine:

- staff users see the cues and the supporting trend surfaces
- family-safe users see the calm summary instead
- both paths stay simulation-only and human-review-led

## Relation To ML / Neural / Generative AI Direction

SafeFlow can later evolve toward a more advanced intelligence layer, but this GUI is intentionally not making that claim.

Any future ML, neural, or generative AI use would still need:

- simulation-only boundaries
- controlled data sources
- explicit human review
- governance and safety review
- no frontend exposure of backend secrets

## Safety Boundaries

- Fictional patient data only
- No real patient data
- No live NHS systems
- No diagnosis
- No prescribing
- No treatment recommendation
- No autonomous clinical decision-making
- No live clinical deployment claim
- No OpenAI API key in the frontend

## Demo Linkage

The [live demo walkthrough](../demo-readiness-pack.md#live-demo-walkthrough) is the acceptance script for this GUI direction.

It should feel like:

1. Presentation Mode
2. Demo Scenario
3. simulated patient context
4. patient-level cues
5. Hospital Insights
6. simulated hospital benchmarks
7. Simulation Review Report
8. future NHS/AWS roadmap

The family-safe path should stay plain-language and non-alarming throughout.
