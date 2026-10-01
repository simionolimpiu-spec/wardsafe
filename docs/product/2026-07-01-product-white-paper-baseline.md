> ## SUPERSEDED — historical baseline, 1 July 2026
>
> **This document is preserved for provenance. It does not describe SafeFlow as it stands today,
> and it must not be quoted as a current product description.**
>
> It is versioned here because `master-narrative.md`'s Honest Gaps table recorded, correctly, that
> the white-paper baseline existed only in the Aurora strategy pack outside the repo and was
> therefore unversioned. That gap is now closed. The body below is the original text, unedited.
>
> The controlled wording source is `docs/public-demo-pack/master-narrative.md`. The live status
> record is `CONTROL.md`. Where this document conflicts with either, they win.
>
> ### What has materially changed since this was written
>
> The safety boundary in section 6 has held unchanged and is still accurate: simulation-only,
> fictional data only, no live NHS integration, no automated diagnosis, prescribing or escalation,
> human review required. That part of this document has aged well and is still the position.
>
> Almost everything about *status* has not. Specifically:
>
> - **The roadmap in section 11 is largely complete.** Phase 1 (control and consolidation),
>   Phase 2 (demonstration polish), Phase 3 (Patient Journey Twin) and Phase 4 (architecture mock)
>   have all shipped. Phase 5 (evaluation) is ready to run and now needs participants rather than
>   design — see `build-readiness/evaluation-readiness-summary.md` and
>   `build-readiness/evaluation-recruitment-checklist.md`. Phase 6 (governance gateway) is
>   unchanged and remains a future decision.
> - **Section 10's control-board summary is stale.** Items it lists as in progress or backlog —
>   the Patient Journey Twin, the AWS mock layer, the evaluation framework, the v2 NHS-realistic
>   screen concept, the audit event log — have since been delivered. `CONTROL.md` is the live
>   record and now runs to SF-278.
> - **Section 13's recommended next actions are all done or obsolete.** `CONTROL.md` exists at the
>   repository root. The PR referenced there is long since resolved. All three of the "choose one"
>   build options were subsequently built.
> - **Section 5's use of "Simulation Patient Twin" as an alternate product name is no longer
>   correct.** SF-275 removed exactly that competing label from the interface, because presenting
>   two names for one surface was flagged as a discrepancy against the approved terminology list.
>   The approved primary name is **Patient Journey Twin**; the simulation qualifier belongs in the
>   boundary note, not in a second product name.
> - **Section 12 is chat-specific.** Its references to a ChatGPT export pack and to re-running
>   repository commands describe how the project was being worked at the time, not how it is
>   structured now.
> - **Section 3's claim that merge status "should be re-confirmed"** was true on the day and is
>   meaningless now; read `CONTROL.md` instead.
>
> Nothing below this line has been altered.

---

# SafeFlow Product White Paper

**A simulation-first clinical workflow intelligence prototype for safer nursing documentation, review cues and patient journey learning**

**Status date:** 1 July 2026
**Project boundary:** Simulation, education and stakeholder demonstration only. No real patient data. No live NHS deployment. No automated diagnosis, prescribing or escalation.

## Executive summary

SafeFlow is a simulation-first product prototype designed to show how nursing documentation, patient journey context and structured review cues could be brought into one safer, clearer workspace.

The project is deliberately bounded as a public demonstration and educational simulation. It does not process real patient data, does not connect to live NHS systems and does not make autonomous clinical decisions. Its current value is to help stakeholders see the shape of a safer clinical workflow: what information nurses need, where duplication happens, how review cues can support human judgement, and how documentation quality can be improved before any live clinical pathway is considered.

The prototype has now moved beyond a basic concept. It includes a simulation signal foundation, patient-panel review cues, presentation mode, exportable simulation report capability, a stakeholder demo pack and clinical-safety/information-governance readiness notes. The next phase is consolidation: keep one control board, align the app, white paper and slides, and decide whether the next build focus should be export/report polish, Patient Journey Twin UI, or AWS mock architecture.

## 1. Product vision

SafeFlow aims to become a safe, nurse-led digital workflow layer that helps staff understand what has changed for a patient, what needs human review, and how documentation can be made more structured and clinically meaningful.

