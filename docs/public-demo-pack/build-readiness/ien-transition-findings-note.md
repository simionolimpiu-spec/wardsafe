# IEN transition-to-practice: findings note (SF-270)

Scoped research task from the evidence-horizon-scan.md "IEN-transition RCN search" lead. Purpose: decide whether the internationally-educated-nurse (IEN) transition-to-practice literature yields a buildable SafeFlow feature or stays as background evidence.

## Key sources found

1. Rajpoot et al. 2024, "Transitioning experiences of internationally educated nurses in host countries: A narrative systematic review," *International Journal of Nursing Studies Advances* — https://pmc.ncbi.nlm.nih.gov/articles/PMC11145537/
2. Lanada & Culligan 2024, "The experiences of internationally educated nurses who joined the nursing workforce in England," *British Journal of Nursing* — https://www.britishjournalofnursing.com/content/professional/the-experiences-of-internationally-educated-nurses-who-joined-the-nursing-workforce-in-england
3. Oja-Lipasti et al. 2026, "Internationally educated nurses' experiences of recruitment — an ethical perspective" — https://pmc.ncbi.nlm.nih.gov/articles/PMC12907457/
4. Sheehy et al. 2026, "Safe, Sustainable and Ethical Recruitment of Internationally Qualified Registered Nurses to Australia," *Journal of Advanced Nursing* — https://onlinelibrary.wiley.com/doi/full/10.1111/jan.70114
5. ICN 2025 statement calling for ethical recruitment and investment in domestic training/retention — https://www.icn.ch/news/international-council-nurses-calls-ethical-recruitment-process-address-critical-shortage
6. NHS Employers, "International Retention Toolkit" and "Accelerated preceptorship model for internationally educated nurses" case study — https://www.nhsemployers.org/publications/international-retention-toolkit ; https://www.nhsemployers.org/case-studies/accelerated-preceptorship-model-internationally-educated-nurses
7. NHS England, "NHS Pastoral Care Quality Award — International nurses and midwives" (launched March 2022) — https://www.england.nhs.uk/nursingmidwifery/international-recruitment/nhs-pastoral-care-quality-award/
8. Duchscher-style "transition shock" literature, applied to newly qualified/newly arrived nurses and correlated with preceptor support and competency — e.g. https://pubmed.ncbi.nlm.nih.gov/33866200/

## What the literature says, relevant to SafeFlow

- Scale: in 2022-23 nearly half of new NMC registrants were internationally educated.
- "Transition shock" is a named, measured phenomenon: unfamiliarity with local escalation norms, informal ward hierarchy, documentation conventions, and terminology measurably correlates with lower reported competency and confidence in the early months, independent of clinical skill.
- IENs specifically report feeling less able to challenge or escalate concerns up an unfamiliar hierarchy, and describe not being treated as equally credible as UK-trained colleagues when raising concerns.
- The NHS's own response is structural and pastoral (Pastoral Care Quality Award, Accelerated Preceptorship) — not a digital-tool intervention. Nothing in the literature proposes a review-support UI as a transition aid; this is genuinely a gap SafeFlow could speak to, cautiously.
- Ethical-recruitment literature (ICN, ethical-perspective papers) is about the recruitment pipeline itself (fees, deskilling, contracts) — out of scope for a ward-level review tool.

## Decision: buildable, narrow scope

This does NOT justify an HR/pastoral-care feature (out of scope, and SafeFlow must never present itself as staff welfare/immigration support). It DOES justify a small, honestly-framed inclusion note — the same pattern as SF-263's staffing-context panel — making one narrow, evidence-backed point: SafeFlow's structured, explicit review prompts (named criteria, written hazards, explicit escalation triggers) are inherently more legible to any reviewer unfamiliar with a ward's informal/tacit escalation culture, including newly-arrived internationally educated colleagues experiencing transition shock — while being explicit that SafeFlow supplements, and never substitutes for, proper preceptorship and pastoral support (mirroring the SF-263 staffing honesty framing).

Recommended as a follow-on build: **SF-272 — Inclusive-practice context note (new-to-service / IEN transition)**, a `newToServiceContextNote` export in `scenarioLibrary.js` (title + points[] + evidence), rendered as a further sibling `<aside>` in `ScenarioLibraryView.jsx`, evidence citing Rajpoot 2024 and the NHS Pastoral Care Quality Award / Accelerated Preceptorship model. Same safety-language scan and test coverage pattern as SF-263/SF-266.

Not recommending anything larger (e.g. a dedicated "IEN mode") — the literature doesn't support a bigger claim than this, and going further risks overreach into HR/pastoral territory this tool has no business making claims about.
