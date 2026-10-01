# SafeFlow — Evidence Base and Supporting Literature

Status: simulation-only prototype. Fictional patients only. Not for clinical use. Human review required.

This document maps SafeFlow's design claims to peer-reviewed literature. It exists so that
the prototype's framing — a simulation-only, nurse-led, review-support teaching tool that never
replaces clinical judgement — can be defended against published evidence rather than assertion.

Every claim below is a claim about *why the concept is worth simulating and teaching*, not a
claim that SafeFlow itself has been clinically validated. SafeFlow has not been used on real
patients and makes no diagnostic, prescribing, or automated-escalation decisions.

## How this list was assembled

Sources were located through two routes, both recorded here for reproducibility:

- **RCN Library (Royal College of Nursing)** — searched via WorldCat Discovery (`rcn.on.worldcat.org`).
  Full text of every RCN-listed item below is available to RCN members. This is the primary source
  for the nursing-education and simulation-learning evidence.
- **Open-access journals** — for the interoperability / shared-record and early-warning-score
  validation items, which sit outside the RCN nursing collection. These are freely available to anyone.

A note on access: the University of East Anglia (UEA) LibrarySearch (EBSCO Discovery) indexes the
same nursing items, but full-text access via UEA OpenAthens was blocked for this account under the
institution's restrictive-mode permission set (OpenAthens error OA-AP-4032-01). The RCN membership
route provides the full text instead. This is an access-routing note only and has no bearing on the
evidence itself.

## Pillar 1 — Early warning scores support human review; they do not replace it

SafeFlow surfaces review cues, never a verdict. The evidence base is explicit that NEWS2 and
automated deterioration alerts are aids to a nurse's judgement, and are inadequate on their own.

- **Chua, W.L., Wee, L.C., Lim, J.Y.G., et al. (2023).** Automated rapid response system
  activation — Impact on nurses' attitudes and perceptions towards recognising and responding to
  clinical deterioration: Mixed-methods study. *Journal of Clinical Nursing*, 32(17–18), 6322–6338.
  *(RCN Library — full text; also indexed UEA. DOI: 10.1111/jocn.16734.)*
  Backs: automated alerts are valued as a "safety net" but "NEWS2 alone is inadequate"; nurses remain
  the essential human check and comprehensive assessment is not replaced by a score. This is the single
  strongest citation for SafeFlow's review-support-not-autonomous-decision posture.

- **Alhmoud, B., Bonnici, T., Melley, D., et al. (2023).** Performance of digital early warning
  score (NEWS2) in a cardiac specialist setting: retrospective cohort study. *BMJ Open*, 13(3),
  e066131. *(Open access. DOI: 10.1136/bmjopen-2022-066131.)*
  Backs: an EHR-integrated NEWS2 showed only moderate-to-low predictive accuracy, so a displayed score
  must be treated as a prompt for human review, not a reliable standalone predictor.

- **Huespe, I.A., Bisso, I.C., Roman, E.S., et al. (2021).** Multicenter validation of Early
  Warning Scores for detection of clinical deterioration. *Medicina Intensiva*, 47(1), 9–15.
  *(Free via PubMed Central. DOI: 10.1016/j.medin.2021.11.002.)*
  Backs: EWS discrimination varies by setting and endpoint — grounds SafeFlow's cautious,
  context-dependent framing of any deterioration cue.

## Pillar 2 — Simulation-based learning improves recognition of the deteriorating patient

SafeFlow is a simulation and teaching tool. The evidence base shows simulation is an established,
effective method for building exactly the recognise-and-respond competence SafeFlow rehearses — and
that purpose-built simulation *games/tools* are a legitimate design direction.

- **Liaw, S.Y., Rusli, K.D.B., Tan, J.Z., et al. (2025).** Artificial intelligence-enabled virtual
  reality simulation for clinical deterioration training: An effectiveness-implementation hybrid
  study. *Nurse Education in Practice*, 87, 104462. *(RCN Library — full text.)*
  Backs: a 2025 controlled study of the same core concept as SafeFlow — a computer-based simulation
  for training graduating nurses to recognise and respond to deterioration — including honest findings
  on usability and the need to improve AI-human interaction. The closest published analogue to what
  SafeFlow simulates.

- **Bliss, M. & Aitken, L.M. (2018).** Does simulation enhance nurses' ability to assess
  deteriorating patients? *Nurse Education in Practice*, 28, 20–26. *(RCN Library — full text.)*
  Backs: nurses perceive scenario-based simulation improves their deterioration-assessment skill and
  that learning transfers to clinical practice.

- **Chua, W.L. (2017).** Simulation training appears to improve nurses' ability to recognise and
  manage clinical deterioration. *Evidence-Based Nursing*, 20(4), 122. *(RCN Library — full text.)*
  Backs: systematic-review-level evidence for simulation's effect; also references standardised tools
  (ABCDE, SBAR, the RAPIDS evaluation tool) that inform SafeFlow's review-cue vocabulary. Notes the
  gap that few studies measure transfer to real patient outcomes — a gap SafeFlow explicitly stays on
  the safe side of by remaining simulation-only.

- **Koivisto, J-M., Haavisto, E., Niemi, H., et al. (2018).** Design principles for simulation games
  for learning clinical reasoning: A design-based research approach. *Nurse Education Today*, 60,
  114–120. *(RCN Library — full text.)*
  Backs: design-rationale citation for building SafeFlow as a learning simulation with clinical-reasoning
  objectives, and for involving educators in the design process.

