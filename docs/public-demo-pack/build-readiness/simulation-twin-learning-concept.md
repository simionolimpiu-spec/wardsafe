# SafeFlow — Simulation Twin & Learning Concept (SF-107)

Status: simulation-only prototype. Fictional data only. Not for clinical use. Review-support and education only — never live clinical action.

`master-narrative.md` is the controlled wording source. Nothing here positions SafeFlow as replacing the EPR, RRT/Call-for-Concern, or any live clinical or quality system.

## Purpose

Consolidate the "simulation twin" and learning direction that has been explored across the prototype, and state clearly what it is (and is not), so the idea is recorded and bounded rather than left open-ended.

## What the "simulation twin" is

A **Patient Journey Twin** over *fictional* patient timelines: a deterministic, simulation-only view that shows how a made-up patient's picture changes over a sequence of observations, and surfaces explainable review cues for a human to consider. It is already built in the prototype (`PatientJourneyTwin`, `patientTimeline` model, the simulated trend model) and is used to demonstrate structured review support — not prediction of real outcomes.

Key properties:

- **Fictional and deterministic.** Built from bundled simulation fixtures; no real patient data, no live feeds.
- **Explainable.** Every cue shows what changed and why it flagged; outputs are labelled "Illustrative model output, not clinically validated."
- **Human-review-framed.** The twin never acts, escalates, diagnoses, or prescribes; it prompts a human to look.

## How learning connects

The twin and the wider review surfaces feed the **education** layer, not any clinical pathway:

- Deterioration-pattern review scenarios (rising respiratory rate, new-onset confusion, falling oxygen saturation) give learners fictional cases to practise spotting change.
- The Learning Hub micro-learning modules and the Competency Passport turn that practice into *verified learning evidence* — and, at ward level, into aggregate, non-identifying learning assurance (never individual staff scoring).
- The evaluation session (see `evaluation-readiness-summary.md`) tests whether this review-support-plus-learning loop is usable and useful — usability/usefulness evidence only, not clinical evidence.

## Boundary (what SF-107 is NOT)

- Not a digital twin of a real patient, and not a predictor of real clinical outcomes.
- Not a clinical decision tool, alerting system, or escalation trigger.
- Not a staff-performance or ranking mechanism.

## Status & next step

The twin + learning direction is delivered as a simulation-only, education-framed capability; SF-107 is recorded here as a bounded concept. The natural next step is the first evaluation session (SF-210 readiness), which generates evidence about whether the review-support + learning loop helps — with no change to the simulation-only boundary.
