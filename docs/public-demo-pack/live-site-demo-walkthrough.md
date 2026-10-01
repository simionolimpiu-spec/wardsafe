Live demo: https://simionolimpiu-spec.github.io/wardsafe/
Simulation-only, fictional data, not for clinical use.

# SafeFlow deployed-site demo walkthrough

**Audience:** non-clinical stakeholders, including graphic designers, and Band 6/7 ward, education, or quality audiences.
**Use with:** [`demo-script.md`](demo-script.md), which remains the local setup and original prototype walkthrough.
**Related:** [`demo-readiness-pack.md#live-demo-walkthrough`](../demo-readiness-pack.md#live-demo-walkthrough) is the existing full live-demo walkthrough; this document is its deployed-static companion.
**Wording source:** [`master-narrative.md`](master-narrative.md) and [`quality-intelligence-one-pager.md`](quality-intelligence-one-pager.md).

This guide is for the deployed public static build. Open the current URL supplied by the host; do not use `localhost` when presenting to someone else. The build is an interaction and visual demonstration using fictional data, not a live clinical or quality system.

## Start with the frame

1. Open the deployed URL and click **Presentation mode**.
2. Leave **Demo scenario** on **Day Care treatment pathway review** for the recommended path. The scenario selector can be changed if the audience wants to see a different fictional workflow.
3. Point out the fixed navigation, the summary cards, and the safety banner before discussing any individual screen. For a graphic designer, the useful question is how the hierarchy and boundary remain visible while the story moves from patient review to ward comparison and reporting.

## Recommended click path

Use the following sequence. The narration is deliberately plain English; the final column gives the boundary to say out loud if the audience asks what the screen means.

| Click / view | Plain-English narration | What it does not do |
|---|---|---|
| **Ward Safety Board**; click a patient ID such as `DCU-031` | “This is the ward-level starting point: a quick scan of fictional patients, review cues, handover completeness, and discharge-readiness blockers. Selecting a patient opens the detail panel so we can follow one example through the rest of the demo.” | It is not a live patient list, triage screen, or source of live clinical status. |
| **Simulation Review Cues** in the patient panel; optionally open **Why flagged** | “These are explainable prompts showing what changed or is missing in the fictional record, plus the evidence a human reviewer could check. The point is structured review support: what needs a second look, not an answer.” | It does not diagnose, prescribe, recommend treatment, or start an automatic escalation. Human review remains required. |
| **Handover** tab | “This view turns the same fictional patient into a workflow conversation: handover completion, open tasks, discharge-readiness blockers, and an editable next-step note. It is a useful bridge from the visual board to the kind of review discussion a Band 6/7 audience may recognise.” | It does not transfer responsibility, make a discharge decision, or assign work in a live service. |
| **Patient Journey Twin** tab | “This is a timeline view for seeing how fictional events, missing information, and review cues fit together over time. For a designer, it shows the information architecture behind the board; for a learning audience, it supports reflection on the sequence.” | It is not a live clinical record, a validated prediction, or a representation of a real person. |
| **Hospital insights** in the left navigation | “This compares the current fictional ward with fictional hospital averages and shows an illustrative simulated trend. It makes the ward-level review story visible without requiring the audience to read every patient row.” | It is not actual hospital performance, a validated benchmark, or a connection to live systems. |
| **Reports** in the left navigation, then **Ward quality & safety review** | “This assembles review cues, a simulated trend summary, and verified learning evidence into a structured exportable report. This is the Band 6/7 conversation: what changed, what needs checking, and what learning evidence is available.” | It does not score staff, start an escalation pathway, replace the EPR or any live clinical or quality system, or create clinical records. |
| Top-bar **Review report** (optional close) | “This is the compact end-to-end summary: selected fictional patient, active review cues, ward comparison, and learning/reflection points in one place. It is a good final screen for showing how the product turns separate views into a shareable review summary.” | It is not clinical decision-making output and must not be presented as clinically validated evidence. |

## Where the boundary is stated on screen

Call out the boundary once at the start, then point to it again as the path changes:

- On normal views, the top **Simulation only** banner says: “Public preview boundary. Fictional patient data only. Not clinical advice, not diagnosis, not prescribing, not live NHS deployment. Human review required.”
- **Presentation mode** adds the heading **Simulation-only SafeFlow demo** and the note: “Simulation-only. Human review required.”
- The patient panel’s **Simulation Review Cues** section says: “Simulation-only cues. Human review required.” It also states: “Simulation output for preview only. Not clinically validated and not for clinical decision-making.”
- **Patient Journey Twin** labels itself a simulation-only timeline, not a live clinical record, and says human review is required.
- **Hospital insights** repeats the safety banner, identifies the source as simulation, shows “Live systems: not connected” and “Patient data: not present,” and labels the trend “Illustrative model output, not clinically validated.”
- The report drawers include a **Simulation boundary** section: “Simulation-only prototype for human review required.” The Reports view also says exports contain fictional identifiers only and do not represent clinical records.

If the audience asks “Could this do that in practice?”, bring the answer back to the current scope: SafeFlow is a simulation-only prototype for structured review support using fictional data. It does not use real patient data, connect to live NHS systems, automate clinical action, or replace the EPR, RRT/Call-for-Concern, or any live clinical or quality system.
