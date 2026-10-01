# HSSIB / Francis / Berwick: findings note (SF-274)

Scoped research task from `evidence-horizon-scan.md` priority item 5: "HSSIB deterioration
reports + Francis/Berwick citations - demo-pack narrative anchors." Purpose: ground SafeFlow's
practice areas in the UK's own statutory patient-safety inquiry record, not just academic
literature, and add citable anchors to the demo pack narrative.

## Key sources found

1. Health Services Safety Investigations Body (2024). "Recognising and responding to critically
   unwell patients": investigation report. Published 31 July 2024. -
   https://www.hssib.org.uk/patient-safety-investigations/recognising-and-responding-to-critically-unwell-patients/investigation-report/
2. Francis, R. (2013). Report of the Mid Staffordshire NHS Foundation Trust Public Inquiry.
   Published 6 February 2013. -
   https://www.gov.uk/government/publications/report-of-the-mid-staffordshire-nhs-foundation-trust-public-inquiry
3. National Advisory Group on the Safety of Patients in England / Berwick, D. (2013). "A promise
   to learn - a commitment to act: improving the safety of patients in England." Published
   6 August 2013. - https://www.gov.uk/government/publications/berwick-review-into-patient-safety

Both gov.uk pages and the HSSIB report page were fetched directly and confirmed live before citing.

## What the sources say, relevant to SafeFlow

- HSSIB's 2024 national investigation found that **between 5% and 26% of incidents resulting in
  severe harm or death involve patient deterioration that was not sufficiently recognised or
  responded to** - a current, authoritative, scale-of-problem statistic that directly frames why
  deterioration-recognition practice (SafeFlow's central simulation activity) matters.
- That investigation specifically examined the human factors influencing recognition and response
  to critically unwell patients, not just the scoring tools themselves. This backs SafeFlow's
  design choice to pair a displayed score with reflective, human-factors content (bias-awareness
  cues, the PACE ladder, PEARLS debrief) rather than treating a NEWS2-style number as sufficient
  on its own.
- The Francis Report (Mid Staffordshire, 2013) found that warning signs of deteriorating care went
  unpicked-up, staff generally remained passive rather than escalating concerns, and organisations
  were poor at listening to concerns raised by patients, families, and staff. This is the
  historical grounding for two things SafeFlow already builds: the family-concern / Martha's-Rule
  scenario (SF-265) and the PACE graded-assertiveness speak-up ladder (SF-268) - both rehearse
  exactly the noticing-and-raising-a-concern behaviour Francis found was missing.
- The Berwick Report (2013) recommended moving away from a blame culture, treating quantitative
  targets with caution, and giving staff career-long support to learn quality-improvement methods,
  plus fostering pride in work rather than fear. This grounds several existing SafeFlow choices:
  the explicit no-staff-scoring boundary, the "same score, different system" comparison panel
  (SF-264, which teaches that a score is a published convention rather than an infallible verdict),
  and the Safety-II "what went well" reflective panel (SF-269, a direct expression of the
  pride-in-work / anti-blame recommendation).

## Decision: docs-only narrative anchors, no new scenario

This does not call for a new interactive scenario. The practical mechanisms these three reports
point to - recognising deterioration, speaking up, avoiding blame, not over-trusting a single
score - are already built as SF-260/262/264/265/268/269. What was missing was the explicit
evidentiary anchor explaining *why* those design choices exist, grounded in the UK's own inquiry
record rather than academic literature alone.

Built as SF-274: a new "Pillar 4" in `evidence-base-references.md` (same citation format as
Pillars 1-3) and a short, carefully-hedged "Why this matters" paragraph in `master-narrative.md`'s
One Page section. Both are explicit that SafeFlow does not claim to have prevented or solved any
finding in these reports - only that they are the documented reason the simulated practice areas
exist. No code changes; no new CI surface.
