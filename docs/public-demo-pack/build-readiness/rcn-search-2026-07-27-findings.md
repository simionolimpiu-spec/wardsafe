# RCN library search, 27 July 2026 — findings note

Scoped literature search run against the RCN Library (WorldCat Discovery, `rcn.on.worldcat.org`)
to test a hunch that SafeFlow's evidence base was missing something. It was. This note summarises
what was found and what it means.

## Method, and an honest limitation

Three searches were run, filtered to peer-reviewed articles and chapters:

1. `"failure to rescue" nursing deterioration` — 52 results
2. `"missed nursing care" OR "care left undone" surveillance` — 51 results
3. `nurse worry intuition deteriorating patient` — 7 results

A fourth search on SBAR and structured handover did not return before the discovery layer stopped
responding. It is listed as outstanding at the end of this note.

**Limitation, stated plainly: these summaries are written from the abstracts shown in the RCN
discovery layer, not from the full texts.** Every item below is marked as available to RCN members,
and several as open access, but none was read in full. Before any of these is quoted in a
stakeholder document, the full text should be retrieved and the claim checked against it. Abstracts
routinely overstate; that is exactly the failure mode this project has been careful about elsewhere.

## Why this matters: the gap these searches exposed

SafeFlow's evidence base (`evidence-base-references.md`) had four pillars: early warning scores as
review support, simulation as effective teaching, interoperability, and the statutory inquiry
record. Those cover *the tool* and *the training method* well.

What was missing was the **nursing-safety concept literature that names the failure SafeFlow is
rehearsing against**. "Failure to rescue" is the established term for it, and it did not appear
anywhere in the project. Nor did "missed nursing care", despite SafeFlow's central surface being a
review cue that says what is missing. Nor did the nurse-worry/intuition literature, despite the
product already shipping a "worried" criterion scenario and a family-concern scenario.

That is a real hole, and it is the kind that a nursing academic or a clinical safety reviewer would
notice immediately.

## Cluster A — Failure to rescue

The concept that links deterioration recognition to mortality. This is the missing spine.

**Mushta J, Rush KL, Andersen E (2018).** Failure to rescue as a nurse-sensitive indicator.
*Nursing Forum* 53(1): 84–92. Peer-reviewed.
Concept analysis using Walker and Avant's eight-stage method over 21 papers. Finds "failing to
rescue" is a *cascade*, with four attributes: (1) errors of omission in care, (2) failure to
recognise changes in patient condition, (3) failure to communicate changes, (4) failures in
clinical decision making. Recommends upstream strategies — early warning indicators, structured
communication, teamwork — and reframing toward "good catch" events.
**This is the single most useful citation found.** Those four attributes map almost one-to-one onto
what SafeFlow rehearses, and the "good catch" reframing is independent support for the Safety-II
panel built in SF-269.

**Klenke-Borgmann L, Lineberry M, Broski J (2023).** Integrative literature review on cognitive
science to reconsider failure to rescue in nursing: a call to action.
*Journal of Continuing Education in Nursing* 54(6): 253–260. Peer-reviewed.
Reviews 15 articles through the cognitive resource theory of vigilance. Opens with: when workload
demands exceed nurses' cognitive capacity, tasks critical to early detection get omitted. Four
themes: clinical judgment and FTR; implicit reference to vigilance theory; **benefits of
simulation-based education**; caregiver fatigue.
Direct support for two SafeFlow choices at once — the M6 cognitive-load measure in the evaluation
framework, and simulation as the training method. Argues cognitive science has been overlooked in
FTR research, which is a defensible niche for a simulation tool to occupy.

**Roney JK, Whitley BE, Maples JC, Futrell LS, Stunkard KA, Long JD (2015).** Modified early
warning scoring (MEWS): evaluating the evidence for tool inclusion of sepsis screening criteria and
impact on mortality and failure to rescue. *Journal of Clinical Nursing* 24(23–24): 3343–3354.
Review of 18 articles. Concludes that while MEWS tools are widely adopted and recommended, there
is **limited high-level data and no clinical trials** linking MEWS use to robust outcomes.
An honesty citation, in the same family as the existing Pillar 1 sources. Strengthens SafeFlow's
refusal to claim the score is a verdict, and pairs naturally with the SF-264 "same score, different
system" panel.

