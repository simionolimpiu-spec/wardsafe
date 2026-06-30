# SafeFlow Stakeholder Feedback Synthesis

## Review Context

This synthesis captures stakeholder feedback from SafeFlow public simulation preview demo and review sessions. The preview is simulation-only, uses fictional workflows, and remains focused on workflow discovery rather than clinical validation.

Signals and risk suggestions remain placeholder-backed.

This preview is not clinically validated decision support and must not be used for clinical decision-making.

## Stakeholder Roles Consulted

- Nurse-led workflow reviewers
- CEP / community review participants
- Product and design reviewers
- Digital health / investor discovery reviewers
- Internal governance and delivery reviewers

## Workflow Realism Feedback

- Reviewers generally understood the flow from handover to discharge readiness, then through signals, escalation, and audit.
- One reviewer noted that the handover/discharge path felt familiar, but wanted the ownership handoff to be slightly more explicit.
- One reviewer asked for a clearer distinction between workflow cues and any future decision-support layer.
- One reviewer felt the demo was strongest when it stayed focused on structured review, not predictive language.

## Most Useful Parts of the Demo

- The landing page framing made the purpose of the preview easy to explain quickly.
- The `What this preview shows` and `What this preview does not show` callouts were useful for keeping the conversation honest.
- The handover/discharge workflow helped reviewers understand how SafeFlow could support ward workflow discovery.
- The readiness surface helped show that the preview is not just a static mockup.
- The provenance labels made placeholder-backed outputs easier to trust as simulation content.
- The audit trail view was useful for explaining learning and governance capture.

## Unsafe, Unclear, or Unrealistic Parts

- One reviewer felt the term `risk suggestion` could sound stronger than the preview intended.
- One reviewer thought `workflow discovery` was clear, but `simulation-safe` needed a short explanation the first time it appeared.
- One reviewer wanted the boundary between simulated cues and any future clinical system to stay visually obvious.
- One reviewer asked whether the audit trail represented a real compliance record; that needed clarification in the demo.

## Missing Information at Handover / Discharge

- One reviewer wanted clearer ownership at the point of handover.
- One reviewer wanted a more explicit next action when discharge readiness is blocked.
- One reviewer asked what information would normally come from the EPR, observations, or labs if this were ever integrated.
- One reviewer wanted the demo to show what information is intentionally absent because this is a simulation preview.

## Integration Concerns

- Several reviewers asked what would need to integrate with existing NHS systems before any future use.
- One reviewer asked where the data would come from in a future connected version.
- One reviewer noted that the preview should not create the impression that integration is already solved.
- One reviewer suggested the terms `placeholder provider` and `simulation-only` should remain visible whenever outputs are shown.

## Governance and Safety Concerns

- Reviewers were comfortable with the explicit safety boundary when it was stated early and repeatedly.
- One reviewer asked for a clearer future path from simulation review to any eventual governance discussion.
- One reviewer wanted the demo to avoid any implication of clinical validation or deployment readiness.
- One reviewer asked how information governance and clinical safety work would be handled if the product moved beyond simulation.

## Language / Copy Concerns

- One reviewer suggested simplifying the phrase `risk suggestion` if it sounds too prescriptive.
- One reviewer preferred `workflow discovery` and `simulation preview` over more product-heavy language.
- One reviewer liked the plain safety statement and wanted it preserved unchanged.
- One reviewer suggested keeping the copy calm and practical rather than sales-driven.

## Pilot Blockers

- No reviewer treated the current preview as ready for pilot or clinical use.
- The placeholder-backed signals and risk suggestions were seen as suitable for demo review, not pilot evidence.
- Reviewers asked for governance, information-governance, validation, and integration planning before any pilot discussion.

## Suggested Changes

