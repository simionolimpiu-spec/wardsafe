# SafeFlow Master Narrative

**Status date:** 2026-07-06
**Authored directly (docs-only):** yes
**Source note:** written from the Aurora white paper and current repo docs; the white-paper source itself is not versioned in this repo.

## One Sentence

SafeFlow is a simulation-only, nurse-led prototype that turns fictional ward documentation into structured review support, ward comparison cues, and exportable learning summaries.

## One Paragraph

SafeFlow is a simulation-only, nurse-led prototype for structured review support. It helps nursing and transformation teams explore documentation gaps, handover completeness issues, discharge-readiness blockers, and escalation readiness cues using fictional patient journeys. The product is intentionally bounded: it does not use real patient data, does not connect to live NHS systems, does not automate clinical action, and does not replace the EPR, RRT/Call-for-Concern, or any live clinical or quality system. Every cue is there to support human review, not replace it.

## One Page

SafeFlow is best described as a controlled learning and demonstration workspace, not as live clinical software.

It shows a fictional ward board, patient timelines, review cues, ward comparison views, and exportable learning output. Those surfaces are designed to help people see what changed, what is missing, what still needs human checking, and where a ward workflow may need clearer handover or discharge information.

It is not a live patient record, not a prescribing tool, and not an autonomous escalation layer. The right default phrasing is simulation-only, fictional data, human review required, and structured review support.

Primary audiences are nursing educators, ward leaders, digital safety leads, and stakeholders who need to understand the shape of the workflow before any governed pilot is considered.

### Why this matters

SafeFlow's practice areas are grounded in the UK's own patient-safety inquiry record, not invented from scratch. A 2024 national investigation found that between 5% and 26% of incidents resulting in severe harm or death involve patient deterioration that was not sufficiently recognised or responded to. Earlier public inquiries found that warning signs went unpicked-up, staff generally remained passive rather than raising concerns, and organisations were poor at listening to patients, families, and staff. SafeFlow does not claim to have solved any of this. It is a simulation-only prototype for rehearsing the structured review, human-factors awareness, and speak-up behaviours that this record shows matter - full citations are in `evidence-base-references.md`.

### SafeFlow Quality Intelligence

SafeFlow Quality Intelligence is a simulation-only extension that assembles the review cues, deterioration-pattern flags, and verified learning evidence already generated elsewhere in SafeFlow into structured, exportable reports of the kind a Band 6/7 nurse currently prepares by hand for ward audits, safety huddles, and revalidation. It surfaces what changed, what needs checking, and what learning has been verified - it stays ward-level, simulation-only, and human review required, and it does not create person-level comparisons or replace the EPR, RRT/Call-for-Concern, or any live clinical or quality system.

#### Verified learning evidence

Verified learning evidence is the approved narrative home for future Mia's M10 rollups. It presents aggregated, non-identifying counts of completed simulation learning modules and Competency-Passport credits as ward-level learning assurance (simulation). The output stays simulation-only and human review required, with no names or person-level comparisons.

## Approved Terminology

- SafeFlow
- SafeFlow Nursing
- simulation-only prototype
- fictional data
- human review required
- structured review support
- review cue
- risk-support signal
- documentation gap
- handover completeness issue
- discharge-readiness blocker
- escalation readiness cue
- quality review evidence
- ward quality and safety report (simulation)
- verified learning evidence
- ward-level learning assurance (simulation)
- escalation-pathway learning scenario
- structured audit evidence export
- Ward Safety Board
- Hospital Insights
- Patient Journey Twin
- Simulation Patient Twin
- Simulation Review Report
- Presentation Mode
- exportable learning summary

## Banned Wording

- wording that implies future-state certainty
- wording that labels a clinical condition
- wording that advises a clinical action
- wording that suggests autonomous escalation
- wording that suggests live NHS deployment
- wording that suggests live patient data
- staff scoring
- competency ranking
- performance league table
- individual nurse rating
- RRT trigger
- Call for Concern trigger
- discharge coordination platform
- patient feedback capture
- named reference to Optica or any other commercial competitor

## Honest Gaps

| Status | Gap | Why it is still red | Next step |
|---|---|---|---|
| RED | The timeline surface in the app still mixes the primary Twin name with the simulation qualifier. | This lane is docs-only. | Raise a Mia task to standardise the visible label in `src/components/PatientJourneyTwin.jsx`. |
| RED | The broader docs tree still contains older wording outside this alignment set. | This pass only revised the public demo pack and control board targets. | Schedule a separate cleanup pass for the remaining docs. |
| RED | The white paper baseline lives in the Aurora strategy pack outside the repo. | The repo now mirrors it, but the source copy is not versioned here. | Copy the baseline into the repo later if we want a versioned product source. |

## Discrepancy Table

| Doc | Claim | Conflicts With | Proposed Fix | Status |
|---|---|---|---|---|
| `docs/public-demo-pack/stakeholder-demo-pack.md` | The pack describes the prototype with older boundary phrasing and no single controlled wording source. | The master narrative and white-paper baseline. | Reword the concept, problem, capability, and boundary sections to use the approved terminology list. | GREEN |
| `docs/public-demo-pack/demo-script.md` | The audit section still uses advisory wording. | The master narrative and the safety boundary. | Replace that line with next-step / response wording and keep the demo flow simulation-only. | GREEN |
| `docs/public-demo-pack/safety-boundary.md` | The boundary section still uses clinical-label wording. | The master narrative and approved terminology list. | Rewrite the boundary bullets so they say what SafeFlow does and does not do without clinical-label phrasing. | GREEN |
| `SF-217 Ward Quality & Safety Review export` | The export now has an approved narrative home in this master narrative. | No current conflict; the wording is defined here. | Use the SafeFlow Quality Intelligence subsection and approved terminology list as the controlled wording source. | GREEN |
| `CONTROL.md` | The board still had older wording in the risk register and status rows. | The master narrative. | Rewrite the affected rows so the control board uses the same review-support language as the docs. | GREEN |
| `src/components/PatientJourneyTwin.jsx` | The visible timeline surface mixes the primary name and the simulation qualifier. | The approved terminology list. | Suggested Mia task: standardise the surface label and keep the simulation qualifier in the boundary note. | RED |

## Control Rule

If a doc conflicts with this file, this file wins.