The long-term concept is not to replace clinical judgement. It is to retain and surface the practical knowledge that experienced nurses use every day: noticing deterioration, connecting fragmented events, identifying gaps in documentation, and recognising when a patient journey does not feel safe or complete.

In its current form, SafeFlow should be described as a simulation product. The correct language is review support, education, workflow demonstration and human-led decision-making. The incorrect language is diagnosis engine, automated prescribing, autonomous triage or live clinical escalation.

## 2. Problem the product addresses

Nursing work often depends on fragmented information. Paper notes, electronic systems, observation charts, prescribing systems, handover sheets and informal knowledge can sit in different places. This creates duplication, cognitive load and avoidable risk during handover, discharge, escalation and ward review.

The clinical problem is not only data access. The deeper problem is interpretation and continuity. A nurse may need to know what changed overnight, what has not been reviewed, what information is missing, what previous interventions happened, and whether the patient journey is moving in a safe direction.

SafeFlow therefore starts with simulation: create fictional patient journeys, show structured review cues, make the safety boundary visible, and invite clinicians, educators and digital teams to review whether the workflow is useful before any real-world pathway is discussed.

## 3. Current product status

SafeFlow currently sits at public simulation preview readiness rather than live clinical readiness.

Completed work includes the simulation signal foundation, workspace signal snapshot storage, App wiring, patient-panel review cues, presentation mode, exportable simulation report work, stakeholder demo pack documentation, and clinical-safety/information-governance readiness notes.

Recent project control records indicate that PR/release work exists around a public simulation preview, with CI passing in the last known status, but merge status should be re-confirmed before any new release statement is made.

The project is now mature enough to present as a controlled prototype, but not mature enough to describe as a deployed clinical product.

## 4. Current capabilities

SafeFlow can currently be explained through five capability groups:

1. Simulation workspace: a controlled environment using fictional patients and fictional events.

2. Patient panel: a patient-focused view that shows relevant simulation information and review cues.

3. Review cues: human-review prompts that surface possible areas to check without making clinical decisions.

4. Presentation mode: a cleaner, projector-friendly interface for stakeholder demonstration.

5. Exportable simulation report: a route to capture the learning or review output from a simulated scenario.

These capabilities are important because they create a bridge between a nursing safety problem and a buildable digital prototype without crossing into unsafe live-clinical claims.

## 5. Patient Journey Twin concept

A central future concept is the Patient Journey Twin, also referred to in the prototype boundary as a Simulation Patient Twin.

This should not be framed as a real-time diagnostic twin at this stage. Instead, it is a structured simulation timeline of a patient journey: observations, documentation events, interventions, handovers, review cues, discharge-related risks and learning prompts.

In a mature simulation, the Patient Journey Twin could help users ask: What changed? What was missed? What information would a nurse need at this point? What did a similar simulated pathway show? What should be reviewed by a human? This is valuable for education, scenario testing, documentation training and stakeholder engagement.

## 6. Safety and governance boundary

SafeFlow must continue to make its boundary visible in the app, documents and presentations.

Current boundary: simulation only; fictional data only; no live NHS integration; no direct care use; no automated diagnosis; no automated prescribing; no autonomous escalation; human review required for all cues.

The safest wording is: SafeFlow surfaces simulation review cues for human consideration. It does not tell staff what to do clinically.

Before any movement toward live clinical use, the project would require formal clinical safety work, information governance review, data protection impact assessment, DPIA, role-based access control, audit logging, cybersecurity review, model risk management, clinical validation, and local trust approval.

## 7. Technical direction

The preferred technical direction discussed for SafeFlow is a minimal, customisable front end with a tokenised backend and an AWS-oriented architecture.

Future architecture could include a React-style front end, secure API layer, structured simulation data model, AWS Aurora for relational storage, Step Functions for controlled workflow orchestration, audit/event logging, and a carefully bounded LLM or AWS Bedrock layer for simulation text generation and explanation.

At the current stage, AWS deployment should remain guarded. The deployment safety control remains important: no live deployment unless explicitly approved and no real patient data is introduced.

The next technical step should be a mock AWS architecture diagram and local simulation backend rather than immediate production infrastructure.

## 8. Product audience

SafeFlow has several early audiences:

1. Nursing educators: to show documentation safety, handover quality and digital literacy scenarios.