- Keep the simulation boundary and safety statement visible in the landing page, demo script, and docs.
- Make ownership and next-action cues slightly clearer in the handover/discharge workflow.
- Keep provenance labels visible wherever simulated outputs appear.
- Prefer calm, plain-language demo copy over predictive or overconfident wording.
- Keep the audit trail framed as workflow learning, not compliance proof.
- Prepare a follow-up path for integration, governance, and future validation without implying readiness now.

## Prioritised Follow-up Plan

### Must Fix Before Wider External Demo

1. Clarify ownership and next action at handover/discharge.
   - Why it matters: reviewers wanted the handoff logic to feel more explicit.
   - Proposed response: tighten labels and helper copy around ownership, blockers, and next step.
   - Priority: high
   - Suggested branch or workstream: `public-demo-polish` follow-up

2. Keep provenance labels visible and easy to scan.
   - Why it matters: this makes placeholder-backed outputs honest and understandable.
   - Proposed response: retain provider/source labels wherever simulated outputs are shown.
   - Priority: high
   - Suggested branch or workstream: `public-demo-polish`

3. Preserve the exact safety statement and simulation framing.
   - Why it matters: the preview must not drift into clinical or deployment claims.
   - Proposed response: lock the statement into the demo script and review pack.
   - Priority: high
   - Suggested branch or workstream: documentation only

### Should Fix Before Pilot Design

1. Review terminology such as `risk suggestion`.
   - Why it matters: language should not imply prescriptive clinical advice.
   - Proposed response: test alternate wording in review copy and demo narration.
   - Priority: medium
   - Suggested branch or workstream: documentation / content review

2. Add clearer explanation of absent data in the simulation preview.
   - Why it matters: reviewers wanted to know what is intentionally not shown.
   - Proposed response: add a short note in demo narration or docs about fictional-only inputs.
   - Priority: medium
   - Suggested branch or workstream: docs

3. Prepare a future integration question list.
   - Why it matters: reviewers asked what would need to connect to NHS systems later.
   - Proposed response: capture integration assumptions and unanswered questions.
   - Priority: medium
   - Suggested branch or workstream: discovery / planning

### Future Pilot / Governance Work

1. Define the governance path before any pilot conversation.
   - Why it matters: reviewers asked for explicit information-governance and clinical-safety planning.
   - Proposed response: separate governance workstream with clear owners.
   - Priority: high
   - Suggested branch or workstream: future governance workstream

2. Plan validation and evidence requirements for any future ML-backed outputs.
   - Why it matters: stakeholders did not see current simulation outputs as validation evidence.
   - Proposed response: treat this as future work only.
   - Priority: medium
   - Suggested branch or workstream: future validation planning

3. Define the integration map for EPR, observations, labs, and notes.
   - Why it matters: reviewers wanted to know what a connected version would need.
   - Proposed response: capture this as an integration feasibility exercise.
   - Priority: medium
   - Suggested branch or workstream: integration feasibility

### Out of Scope for Public Simulation Preview

1. ML-backed risk modelling.
   - Why it matters: it is not part of the current simulation preview.
   - Proposed response: keep it as a later workstream.
   - Priority: low
   - Suggested branch or workstream: future ML/read-model branch

2. Clinical validation claims.
   - Why it matters: the preview must not imply validated clinical performance.
   - Proposed response: keep current language unchanged and explicit.
   - Priority: high
   - Suggested branch or workstream: none; maintain boundary

3. Pilot-readiness claims.
   - Why it matters: the current preview is for discovery, not pilot commitment.
   - Proposed response: do not add pilot language beyond future-planning context.
   - Priority: high
   - Suggested branch or workstream: none; maintain boundary

## Synthesis Summary

Overall, stakeholders responded positively to the clarity of the simulation preview, especially when the demo stayed focused on workflow discovery, provenance, and the safety boundary. The strongest themes were workflow fit, clearer handover ownership, calm and honest wording, and keeping future integration and governance work separate from the current preview.

Signals and risk suggestions remain placeholder-backed.

This preview is not clinically validated decision support and must not be used for clinical decision-making.
