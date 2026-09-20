# Dependency and saved-record follow-up

Completed 9 September 2026. This supersedes the four open dependency findings in the earlier service-model integration report.

## Changes

- Vitest 4.1.10 → 4.1.11, including its matching mocker dependency. The declared minimum now requires the patched version. [Advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
- AWS CDK library 2.263.0 → 2.268.0. Its resolved brace-expansion dependency is now 5.0.9 rather than the vulnerable bundled 5.0.8. The existing override is retained. [Advisory](https://github.com/advisories/GHSA-rgw5-rvv9-x895).
- Nano ID 3.3.16 → 3.3.18 through an explicit override on the existing major version. [Advisory](https://github.com/advisories/GHSA-2v37-7h3g-55p8).
- The npm lockfile records the resolved updates. No major-version upgrade or deployment was performed. Existing unrelated workspace changes were retained.
- Older saved patient records now explicitly show missing service metadata in their chart. They are not assigned a care level retrospectively. A regression test saves edited notes, switches wards, reloads, and verifies the full saved patient is unchanged.

## Validation

| Check | Result |
|---|---|
| Full tests | 564 passed in 91 files |
| Desktop/mobile browser journeys | 10 passed |
| Standard build and offline build | Passed |
| Development and simulation infrastructure synths | Passed |
| Database manifest and migration dry-run | Passed; no migration executed |
| npm audit, including development dependencies | Zero reported vulnerabilities |
| Offline save/reload smoke | Selection preserved; zero page errors and zero HTTP(S) requests |
| Diff whitespace check | Passed |

Commands used the existing npm installation (`npm.cmd`) to avoid pnpm's previously documented automatic dependency reorganisation and absent pnpm lockfile. The production build's large-bundle warning and CDK feature-flag notice remain. A clean dependency audit is not a security certification or clinical validation.

## Next local review

[James Paget review pack](./2026-09-09-james-paget-review-pack.md) contains concrete dated rehearsal journeys and a field-by-field list of questions. The roles of Wards 5 and 9 and overnight DCU destinations have been requested from the user. Until confirmed, the app keeps these service assignments marked unconfirmed. No real patient data is needed for that review.

[Rebuilt offline demo](../../WardSafe_Offline_Demo.html)
