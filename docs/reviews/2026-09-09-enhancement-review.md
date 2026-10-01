# WardSafe / SafeFlow enhancement review — 9 September 2026

The connected ward-workflow enhancement is complete and the offline export has been rebuilt from source. This is a tested simulation prototype, not a production or WCAG conformance sign-off. Existing unrelated working-tree changes were preserved; nothing was deployed.

## Implemented

- The hospital directory opens the exact ward and patient in the working application. Observations, tasks, handover and SBAR share that patient identity. Switching wards archives each workspace without recursively nesting state. Returning or reloading restores edits and selection. See `src/domain/hospitalWorkspace.js`, `src/state/simulationWorkspace.js:237` and `src/state/useSimulationWorkspace.js`.
- Hospital census records leave unavailable medicines, results and assessment details empty. Draft generation for these patients stays deterministic and local. The deterministic-provider setting is now honoured. See `src/domain/draftProvider.js` and `src/App.jsx:376`.
- Observation edits refresh existing simulated care-status rules and ward/directory totals. No new clinical decision rules were introduced. See `src/state/simulationWorkspace.js:51` and `src/components/hospitals/HospitalsView.jsx`.
- A selected-patient control and direct observation/task/handover shortcuts reduce navigation. My Patients includes a fictional nurse workload selector. Every patient has an editable SBAR tab. See `src/App.jsx:768`, `src/components/MyPatientsView.jsx` and `src/components/SbarDraftEditor.jsx`.
- Trust Network renders one selected comparison instead of more than 50 simultaneous comparisons; all wards remain available in a grouped selector. See `src/components/TrustNetworkView.jsx:170`.
- Shared spacing, readable text, 44px primary controls, visible focus outlines and responsive layouts improve consistency. The board has keyboard-scrollable records and an explicit all-columns option. See `src/styles/clinical-workspace.css` and `src/components/WardSafetyBoard.jsx`.
- Chart popups support keyboard entry, trapped focus, Escape and focus return. Ward search and care-status filtering work with the keyboard. Blank NEWS2 and handover completion inputs are rejected. Earlier work also added storage-failure messaging, patient-scoped drafts and API JSON/body-size error handling.

## Verification

- Full Vitest run: **546 tests passed, 89 files**. After the final navigation/layout adjustments, **61 relevant tests passed** across App, AppShell and connected-workspace integration tests.
- Final Playwright run: **6 tests passed**, covering desktop and Pixel 5 projects. Includes directory search/filter, chart focus, connected patient editing, saved SBAR after reload, switching wards, and page overflow checks at **320, 390, 768, 1280 and 1440px**.
- Declared colour-pair check: **16/16 passed**. This checks the listed palette pairs, not every rendered element or every accessibility criterion.
- Standard build and single-file offline build passed. The standard bundle still triggers Vite's >500kB chunk warning.
- Offline HTML opened directly from disk: **no page errors and no HTTP(S) requests** during the tested ward/handover/SBAR journey; the saved draft survived reload.
- Database manifest, migration dry run, development infrastructure synthesis and simulation infrastructure synthesis completed. No database changes or deployment were executed. CDK reports 82 unconfigured feature flags.
- Commands used npm/local Node CLIs because the earlier pnpm invocation altered the npm-installed dependency layout. The corresponding project validation scripts were preserved.
- Dependency audit **did not pass**: four findings remain — `brace-expansion` and `nanoid` high; `vitest` and `@vitest/mocker` moderate. The audit reports fixes available. Package declarations and installed/locked versions need a focused reconciliation; no blanket dependency update was performed.

## Remaining work before a production claim

1. **Authentication and access control:** `src/SimulationAccessGate.jsx:10` checks a browser session marker. This is a prototype entry screen, not verified staff authentication. Production needs server-enforced identity, authorisation and tested access boundaries.
2. **Patient data and audit storage:** `src/state/simulationPersistence.js:4` uses browser localStorage. The archive and audit history remain client-controlled, with device storage limits. Define an approved server data model, retention, access and audit controls before introducing real patient information.
3. **Architecture and loading:** `src/App.jsx` still coordinates many independent workflows; simulation data and feature screens remain in a large initial bundle. Extract workflow controllers and load secondary screens on demand while preserving the offline build.
4. **Accessibility evidence:** keyboard/browser checks and palette checks are useful evidence, but manual screen-reader, zoom/reflow, error recovery and complete interactive-state testing remain. No WCAG 2.2 AA or DTAC completion claim is made.
5. **Clinical usability and assurance:** validate task order, terminology, alerts and information density with nurses and matrons using fictional scenarios. Production governance, clinical safety and organisational approvals remain outside this local implementation pass.

## Review artifacts

- [Desktop screenshot](./connected-ward-desktop.png)
- [Mobile screenshot](./connected-ward-mobile.png)
- [Offline demo](../../WardSafe_Offline_Demo.html)
- [Export provenance](../../WardSafe_Offline_Demo.build.json)
