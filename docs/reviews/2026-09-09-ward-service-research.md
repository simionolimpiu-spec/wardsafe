# Ward service realism and day-surgery correction

Research checked 9 September 2026. This review distinguishes public service descriptions, the user's operational input and deliberately fictional scenario values. It does not establish the complete current hospital booking catalogue, staffing establishment or clinical eligibility rules.

## What the evidence supports

| Service | Public evidence | Model consequence |
|---|---|---|
| James Paget Day Care Unit | The Trust describes 20 day beds, weekday opening 07:00–22:00, operating hours 08:00–18:00 and no overnight accommodation. Arrival appointments are not operating times. | Use a dated surgical activity list; separate bookings and current pathway attendance from bed capacity. Overnight admission belongs to another service. |
| James Paget ICU/HDU | The Trust's April 2025 visiting leaflet describes a combined 12-bed service admitting from theatres, ED, wards and other hospitals; review date April 2028. | Replace the old 16-bed simulation estimate with the leaflet's 12-bed reference, clearly attributed. HDU and ITU destinations reference the combined local service. |
| James Paget Renal Unit | The current page describes 18 dialysis machines across three daily shifts and a cohort of approximately 100 patients, plus broader renal services. | Treat machines, session activity and the longitudinal service cohort as different quantities. Generate dialysis attendances separately from renal inpatient cases. |
| James Paget Neonatal Unit | The service page describes care above 30 weeks' gestation, initial stabilisation for smaller babies or those needing prolonged ventilation, and onward specialist transfer. | Use neonatal cases, age in days and age-appropriate background. Do not put adult diagnoses/comorbidities or an adult NEWS2 score into the neonatal unit. |
| Ward specialties and names | The source already held a public-directory-derived ward inventory. The general Trust ward page remains accessible, but its directory target could not be retrieved reliably in this pass. Some other hospitals' records contain only an inpatient location, without a verified specialty. | Keep the distinction between an inherited specialty assignment and newly checked service evidence. Do not manufacture a patient mix for unresolved assignments. |

Sources:

- [Day Care Unit](https://www.jpaget.nhs.uk/departments/day-care-unit/)
- [ICU/HDU visiting leaflet](https://www.jpaget.nhs.uk/media/arxa4uxj/visiting-the-intensive-care-unit-and-high-dependency-unit.pdf)
- [Renal Unit](https://www.jpaget.nhs.uk/departments/renal-unit/)
- [Neonatal Unit](https://www.jpaget.nhs.uk/departments/neonatal-unit/)
- [Wards](https://www.jpaget.nhs.uk/departments/wards/)
- [Theatres](https://www.jpaget.nhs.uk/departments/theatres/)

## Procedure catalogue review

The [Trust leaflet directory](https://www.jpaget.nhs.uk/patients-visitors/information-leaflets-a-z/) contains 17 displayed DCU procedure entries. The application includes 13 named procedure examples from those entries, with specialty and provenance in `src/data/clinical/daySurgeryCatalogue.js`. These are examples for fictional lists, not permission to perform a procedure on a particular patient.

Four entries are held out of generated lists: flexible cystoscopy and clinic prostate biopsy because location overlaps with other pathways; trans-vaginal tape because the historical listing does not establish a current offered pathway; and minor foot/ankle surgery because its link points to the LLETZ document. Several leaflets have elapsed review dates. ENT, dental, pain and ophthalmology are published DCU specialty areas, but this pass did not verify a complete current procedure list for each. They are shown as catalogue gaps, rather than filled with guessed procedures.

Cross-checks of individual documents confirmed the [HoLEP](https://www.jpaget.nhs.uk/media/iyriaps3/dcu-13-home-advice-for-patients-who-have-undergone-holep-holmium-laser-enucleation-of-the-prostate-surgery.pdf), [foot osteotomy](https://www.jpaget.nhs.uk/media/asjbzntk/dcu-15-general-information-for-patients-who-have-undergone-foot-surgery-ie-osteotomy.pdf) and [LLETZ](https://www.jpaget.nhs.uk/media/5z2e5psi/dcu-8-home-advice-for-patients-who-have-undergone-lletz-large-loop-excision-of-the-transformation-zone-surgery.pdf) titles. Their instructions were not imported into the application. The knee-arthroscopy PDF returned 403; only its public directory listing is used.

## What is deliberately fictional

- Approximately 30 DCU bookings per day is the user's baseline, not a measured Trust average. The initial date has 30; other weekdays vary from 24–36 using a reproducible date seed. Weekends have no routine list in the generator.
- The review screen is a 14:00 snapshot. Future theatre, recovery and departure events are not displayed as completed. Planned and actual times are separate. Durations are computed from the fictional events, not presented as clinical targets.
- Case mix, list allocation, consultant and anaesthetist names, operating durations, cancellations, outcomes, interventions and transfer decisions are simulated. Generator probabilities are scenario controls, not measured complication/cancellation rates.
- Overnight transfers are occasional rather than mandatory. A completed move preserves the patient's identity in the receiving surgical or combined ICU/HDU census. The source list keeps the history and removes them from current pathway attendance.
- Inpatient counts, lengths of stay, acuity and illustrative nursing rosters vary by service. Except for explicitly attributed capacities above, displayed capacities are labelled simulation estimates.
- Day-surgery records are surgical cases, rather than the previous infusion/transfusion/cardioversion pool. Dialysis, oncology day treatment, ophthalmology, endoscopy, maternity, paediatrics and neonatal care have separate profiles. Unconfirmed services remain visible without an invented census.

## Persistence and scope

New census workspaces use versioned, date-specific keys. Existing older census workspaces remain archived under their previous keys; old notes are not attached automatically to newly generated identities. Edits are retained independently when switching dates and returning. The older five-record training exercises remain available and are labelled training scenarios, distinct from the hospital census.

The dedicated flow screen is implemented for James Paget DCU. Other services have differentiated profiles and data, not complete specialist workflow systems. Actual current ward assignments, staffed capacities, all procedure eligibility/location rules and specialty observation charts still need local validation before presentation as an accurate operational model. In particular, no paediatric, maternity or neonatal score is invented where its chart has not been implemented.

## Validation and review artifacts

- Full unit/integration suite: **554 tests passed in 90 files**.
- Desktop and mobile browser journeys passed, including the new dated day-surgery workflow, saved notes after reload, and ward switching.
- Tests check procedure-event order, absence of future completed events, non-overlapping theatre/consultant/anaesthetist allocations, variable weekday counts, quiet days without transfers, all three transfer destinations across sample dates, receiving-census identity and capacity, and rejection of adult NEWS2 for neonatal records.
- Standard and offline builds passed. The existing large-bundle warning remains.
- The exported HTML opened from disk with no page errors or HTTP(S) requests in the tested date-selection/reload journey. Final layout checks found no page overflow at 320, 390, 768 or 1440 pixels.
- [Desktop preview](./day-surgery-desktop.png) · [Mobile preview](./day-surgery-mobile.png) · [Rebuilt offline demo](../../WardSafe_Offline_Demo.html)

Infrastructure and dependencies were not changed in this pass. The four previously documented dependency-audit findings remain outside these service-data corrections. No real patient data, external clinical API, model training or deployment was used.