**Herron EK (2018).** New graduate nurses' preparation for recognition and prevention of failure to
rescue: a qualitative study. *Journal of Clinical Nursing* 27(1–2): e390–e401.
Phenomenological study, 14 new graduates, south-eastern USA. Five themes: clinical preparation in
school; experience with emergent situations; development of clinical reasoning; **low confidence as
a new graduate**; responding to emergencies. Notes many nurses graduate without the clinical
reasoning needed, and that experiential learning plus educator collaboration helps.
Supports both the student/NQN audience and the SF-272 new-to-service panel.

**Parker C (2024).** The connection between caring, knowing and preventing failure to rescue in
nursing. *International Journal of Caring Sciences* 17(1): 77–85.
Cross-sectional correlational study, 166 acute-care RNs, using the Manifestations of Early
Recognition (MER) instrument. Significant positive correlation (r = .402, p = .0120) between MER
score and number of RRT activations. Notes RNs do not always activate RRT when they should, and
that increased RRT call frequency has lowered mortality.
Useful because it treats *recognition skill* as measurable and trainable — which is what SafeFlow
claims to rehearse. The MER instrument may be worth examining for the evaluation framework.

**McHale S, Marufu TC, Manning JC, Taylor N (2023).** Reducing failure to rescue rates in a
paediatric in-patient setting: a 9-year quality improvement study.
*Nursing in Critical Care* 28(1): 72–79.
170,446 admissions, 520 emergency events reviewed 2011–2019. FTR fell from 23.6% to ≤2.5% and
stayed there for eight years. Root-cause analysis plus PDSA.
Evidence that FTR is *modifiable* through targeted intervention. Paediatric and not directly
transferable, but the sustained-improvement curve is a strong illustrative anchor.

**Schubert CR (2012).** Effect of simulation on nursing knowledge and critical thinking in failure
to rescue events. *Journal of Continuing Education in Nursing* 43(10): 467–471.
Medical-surgical nurses ran a simulated rapid-deterioration event; knowledge and critical thinking
improved afterwards. Frames the failure triad as vigilance (accurate assessment), surveillance
(detecting change), and recognition (knowing something is wrong).
Older and small, but it is simulation applied specifically to FTR, which is precisely SafeFlow's
combination. The vigilance/surveillance/recognition triad is good vocabulary for the demo pack.

**Elder E, Muir R (2025).** Failure to rescue: optimising nursing assessment and surveillance has
the potential to improve outcomes for deteriorating patients with multimorbidity.
*Evidence Based Nursing* 28(4): 171. (Also an earlier 2024 record, ebnurs-2024-104029.)
Commentary on assessment and surveillance for multimorbid deteriorating patients. Current, and
relevant to the frailty/multimorbidity cohort SafeFlow's fictional wards include.

**Waldie J, Tee S, Day T (2016).** Reducing avoidable deaths from failure to rescue: a discussion
paper. *British Journal of Nursing* 25(16): 895–900.
Proposes an approach to service monitoring, governance, and nurse education/training to meet FTR
requirements. UK-based, which matters for NHS framing.

## Cluster B — Missed nursing care

Relevant because SafeFlow's core surface is a cue that says *what is missing*. This literature
establishes what actually gets missed, and why.

**Cho S-H, Kim Y-S, Yeon KN, You S-J, Lee ID (2015).** Effects of increasing nurse staffing on
missed nursing care. *International Nursing Review* 62(2): 267–274.
Compared high-staffing (7 patients/nurse) with low-staffing (17 patients/nurse) units using the
MISSCARE survey; 232 nurses, high response rates. Missed care was significantly lower in
high-staffing units. Critically, **"patient assessments in each shift" was one of seven elements
missed significantly more often** under low staffing. Concludes less omission is expected to
improve nursing surveillance.
This is the mechanism linking staffing to surveillance failure, and it complements Aiken 2016
already cited in the SF-263 staffing panel. It also reinforces the honesty framing: if assessment
itself is being missed for staffing reasons, no review tool fixes that.

