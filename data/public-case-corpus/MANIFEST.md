# Corpus Manifest

**Generated:** 15 August 2026 · **Protocol:** v1.2

| | |
|---|---|
| **Included** | **7** of target 100 |
| **Excluded** | 2 |
| **Hand-screened** | 9 |
| Machine-screened by harvester | 117 *(newest 2 pages × 6 categories; 1 gated, 12 borderline — not yet adjudicated)* |
| Inclusion rate | *(not meaningful — see caveat below)* |
| Schema-validated | **9 of 9** |
| Fully source-verified | 3 of 9 *(the other 6 have had `response_published` re-checked only)* |
| Independently re-adjudicated | 0 |

## Included

| ID | Subject | Organisation | Mechanism | Sensitive |
|---|---|---|---|---|
| [`pfd-2026-0069`](https://www.judiciary.uk/prevention-of-future-death-reports/roger-smith-prevention-of-future-deaths-report/) | Roger Smith, 80 | West Suffolk NHS FT | Neurologist advice in record not surfaced on readmission 4 days later | |
| [`pfd-2024-0458`](https://www.judiciary.uk/prevention-of-future-death-reports/alan-fallows-prevention-of-future-deaths-report/) | Alan Fallows | University Hospitals Birmingham | Falls risk assessment not updated after first fall; Datix never filed | |
| [`pfd-2024-0284`](https://www.judiciary.uk/prevention-of-future-death-reports/david-scott-prevention-of-future-deaths-report/) | David Scott, 68 | Warrington Hospital | Vascular calcification visible on x-ray not reported; urgent referral silent 27 days | |
| [`pfd-2026-0049`](https://www.judiciary.uk/prevention-of-future-death-reports/pamela-george-prevention-of-future-deaths-report/) | Pamela George, 70 | Premiere Health Ltd (Cann House) | Discharge summary requiring 5–7 day bloods never actioned; 36 days unmonitored | |
| [`pfd-2025-0579`](https://www.judiciary.uk/prevention-of-future-death-reports/ernest-gray-prevention-of-future-deaths-report/) | Ernest Gray, 95 | East Kent Hospitals University NHS FT | Documented in-patient violence and fluctuating delirium not communicated at discharge | ⚠️ |
| [`pfd-2025-0171`](https://www.judiciary.uk/prevention-of-future-death-reports/hailey-thompson-prevention-of-future-deaths-report/) | Hailey Thompson, 22 months | Ashton Medical Practice / SSP Health | Unresolved paediatric medication query answered off-system; invisible at 2 later contacts | ⚠️ |
| [`pfd-2025-0559`](https://www.judiciary.uk/prevention-of-future-death-reports/jennifer-cahill-and-agnes-cahill-prevention-of-future-deaths-report/) | Jennifer & Agnes Cahill | Manchester University NHS FT | Provisional early plan treated as definitive; emerging risks never folded back in | ⚠️ |

*(Cahill is one report covering two deaths — counted as one case.)*

## Excluded

| ID | Subject | Reason | Note |
|---|---|---|---|
| [`pfd-2026-0294`](https://www.judiciary.uk/prevention-of-future-death-reports/mary-forlin-prevention-of-future-deaths-report/) | Mary Forlin | `E1_single_episode` | Adjacent theme — identical EPR mechanism, single admission |
| [`pfd-2024-0166`](https://www.judiciary.uk/prevention-of-future-death-reports/robert-prowse-prevention-of-future-deaths-report/) | Robert Prowse, 86 | `E7_mechanism_not_identified` | C1–C3 met on facts; coroner identified ambulance capacity, not continuity |

## ⚠️ Sensitive handling

Three included cases carry `sensitive_handling: true` — a child death, a maternal and neonatal death with findings of neglect, and a case in which a second person died. **None may be used in any pitch, deck, demo, or public-facing material.** Cite by reference only, and only where the full report will be read. Rationale is recorded in each `adjudication_note`.

## What the numbers do and do not mean

**There is no meaningful inclusion rate yet.** The nine hand-screened reports were reached by targeted search for phrases like "discharged… readmitted", so they are enriched for the pattern by construction. The real rate — the number that matters — only emerges from a systematic screen, which needs the full crawl.

The harvester has now run, but only over the newest 2 pages of each category: 117 reports, 1 gated, 12 borderline. **That is a smoke test, not a screen.** It is also not independent evidence of anything — the single gated hit is `pfd-2026-0049`, a case already included by hand, and it gated on lexicon patterns derived from its own adjudication. Circular by construction, and useful only as proof that the pipeline runs end to end.

Until the full crawl, this is a demonstration that the pattern recurs across settings, not a measurement of how often.

## Coverage

By care setting, included cases span acute hospital (3), care home post-discharge (1), primary care and community (1), maternity (1), and cross-boundary (2 of the above).

By **filed PFD category** — read off the live pages on 15 August 2026, which corrected two errors in the earlier v1.1 text:

| Category | Included |
|---|---|
| Hospital Death (Clinical Procedures and medical management) | 3 |
| Community health care and emergency services | 3 |
| Child Death (from 2015) | 1 *(dual-filed with Community)* |
| Other related deaths | 1 |
| Care Home Health | 0 |

**Only three of seven sit in Hospital Death.** The harvester originally crawled that category alone and now crawls six. Note that `Other related deaths` was missing from the first extension list too — so following that list would still have missed `pfd-2025-0579`. Care Home Health is crawled on a hypothesis, not an observed hit.

## Next

1. **Finish verifying the six unverified records.** Only `response_published` has been re-checked on them, and it was wrong on all six. Quotes, dates and C1–C4 evidence still rest on a single read each.
2. Decide how to handle PDF-only reports (~1% publish no HTML body): add a PDF dependency, or adopt a hand-open rule for the "Not screened" list.
3. Run the full crawl — six categories, ~500 listing pages, ~5,000 reports, several hours at the courtesy delay.
4. Adjudicate the gated queue by hand, then **skim the borderline tier** — the pre-filter's recall is unmeasured, and it is known to have missed two of the first four cases.
5. Measure that recall honestly: hand-adjudicate a random sample of the below-threshold tier and count what should have been caught.
6. Tune the signal weights against adjudicated outcomes and record the tuning here.
7. At ~20 included cases, run the first independent re-adjudication and publish the disagreement rate.