2. Ward and day-unit nurses: to test whether patient journey views reduce cognitive load.

3. Clinical safety and digital teams: to review governance, risk and feasibility before live use.

4. NHS stakeholders: to understand how nursing-led digital innovation can be prototyped safely.

5. Students and newly qualified nurses: to learn how structured documentation and review cues support safer care.

## 9. Demonstration flow

A safe stakeholder demonstration should follow this sequence:

1. Open with the simulation-only banner and explain that the data is fictional.

2. Show the patient workspace and how the patient journey is organised.

3. Open the patient panel and explain review cues as human prompts, not decisions.

4. Demonstrate presentation mode for a simplified view.

5. Generate or show an exportable simulation report.

6. Close by explaining the roadmap, governance gates and what feedback is needed from clinicians, educators and digital teams.

## 10. Current control board summary

Done: simulation boundary, simulation signal foundation, patient-panel review cues, presentation mode, build/test validation, stakeholder demo pack, clinical-safety/IG readiness documentation, exportable report work and public-demo positioning.

In progress: Patient Journey Twin concept, final demo polish, AWS architecture mock, alignment between app, white paper and slide deck, Romanian five-minute read, and release/PR confirmation.

Backlog: export report refinement, version 2 NHS-realistic screen concept, slide-by-slide pitch, master white paper, AWS mock layer, evaluation framework, simulation patient timeline, audit event log and educator feedback model.

Blockers and risks: scope creep, live-clinical language, unclear merge status, AWS cost/deploy risk, documentation divergence and accidental use of real patient data.

## 11. Roadmap

Phase 1 - Control and consolidation: create a repository-level CONTROL.md, align all documents, confirm PR/release status and preserve the simulation-only wording.

Phase 2 - Demonstration polish: improve the demo journey, finalise the exportable simulation report and create a clean slide deck.

Phase 3 - Patient Journey Twin: build a simulation timeline that connects observations, events, cues and learning prompts.

Phase 4 - Architecture mock: design the AWS-oriented backend safely using mocked services and fictional data.

Phase 5 - Evaluation: test the prototype with nurses, educators and digital stakeholders using usability, safety and learning-value questions.

Phase 6 - Governance gateway: only after evidence and approvals, decide whether the project remains educational or moves toward a controlled clinical safety case.

## 12. How to access everything

Use three access points: this ChatGPT export pack, the local project repository and the repository documentation folder.

In this chat, keep the control export and this white paper as the baseline documents. Download them and store them with the project materials.

In the local repository, the likely project root used so far is C:\Users\oli\Documents\wardsafe. Open this folder in VS Code or Codex. From there, check git status, recent commits, branches and pull requests before starting new work.

Repository documentation already referenced in the project includes docs/public-demo-pack/stakeholder-demo-pack.md and docs/public-demo-pack/build-readiness/clinical-safety-ig-readiness.md. These should sit alongside the control export and this white paper.

Recommended repository command sequence: git status --short; git branch --show-current; git log --oneline -10; git diff --check. These commands help confirm whether the working tree is clean, which branch is active and whether there are formatting issues before continuing.

Recommended file structure going forward: CONTROL.md at repository root; docs/public-demo-pack for stakeholder-facing material; docs/public-demo-pack/build-readiness for safety, IG and deployment readiness notes; docs/product for the white paper and product specification; docs/presentations for slide scripts and presentation material.

## 13. Recommended next actions

1. Add the control export into the repository as CONTROL.md or SAFEFLOW_CONTROL.md.

2. Add this white paper into docs/product/ as the current product baseline.

3. Re-confirm whether PR #6 has been merged and whether the branch is clean.

4. Align the stakeholder demo pack, clinical-safety/IG readiness note, presentation script and white paper so they all describe the same product boundary.

5. Choose one next build item only: export report polish, Patient Journey Twin UI, or AWS mock architecture.

6. Keep all future work linked to a control-board task ID so nothing gets lost across chats.

## Appendix A - Suggested repo control file starter

Title: SafeFlow Control Board

Sections: Current status; Completed work; In progress; Backlog; Risks and controls; Decisions; Branch/PR status; Next actions; Evidence links.

Every new item should include an ID, status, owner if known, area, short description, evidence and next action.

Suggested statuses: Done, In progress, Ready, Blocked, Backlog.