**Avanoğlu E, Calikusu Incekar M (2025).** Missed nursing care of nurses in neonatal intensive care
units during COVID-19: a cross-sectional descriptive study.
*Comprehensive Child and Adolescent Nursing* 48(1): 60–70.
182 nurses, seven Istanbul hospitals. The top three missed items included **"full documentation of
all necessary data"** and **"communication of all relevant information during shift change or
handover"** — reported by 179 of 182 (98.35%). The highest-scoring reason category was
communication.
Striking for SafeFlow: documentation completeness and handover communication are not peripheral,
they are among the most commonly missed activities. Neonatal ICU and pandemic-era, so generalise
cautiously, but the signal is directly on SafeFlow's problem statement.

**Kiekkas P, Tsekoura V, Fligou F, Tzenalis A, Michalopoulos E, Voyagis G (2021).** Missed nursing
care in the postanesthesia care unit: a cross-sectional study.
*Journal of PeriAnesthesia Nursing* 36(3): 232–237.
397 questionnaires, 19 PACU nurses. Missed-care prevalence 78.1%, higher with ICU overflow
patients. **"Patient surveillance and assessment" was among the top three missed activities.** Top
reasons: inadequate staffing, unexpected rise in volume or acuity, heavy admission/discharge
activity.
Second independent finding that surveillance and assessment are what gets dropped under pressure.

**Gillespie BM, Harbeck E, Chaboyer W (2025).** The frequency and reasons for missed nursing care
in Australian perioperative nurses: a national survey.
*Journal of Clinical Nursing* 34(3): 883–893.
612 perioperative nurses. Most-missed tasks were time-intensive ones and communication with
multiple team members present. Reasons were staffing-related — number, skill mix, fatigue,
complacency — and affected teamwork. Concludes much missed care in theatre relates to communication
practices, with patient-safety implications.

**Santana LTV, Pollo CF, de Morais JF, et al. (2025).** Association between the practice
environment and missed nursing care in the emergency room.
*International Emergency Nursing* 80.
102 ER nursing staff, São Paulo. Unfavourable practice environment was associated with missed care;
omissions independently associated with workload, extra hours, patient numbers, discharges.
Reinforces that missed care is an environment and workload phenomenon, not an individual failing —
which is the correct, non-blaming framing for SafeFlow to keep.

**Pourshaban M, Hasankhani H (2025).** What is 'missed nursing care' during an emerging infectious
disease? A concept analysis. *Nursing Open* 12(11): e70216.
Walker and Avant concept analysis for the pandemic context. Notes MNC is universally used as a
quality-of-care indicator but lacks precise dimensional definition in that setting.
Useful mainly as evidence that MNC is an established quality indicator; the pandemic scoping limits
wider use. A related scoping review by Pourshaban, Allahbakhshian and Purabdollah (2025, *Journal
of Nursing Management*) maps contributing factors across countries.

## Cluster C — Nurse worry and intuition

The strongest cluster for SafeFlow's central design claim, and the one whose absence was most
surprising given the product already ships a "worried" criterion scenario.

**Haegdorens F, Wils C, Franck E (2023).** Predicting patient deterioration by nurse intuition: the
development and validation of the Nurse Intuition Patient Deterioration Scale (NIPDS).
*International Journal of Nursing Studies* 142. Peer-reviewed.
Prospective observational study across two surgical and two medical wards in a Belgian hospital.
Scale developed with an expert panel, optimised with Rasch modelling; scale-level content validity
index 0.88, Person Separation Index 0.814. **AUROC 0.957 (95% CI 0.932–0.982, p < 0.001)** for
predicting urgent physician call, resuscitation call, death, or unplanned transfer within 24 hours.
Outperformed an existing nurse-intuition score.
The introduction is as valuable as the result: early warning scores "tend to generate many false
positives leading to an increased workload", and **"nurses feel a tension between the application
of an early warning score and their own clinical judgement."** That sentence is close to a
one-line statement of why SafeFlow exists. This is the highest-quality single citation in the whole
search.

