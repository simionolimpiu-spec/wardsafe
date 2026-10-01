# Ward service model integration

Completed 9 September 2026. Simulation-only prototype; fictional patients and staff. Human review required.

## Result

Completed the interrupted explicit-service integration within the existing JavaScript model. Existing ward IDs, version-3 workspace keys and dated James Paget day lists are retained. The pasted TypeScript seed was used as a design reference, not imported wholesale: its unsupported service claims and intervention fall-throughs are not added to the application.

- Ward service overrides retain explicit capacity (including zero), stay, occupancy, attendance and illustrative roster ranges. Invalid ranges, duplicate levels and invalid probability mixes fail explicitly. Conflicting/source-pending capacity values remain in evidence but are withheld from displayed/generated capacity.
- Supported adult care levels and each fictional patient's recorded level are separate. Ordinary adult inpatient scenarios use a fictional 90/10 level-0/level-1 mix; combined critical care uses a fictional mixed level-2/level-3 distribution; dedicated level-2 assignments remain level 2. These are scenario parameters, not measured occupied-bed proportions, clinical classifications derived from observations, or staffing guidance.
- Neonatal, paediatric and maternity scenarios never inherit adult care levels or adult critical-care documentation. Unsupported level/workflow combinations are rejected. Other day units cannot acquire the James Paget procedure list by changing their service label.
- Documentation topics describe review areas, not completed interventions or proposed treatment. Critical-care scenario descriptions no longer contradict the separately sampled care level. Patient charts and ward rows expose fictional level records.
- Completed day-case transfers preserve identity and retain explicit receiving-service checks. The receiving record carries its destination care level and an illustrative nurse from the receiving ward's roster.
- Expandable ward evidence shows sources and assumptions per field, including inherited defaults. An audit helper includes resolved fields, capability entries and network pathways. Missing source metadata still triggers review even when a status says published.
- Expandable hospital information shows capability examples and sourced referral/return context without automatic referral selection or implied live availability.

The [NNUH trauma page](https://www.nnuh.nhs.uk/our-services/emergency-care/trauma-services/) was checked in this pass: it describes possible transfer to Addenbrooke's and return after specialist treatment. This does not validate unrelated hospital capability claims or individual transfer eligibility.

## Validation

| Check | Result |
|---|---|
| Targeted resolver, population, day-list, persistence and UI tests | 27 passed |
| Full `pnpm test` | 563 passed in 91 files |
| `pnpm run build` | Passed; existing large-bundle warning |
| `pnpm run e2e` | First run: 8 passed, 2 initial page-load timeouts. Rerun: all 10 passed, including new evidence/keyboard/mobile coverage |
| `pnpm run db:manifest` | Passed |
| `pnpm run infra:synth:dev` | Passed |
| `pnpm run infra:synth:simulation` | Passed |
| `SAFEFLOW_SIMULATION_ONLY=true pnpm run db:migrate:plan` | Passed (environment set using PowerShell syntax); no migration executed |
| `pnpm run build:offline` | Passed; HTML and build manifest rebuilt |
| Offline file smoke | Selected ward retained after reload; zero page errors and zero HTTP(S) requests |
| Visual QA | Desktop/mobile screenshots inspected; browser assertions passed at 320, 390, 768 and 1440 pixels without page overflow |

Screenshots: [Desktop](./service-evidence-desktop.png), [mobile](./service-evidence-mobile.png). [Offline demo](../../WardSafe_Offline_Demo.html).

## Environment failures and recovery

- Initial `pnpm test` invoked pnpm 11's automatic dependency installation and failed with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.28.2`. The closest targeted equivalent, `npm run test -- ...`, passed 27 tests. Generated pnpm lock/workspace files were removed; the existing npm lockfile was retained.
- Restoring dependencies with `npm ci --ignore-scripts` initially returned `EPERM: operation not permitted, unlink` for `node_modules/@esbuild/win32-x64/esbuild.exe`, then for `node_modules/@rollup/rollup-win32-x64-msvc/rollup.win32-x64-msvc.node`. The workspace Vite/esbuild processes held those files. After stopping them, the restore succeeded. The existing Vite preview was restarted on port 5189.
- Subsequent pnpm script commands used the process-only setting `pnpm_config_verify_deps_before_run=false` to avoid changing the existing npm dependency installation. No package-manager/configuration changes are included in this pass.
- `pnpm audit --audit-level=moderate` returned `[ERR_PNPM_AUDIT_NO_LOCKFILE] No pnpm-lock.yaml found: Cannot audit a project without a lockfile`. The equivalent `npm audit --audit-level=moderate` completed with exit 1 and four findings: two moderate (`@vitest/mocker` and dependent `vitest`), two high (`brace-expansion`, `nanoid`). Dependency remediation remains separate work.
- Two initial desktop browser tests failed at `page.goto('/')` with `Test timeout of 60000ms exceeded`. All ten journeys passed on rerun without changing timeouts or app code.
- The first offline smoke assertion failed with `strict mode violation: getByLabel('Selected patient') resolved to 2 elements`. An exact combobox selector corrected the check; the smoke then passed.
- UI skill search fallback: `python` returned `Python was not found`; `py` returned `The term 'py' is not recognized`. The skill's written accessibility quick reference was read instead.

## Remaining limits

Service assignments marked unconfirmed still require local review. No new hospital inventory or unverified procedure catalogue was imported. Existing saved records are preserved, not rewritten to claim new care-level metadata; older records may therefore have no displayed level. Network pathways are explanatory examples, not a referral engine. Real staffing, current capacities and local specialty observation charts are not validated by this work. The four dependency findings and broader production assurance work remain open.