- **Dwyer, T., Reid Searl, K., McAllister, M., et al. (2015).** Advanced life simulation:
  High-fidelity simulation without the high technology. *Nurse Education in Practice*, 15(6), 430–436.
  *(RCN Library — full text.)*
  Backs: low-cost, portable simulation is a viable route to deterioration/resuscitation training —
  supports SafeFlow's accessibility-over-expensive-manikin positioning.

- **Butler, Z.A. (2020).** Implementing the National Early Warning Score 2 into pre-registration
  nurse education. *Nursing Standard*, 35(3), 70–75. *(RCN Library — full text.)*
  Backs: NEWS2 used deliberately as an *educational* tool for pre-registration nurses — direct support
  for SafeFlow teaching NEWS2-style review in a training context rather than a live clinical one.

## Pillar 3 — Cross-organisation continuity should align with existing records, not replace them

SafeFlow's portable cross-trust journey and longitudinal-record concepts take the posture of
*aligning with* existing NHS interoperability (Shared Care Record / GP Connect), never becoming a
competing source of truth. The evidence base supports both the value of cross-setting continuity and
the need to build it on standards-based interoperability.

- **Steele, R. & Aird, T. (2025).** A Provincial Interoperability Journey to Streamline Resident
  Transitions and Improve Integrated Care between Hospital & Long-Term Care. *International Journal
  of Integrated Care*, 25 (Special Issue), 7. *(Open access.)*
  Backs: the value of interoperable, cross-setting continuity of care as a patient moves between
  organisations — the real-world analogue of SafeFlow's portable-journey concept.

- **Lin, A.Y., Arabandi, S., Beale, T., et al. (2023).** Improving the Quality and Utility of
  Electronic Health Record Data through Ontologies. *Standards*, 3(3), 316–340.
  *(Open access. DOI: 10.3390/standards3030023.)*
  Backs: interoperability and continuity depend on standards-based, computable data — supports
  SafeFlow's "align with and read from existing records" position rather than building a parallel store.

## Pillar 4 — The statutory inquiry record explains why this matters

SafeFlow's practice areas are not arbitrary. Three UK statutory or national investigation reports,
spanning 2013 to 2024, document the recurring, real-world failure modes that structured review
support, human-factors debrief, and a non-blame culture are meant to rehearse against. None of the
following validates SafeFlow itself; they explain why the underlying skills are worth simulating.

- **Health Services Safety Investigations Body (2024).** Recognising and responding to critically
  unwell patients: investigation report. HSSIB, published 31 July 2024. *(Open access.)*
  https://www.hssib.org.uk/patient-safety-investigations/recognising-and-responding-to-critically-unwell-patients/investigation-report/
  Backs: a current, national investigation finding that between 5% and 26% of incidents resulting
  in severe harm or death involve patient deterioration that was not sufficiently recognised or
  responded to, and that human factors - not just scoring tools - drive this gap. Direct rationale
  for SafeFlow's reflective, human-factors-aware review-cue design (bias-awareness, PACE, PEARLS)
  rather than a bare score.

- **Francis, R. (2013).** Report of the Mid Staffordshire NHS Foundation Trust Public Inquiry.
  The Stationery Office, published 6 February 2013. *(Open access, gov.uk.)*
  https://www.gov.uk/government/publications/report-of-the-mid-staffordshire-nhs-foundation-trust-public-inquiry
  Backs: found that warning signs of deteriorating care went unpicked-up, staff generally remained
  passive rather than escalating, and organisations were poor at listening to concerns raised by
  patients, families, and staff - the historical grounding for SafeFlow's family-concern /
  Martha's-Rule scenario and the PACE graded-assertiveness speak-up ladder.

- **National Advisory Group on the Safety of Patients in England / Berwick, D. (2013).** A promise
  to learn - a commitment to act: improving the safety of patients in England. Department of
  Health, published 6 August 2013. *(Open access, gov.uk.)*
  https://www.gov.uk/government/publications/berwick-review-into-patient-safety
  Backs: recommended abandoning blame culture, using quantitative targets with caution, and
  fostering pride and joy in work rather than fear - grounds SafeFlow's explicit no-staff-scoring
  boundary, the "same score, different system" comparison panel, and the Safety-II "what went
  well" reflective panel.

## What is NOT claimed

None of the above validates SafeFlow clinically. Specifically:

- No cited study used SafeFlow. The literature supports the *concept* (EWS as review-support,
  simulation as effective teaching, interoperable continuity as valuable), not this implementation.
- SafeFlow makes no diagnosis, prescribes nothing, escalates nothing automatically, and scores no
  real staff or patients. All patients in the prototype are fictional and generated.
- A live version would require the information-governance, DPIA, and clinical-safety-case work already
  logged in `ig-checklist.md`, `clinical-safety-ig-readiness.md`, `portable-patient-journey-concept.md`,
  and `longitudinal-record-boundary.md`. This evidence base does not shortcut any of that.

## Access routes for the full text

- RCN-Library items: search the title at `rcn.on.worldcat.org` while signed in as an RCN member;
  each listed item shows "View full text" / "View PDF".
- Open-access items: freely available from the publisher (BMJ Open, MDPI *Standards*, IJIC) or via
  PubMed Central (Medicina Intensiva).
- The two practice pieces indexed only through paywalled routes (e.g. the *Nursing Standard* /
  *Nursing Older People* practice guidance by Dean, 2026) require either RCN full text or UEA EBSCO
  access once the UEA OpenAthens permission block is lifted.