**Gentil LLS, Nascimento MS, Jaures M, de Carvalho LP, Laselva CR, Brandi S (2025).** Nurse worry
as a trigger for rapid response team activation improving outcomes: a retrospective cohort study in
non-critical units. *BMC Nursing* 24(1). Peer-reviewed, **open access**.
4,634 RRT consultations, Jan 2021 – Dec 2022. 1,574 triggered by vital-sign changes alone, 1,263 by
**nurse worry alone**, 1,797 by both. The nurse-worry group had a significantly lower subsequent
ICU-transfer rate (40% vs 50%, p < 0.001), with no difference in need for procedures. Authors are
appropriately careful: observational design, no causal claim.
Two things matter here. First, worry alone accounted for over a quarter of activations — it is not
a fringe criterion. Second, worry-triggered calls appear to happen earlier. Open access, so
immediately usable.

**Byrne A-L, Massey D, Flenady T, Connor J, Chua WL, Le Lagadec D (2025).** When nurses worry: a
concept analysis of intuition in clinical deterioration.
*Journal of Advanced Nursing* 81(8): 4566–4583. Peer-reviewed.
Concept analysis addressing the fact that nurse worry is widely embedded as an escalation criterion
in early warning tools, yet "what it means to worry is not always clear".
Directly relevant: SafeFlow teaches a worry-based criterion, so it should cite the paper
interrogating what that criterion actually means. Note Wei Ling Chua is a co-author and already
appears twice in the existing evidence base — a coherent thread rather than a scattered one.

**Robben N, Dierick-van Daele ATM, Bouwman ARA, van Loon FHJ (2024).** Worry as important
"feelers" in clinical anesthesia practice: a mixed-methods study.
*Journal of PeriAnesthesia Nursing* 39(6): 964–970. Peer-reviewed, **open access**.
102 surveys plus 14 focus-group participants, Dutch nurse anaesthetists. 89% had experienced worry;
92% use it in practice. No clear definition emerged, but worry acted as a catalyst for critical
thinking and clinical reasoning. Concludes that technology has improved detection, but **it is
crucial to use worry and intuition alongside technological systems**, not instead of them.
That conclusion is almost a restatement of SafeFlow's boundary, arrived at independently.

**Bishop AC, Cregan BR (2015).** Patient safety culture: finding meaning in patient experiences.
*International Journal of Health Care Quality Assurance* 28(6): 595–610.
Thematic analysis of 11 patient/family adverse-event narratives from the Canadian Patient Safety
Institute. Three themes: **Being Passed Around**, **Not Having the Conversation**, and **the Person
Behind the Patient**. Argues patient narratives are an underused source for understanding safety
culture.
Adjacent to the search but genuinely relevant to the SF-265 family-concern scenario, and "Being
Passed Around" speaks to the cross-trust continuity concept.

## What should follow from this

1. **A fifth pillar in `evidence-base-references.md` on failure to rescue, missed care and nurse
   worry** is justified. It would be the pillar that names the problem, where the existing four
   describe the tool, the method, the plumbing and the inquiry record.
2. **Mushta 2018's four attributes deserve to be visible in the narrative**, because they organise
   what SafeFlow already does into a recognised framework rather than a bespoke one.
3. **Haegdorens 2023 belongs in Pillar 1** alongside the existing early-warning-score citations —
   the tension between score and judgement is the sharpest external statement of SafeFlow's premise
   found so far.
4. **Do not overreach.** None of this validates SafeFlow. It establishes that the failure modes
   SafeFlow simulates are named, measured and taken seriously in the nursing literature. That is a
   claim about the problem, not about the product, and the existing "What is NOT claimed" section
   must continue to say so.
5. **Retrieve full texts before quoting.** See the limitation at the top of this note.

## Outstanding

- The SBAR / structured-handover search did not complete. This matters more than the others,
  because M1 in the evaluation framework — the primary before/after measure — is an SBAR checklist
  score, and the framework does not currently cite evidence for SBAR itself. That should be closed
  before the first evaluation session.
- Also unsearched: cognitive load measurement instruments in nursing (relevant to M6), and
  technology-acceptance or implementation-science frameworks such as NASSS (relevant to any future
  adoption claim).
