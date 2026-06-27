# Simulation Signal Engine v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SafeFlow Phase 1-3 for a simulation-only signal engine: synthetic clinical signals, shadow missed-action risk suggestions, and nurse confirmation workflow.

**Architecture:** Add append-only simulation signal tables to PostgreSQL, expose signal timelines and suggestions through server providers/API routes, then wire nurse confirmation into the existing React workspace. Risk detection uses deterministic ML-shaped scoring and guardrails in v0; LLM wording and live ICE/EPR ingestion stay out of this build.

**Tech Stack:** PostgreSQL SQL migrations, Node.js server providers, AWS Lambda-bundled query assets, React 19, Vitest, Vite, existing SafeFlow RDS simulation deployment.

---

## Scope

This plan covers the approved design phases:

- Phase 1: Simulation Signal Model.
- Phase 2: Shadow Risk Engine.
- Phase 3: Nurse Confirmation Workflow.

This plan does not connect to live ICE, LIMS, EPR, MESH, FHIR, HL7 or patient-identifiable data. It creates simulation-shaped data and interfaces that can support a future integration feasibility phase.

## File Structure

Create or modify these files:

- `database/schema.sql`: add clinical signal, source status, prediction, suggestion and action tables.
- `database/seed.sql`: seed fictional lab, observation, microbiology and workflow signals plus initial suggestions.
- `database/migrationApproval.json`: update approved checksums after schema/seed changes.
- `database/schema.test.js`: assert signal and suggestion tables are simulation-safe and append-friendly.
- `database/queries/simulationSignalTimeline.sql`: read patient signal timeline.
- `database/queries/simulationRiskSuggestions.sql`: read open and actioned risk suggestions.
- `database/queries/recordSimulationSuggestionAction.sql`: append nurse confirmation actions and update suggestion state.
- `infra/aws/copyMigratorAssets.mjs`: bundle new query files into API/migration Lambdas.
- `server/signalProvider.js`: DB/local provider for patient signal timelines.
- `server/suggestionProvider.js`: DB/local provider for suggestions and nurse actions.
- `server/riskEngine/simulationFeatureBuilder.js`: convert signals and workflow evidence into ML-shaped features.
- `server/riskEngine/simulationRiskEngine.js`: score missed-action risk and apply guardrails.
- `server/api.js`: add signal and suggestion routes.
- `server/readinessReport.js`: include signal/suggestion provider modes.
- `infra/aws/lambda/safeflowApi/index.mjs`: expose same private Lambda routes.
- `src/services/signalClient.js`: fetch signal timeline and suggestions.
- `src/state/simulationWorkspace.js`: add local suggestion state and actions.
- `src/components/IntelligencePanel.jsx`: nurse-facing suggestions and evidence.
- `src/components/PatientSafetyPanel.jsx`: add Intelligence tab/section.
- `src/App.jsx`: connect handlers, server mirroring and status messages.
- `src/styles.css`: style suggested items distinctly from confirmed workflow.

## Shared Data Shapes

Use these names consistently across server, client and tests:

```js
const clinicalSignalShape = {
  signalId: 'signal-dcu-031-potassium-0910',
  syntheticPatientRef: 'DCU-031',
  sourceSystem: 'simulation-ice',
  sourceType: 'lab',
  signalCode: 'potassium',
  displayName: 'Potassium',
  value: '3.1',
  unit: 'mmol/L',
  referenceRange: '3.5-5.3',
  status: 'final',
  collectedAt: '2026-06-10T08:55:00.000Z',
  resultedAt: '2026-06-10T09:10:00.000Z',
  receivedAt: '2026-06-10T09:10:30.000Z',
  sourceFreshness: 'current',
  confidence: 0.98,
  provenance: {
    feed: 'simulation',
    messageType: 'ice_pathology_result',
    directCareIdentifiers: false
  },
  simulationOnly: true
};

const riskSuggestionShape = {
  suggestionId: 'suggestion-dcu-031-electrolyte-review',
  syntheticPatientRef: 'DCU-031',
  riskType: 'missed_action',
  riskTier: 'urgent',
  riskScore: 0.86,
  status: 'suggested',
  title: 'Electrolyte result review may be needed',
  suggestedFlag: 'Electrolyte result review may be needed',
  suggestedBlocker: 'Unresolved abnormal blood result',
  suggestedTask: 'Review blood trend and document action',
  evidence: [
    { signalId: 'signal-dcu-031-potassium-0910', label: 'Potassium 3.1 mmol/L final at 09:10' },
    { signalId: 'signal-dcu-031-magnesium-missing', label: 'Magnesium result not visible' }
  ],
  missingData: ['Magnesium result not visible'],
  modelVersion: 'simulation-risk-v0',
  featureSetVersion: 'signal-features-v0',
  requiresHumanReview: true,
  createdAt: '2026-06-10T09:12:00.000Z'
};
```

## Task 1: Add Simulation Signal And Suggestion Schema

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/schema.test.js`

- [ ] **Step 1: Write failing schema tests**

Add these tests to `database/schema.test.js`:

```js
it('stores simulation clinical signals without direct identifiers', () => {
  expect(schema).toMatch(/create table if not exists clinical_signals\b/i);
  expect(schema).toMatch(/synthetic_patient_ref text not null check \(synthetic_patient_ref ~ '\^DCU-\[0-9\]\{3\}\$'\)/i);
  expect(schema).toMatch(/source_type text not null check \(source_type in \('lab', 'observation', 'microbiology', 'workflow', 'medication', 'allergy', 'sensor', 'external_ai'\)\)/i);
  expect(schema).toMatch(/simulation_only boolean not null default true check \(simulation_only is true\)/i);
  expect(schema).not.toMatch(/\bnhs_number\b|\bdate_of_birth\b|\bpostcode\b|\baddress\b/i);
});

it('stores risk suggestions as nurse-confirmed workflow proposals', () => {
  expect(schema).toMatch(/create table if not exists risk_predictions\b/i);
  expect(schema).toMatch(/create table if not exists risk_suggestions\b/i);
  expect(schema).toMatch(/create table if not exists suggestion_actions\b/i);
  expect(schema).toMatch(/status text not null default 'suggested' check \(status in \('suggested', 'accepted', 'dismissed', 'snoozed', 'escalated', 'converted_to_task', 'converted_to_blocker', 'resolved', 'superseded'\)\)/i);
  expect(schema).toMatch(/requires_human_review boolean not null default true check \(requires_human_review is true\)/i);
});
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run database/schema.test.js --configLoader runner
```

Expected: FAIL because `clinical_signals`, `risk_predictions`, `risk_suggestions` and `suggestion_actions` do not exist.

- [ ] **Step 3: Add schema tables**

Append this block before the existing index section in `database/schema.sql`:

```sql
create table if not exists clinical_signals (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  synthetic_patient_ref text not null check (synthetic_patient_ref ~ '^DCU-[0-9]{3}$'),
  source_system text not null,
  source_message_id text not null,
  source_type text not null check (source_type in ('lab', 'observation', 'microbiology', 'workflow', 'medication', 'allergy', 'sensor', 'external_ai')),
  signal_code text not null,
  display_name text not null,
  signal_value text,
  unit text,
  reference_range text,
  status text not null check (status in ('preliminary', 'final', 'amended', 'cancelled', 'missing', 'unavailable')),
  collected_at timestamptz,
  resulted_at timestamptz,
  received_at timestamptz not null,
  effective_at timestamptz not null,
  source_freshness text not null check (source_freshness in ('current', 'stale', 'unavailable')),
  confidence numeric(4,3) not null default 1.000 check (confidence >= 0 and confidence <= 1),
  provenance jsonb not null default '{}'::jsonb,
  simulation_only boolean not null default true check (simulation_only is true),
  created_at timestamptz not null default now(),
  unique (source_system, source_message_id, signal_code, effective_at)
);

create table if not exists signal_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  clinical_signal_id uuid not null references clinical_signals (id),
  actor_user_id uuid references users (id),
  acknowledgement_type text not null check (acknowledgement_type in ('reviewed', 'already_actioned', 'not_relevant')),
  note text,
  acknowledged_at timestamptz not null default now()
);

create table if not exists risk_predictions (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  risk_type text not null default 'missed_action' check (risk_type in ('missed_action')),
  risk_score numeric(4,3) not null check (risk_score >= 0 and risk_score <= 1),
  risk_tier text not null check (risk_tier in ('info', 'watch', 'urgent')),
  model_version text not null,
  feature_set_version text not null,
  top_contributors jsonb not null default '[]'::jsonb,
  uncertainty text not null check (uncertainty in ('low', 'medium', 'high')),
  requires_human_review boolean not null default true check (requires_human_review is true),
  simulation_only boolean not null default true check (simulation_only is true),
  created_at timestamptz not null default now()
);

create table if not exists risk_suggestions (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references risk_predictions (id),
  patient_summary_id uuid not null references patient_summaries (id),
  title text not null,
  suggested_flag text not null,
  suggested_blocker text not null,
  suggested_task text not null,
  evidence jsonb not null default '[]'::jsonb,
  missing_data jsonb not null default '[]'::jsonb,
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'dismissed', 'snoozed', 'escalated', 'converted_to_task', 'converted_to_blocker', 'resolved', 'superseded')),
  simulation_only boolean not null default true check (simulation_only is true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suggestion_actions (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references risk_suggestions (id),
  actor_user_id uuid references users (id),
  action_type text not null check (action_type in ('accepted', 'dismissed', 'snoozed', 'escalated', 'converted_to_task', 'converted_to_blocker', 'resolved')),
  action_reason text not null,
  created_task_id uuid references tasks (id),
  created_blocker_id uuid references discharge_blockers (id),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
```

Add these indexes near the existing index section:

```sql
create index if not exists idx_clinical_signals_patient_summary_id on clinical_signals (patient_summary_id);
create index if not exists idx_clinical_signals_source_type on clinical_signals (source_type);
create index if not exists idx_clinical_signals_effective_at on clinical_signals (effective_at desc);
create index if not exists idx_risk_predictions_patient_summary_id on risk_predictions (patient_summary_id);
create index if not exists idx_risk_suggestions_patient_summary_id on risk_suggestions (patient_summary_id);
create index if not exists idx_risk_suggestions_status on risk_suggestions (status);
create index if not exists idx_suggestion_actions_suggestion_id on suggestion_actions (suggestion_id);
```

Add a trigger for `risk_suggestions` near the existing `set_updated_at` triggers:

```sql
drop trigger if exists set_risk_suggestions_updated_at on risk_suggestions;
create trigger set_risk_suggestions_updated_at
before update on risk_suggestions
for each row execute function set_updated_at();
```

- [ ] **Step 4: Run schema tests and verify pass**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run database/schema.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add database/schema.sql database/schema.test.js
git commit -m "feat: add simulation signal schema"
```

## Task 2: Seed Combined Clinical Signals And Suggestions

**Files:**
- Modify: `database/seed.sql`
- Modify: `database/migrationApproval.json`
- Test: `database/migrationRunner.test.js`

- [ ] **Step 1: Write failing seed assertions**

Add this test to `database/migrationRunner.test.js`:

```js
it('includes the approved simulation signal schema and seed content', () => {
  const manifest = buildMigrationManifest();
  const approval = createApprovedFixture(manifest);

  expect(approval.migrations.map((migration) => migration.path)).toEqual([
    'database/schema.sql',
    'database/seed.sql'
  ]);
  expect(manifest.migrations.every((migration) => migration.simulationOnly)).toBe(true);
  expect(JSON.stringify(manifest)).not.toMatch(/nhs_number|date_of_birth|postcode|address/i);
});
```

- [ ] **Step 2: Run migration tests and verify current pass**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run database/migrationRunner.test.js --configLoader runner
```

Expected: PASS. This test protects the approval workflow before changing seed content.

- [ ] **Step 3: Add fictional signal seed data**

Append this SQL to `database/seed.sql` after existing seed inserts:

```sql
with patient_ref as (
  select id, synthetic_patient_ref from patient_summaries
  where synthetic_patient_ref in ('DCU-031', 'DCU-028')
),
seed_signals as (
  insert into clinical_signals (
    patient_summary_id,
    synthetic_patient_ref,
    source_system,
    source_message_id,
    source_type,
    signal_code,
    display_name,
    signal_value,
    unit,
    reference_range,
    status,
    collected_at,
    resulted_at,
    received_at,
    effective_at,
    source_freshness,
    confidence,
    provenance
  )
  values
    (
      (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
      'DCU-031',
      'simulation-ice',
      'sim-ice-dcu-031-potassium-0910',
      'lab',
      'potassium',
      'Potassium',
      '3.1',
      'mmol/L',
      '3.5-5.3',
      'final',
      '2026-06-10 08:55:00+00'::timestamptz,
      '2026-06-10 09:10:00+00'::timestamptz,
      '2026-06-10 09:10:30+00'::timestamptz,
      '2026-06-10 09:10:00+00'::timestamptz,
      'current',
      0.980,
      '{"feed":"simulation","messageType":"ice_pathology_result","directCareIdentifiers":false}'::jsonb
    ),
    (
      (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
      'DCU-031',
      'simulation-ice',
      'sim-ice-dcu-031-magnesium-missing-0910',
      'lab',
      'magnesium',
      'Magnesium',
      null,
      'mmol/L',
      '0.7-1.0',
      'missing',
      null,
      null,
      '2026-06-10 09:10:30+00'::timestamptz,
      '2026-06-10 09:10:30+00'::timestamptz,
      'current',
      0.900,
      '{"feed":"simulation","messageType":"expected_pathology_result","directCareIdentifiers":false}'::jsonb
    ),
    (
      (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
      'DCU-031',
      'simulation-observations',
      'sim-obs-dcu-031-news2-0915',
      'observation',
      'NEWS2',
      'NEWS2',
      '7',
      null,
      null,
      'final',
      '2026-06-10 09:15:00+00'::timestamptz,
      '2026-06-10 09:15:00+00'::timestamptz,
      '2026-06-10 09:15:10+00'::timestamptz,
      '2026-06-10 09:15:00+00'::timestamptz,
      'current',
      1.000,
      '{"feed":"simulation","messageType":"news2_observation","directCareIdentifiers":false}'::jsonb
    ),
    (
      (select id from patient_ref where synthetic_patient_ref = 'DCU-028' limit 1),
      'DCU-028',
      'simulation-microbiology',
      'sim-micro-dcu-028-urine-prelim',
      'microbiology',
      'urine_culture',
      'Urine culture',
      'preliminary growth flagged',
      null,
      null,
      'preliminary',
      '2026-06-10 07:20:00+00'::timestamptz,
      '2026-06-10 11:45:00+00'::timestamptz,
      '2026-06-10 11:45:30+00'::timestamptz,
      '2026-06-10 11:45:00+00'::timestamptz,
      'current',
      0.850,
      '{"feed":"simulation","messageType":"microbiology_result","directCareIdentifiers":false}'::jsonb
    )
  on conflict (source_system, source_message_id, signal_code, effective_at) do update
    set signal_value = excluded.signal_value,
        status = excluded.status,
        source_freshness = excluded.source_freshness,
        provenance = excluded.provenance
  returning id, synthetic_patient_ref, signal_code
),
seed_prediction as (
  insert into risk_predictions (
    patient_summary_id,
    risk_type,
    risk_score,
    risk_tier,
    model_version,
    feature_set_version,
    top_contributors,
    uncertainty
  )
  values (
    (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
    'missed_action',
    0.860,
    'urgent',
    'simulation-risk-v0',
    'signal-features-v0',
    '["potassium_low", "magnesium_missing", "news2_high", "no_recent_acknowledgement"]'::jsonb,
    'medium'
  )
  returning id, patient_summary_id
)
insert into risk_suggestions (
  prediction_id,
  patient_summary_id,
  title,
  suggested_flag,
  suggested_blocker,
  suggested_task,
  evidence,
  missing_data
)
values (
  (select id from seed_prediction limit 1),
  (select patient_summary_id from seed_prediction limit 1),
  'Electrolyte result review may be needed',
  'Electrolyte result review may be needed',
  'Unresolved abnormal blood result',
  'Review blood trend and document action',
  '[
    {"signalCode":"potassium","label":"Potassium 3.1 mmol/L final at 09:10"},
    {"signalCode":"magnesium","label":"Magnesium result not visible"},
    {"signalCode":"NEWS2","label":"NEWS2 7 at 09:15"}
  ]'::jsonb,
  '["Magnesium result not visible"]'::jsonb
);
```

- [ ] **Step 4: Update migration approval**

Run:

```powershell
npm run db:manifest
```

Copy the new `bytes` and `sha256` values for `database/schema.sql` and `database/seed.sql` into `database/migrationApproval.json`. Keep `approvedBy`, `approvalReason`, `product`, `simulationOnly` and `approved` unchanged.

- [ ] **Step 5: Run migration tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run database/schema.test.js database/migrationRunner.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add database/seed.sql database/migrationApproval.json database/migrationRunner.test.js
git commit -m "feat: seed simulation clinical signals"
```

## Task 3: Add Signal And Suggestion Read Queries

**Files:**
- Create: `database/queries/simulationSignalTimeline.sql`
- Create: `database/queries/simulationRiskSuggestions.sql`
- Create: `database/queries/recordSimulationSuggestionAction.sql`
- Modify: `infra/aws/copyMigratorAssets.mjs`

- [ ] **Step 1: Write failing query asset test**

Add this assertion to `infra/aws/copyMigratorAssets.test.js` if the file exists. If it does not exist, create `infra/aws/copyMigratorAssets.test.js` with this content:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('copyMigratorAssets', () => {
  it('bundles signal intelligence query contracts', () => {
    const script = readFileSync('infra/aws/copyMigratorAssets.mjs', 'utf8');

    expect(script).toContain('simulationSignalTimeline.sql');
    expect(script).toContain('simulationRiskSuggestions.sql');
    expect(script).toContain('recordSimulationSuggestionAction.sql');
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run infra/aws/copyMigratorAssets.test.js --configLoader runner
```

Expected: FAIL because the new query file names are not bundled.

- [ ] **Step 3: Create signal timeline query**

Create `database/queries/simulationSignalTimeline.sql`:

```sql
/*
  SafeFlow simulation signal timeline read contract.
  Returns fictional clinical signals only.
*/

select coalesce(jsonb_agg(jsonb_build_object(
  'signalId', cs.id,
  'syntheticPatientRef', cs.synthetic_patient_ref,
  'sourceSystem', cs.source_system,
  'sourceType', cs.source_type,
  'signalCode', cs.signal_code,
  'displayName', cs.display_name,
  'value', cs.signal_value,
  'unit', cs.unit,
  'referenceRange', cs.reference_range,
  'status', cs.status,
  'collectedAt', cs.collected_at,
  'resultedAt', cs.resulted_at,
  'receivedAt', cs.received_at,
  'effectiveAt', cs.effective_at,
  'sourceFreshness', cs.source_freshness,
  'confidence', cs.confidence,
  'provenance', cs.provenance,
  'simulationOnly', cs.simulation_only
) order by cs.effective_at desc), '[]'::jsonb) as signal_timeline
from clinical_signals cs
join patient_summaries ps on ps.id = cs.patient_summary_id
where ps.fictional_scenario is true
  and cs.simulation_only is true
  and cs.synthetic_patient_ref = $1;
```

- [ ] **Step 4: Create suggestion read query**

Create `database/queries/simulationRiskSuggestions.sql`:

```sql
/*
  SafeFlow simulation risk suggestion read contract.
  Returns nurse-confirmed workflow proposals for fictional patients only.
*/

select coalesce(jsonb_agg(jsonb_build_object(
  'suggestionId', rs.id,
  'predictionId', rp.id,
  'syntheticPatientRef', ps.synthetic_patient_ref,
  'riskType', rp.risk_type,
  'riskTier', rp.risk_tier,
  'riskScore', rp.risk_score,
  'status', rs.status,
  'title', rs.title,
  'suggestedFlag', rs.suggested_flag,
  'suggestedBlocker', rs.suggested_blocker,
  'suggestedTask', rs.suggested_task,
  'evidence', rs.evidence,
  'missingData', rs.missing_data,
  'modelVersion', rp.model_version,
  'featureSetVersion', rp.feature_set_version,
  'requiresHumanReview', rp.requires_human_review,
  'createdAt', rs.created_at
) order by rs.created_at desc), '[]'::jsonb) as risk_suggestions
from risk_suggestions rs
join risk_predictions rp on rp.id = rs.prediction_id
join patient_summaries ps on ps.id = rs.patient_summary_id
where ps.fictional_scenario is true
  and rs.simulation_only is true
  and rp.simulation_only is true
  and ($1::text is null or ps.synthetic_patient_ref = $1)
  and ($2::text is null or rs.status = $2);
```

- [ ] **Step 5: Create suggestion action query**

Create `database/queries/recordSimulationSuggestionAction.sql`:

```sql
/*
  SafeFlow simulation suggestion action contract.
  Updates a fictional suggestion only after recording an auditable nurse action.
*/

with target_suggestion as (
  select rs.id, rs.patient_summary_id
  from risk_suggestions rs
  join patient_summaries ps on ps.id = rs.patient_summary_id
  where rs.id = $1::uuid
    and ps.fictional_scenario is true
    and rs.simulation_only is true
  limit 1
),
actor as (
  select id from users
  where external_subject_ref = coalesce($4::text, 'fictional-user-laura-bennett')
  limit 1
),
action_insert as (
  insert into suggestion_actions (
    suggestion_id,
    actor_user_id,
    action_type,
    action_reason,
    metadata
  )
  select
    target_suggestion.id,
    (select id from actor),
    $2::text,
    $3::text,
    coalesce($5::jsonb, '{}'::jsonb)
  from target_suggestion
  returning id, suggestion_id, action_type, action_reason, occurred_at
),
suggestion_update as (
  update risk_suggestions
  set status = (select action_type from action_insert limit 1),
      updated_at = now()
  where id = (select suggestion_id from action_insert limit 1)
  returning id, status
)
select jsonb_build_object(
  'actionId', action_insert.id,
  'suggestionId', action_insert.suggestion_id,
  'status', suggestion_update.status,
  'actionType', action_insert.action_type,
  'actionReason', action_insert.action_reason,
  'occurredAt', action_insert.occurred_at
) as suggestion_action
from action_insert
join suggestion_update on suggestion_update.id = action_insert.suggestion_id;
```

- [ ] **Step 6: Bundle new queries**

Modify the query file list in `infra/aws/copyMigratorAssets.mjs`:

```js
for (const fileName of [
  'insertSimulationAuditEvent.sql',
  'listSimulationAuditEvents.sql',
  'recordSimulationSuggestionAction.sql',
  'simulationRiskSuggestions.sql',
  'simulationSignalTimeline.sql',
  'simulationWorkspace.sql'
]) {
  cpSync(join(inputDir, 'database', 'queries', fileName), join(outputQueriesDir, fileName));
}
```

- [ ] **Step 7: Run query asset test**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run infra/aws/copyMigratorAssets.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add database/queries/simulationSignalTimeline.sql database/queries/simulationRiskSuggestions.sql database/queries/recordSimulationSuggestionAction.sql infra/aws/copyMigratorAssets.mjs infra/aws/copyMigratorAssets.test.js
git commit -m "feat: add signal intelligence query contracts"
```

## Task 4: Add Server Signal Provider

**Files:**
- Create: `server/signalProvider.js`
- Create: `server/signalProvider.test.js`

- [ ] **Step 1: Write failing provider tests**

Create `server/signalProvider.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import {
  createConfiguredSignalProvider,
  createDatabaseSignalProvider,
  createLocalSignalProvider
} from './signalProvider.js';

function createPoolFactory({ rows = [] } = {}) {
  const query = vi.fn(async () => ({ rows }));
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });

  return { Pool, query, end };
}

describe('signal provider', () => {
  it('returns local fictional signals when no database is configured', async () => {
    const provider = createLocalSignalProvider();
    const signals = await provider.listPatientSignals({ patientId: 'DCU-031' });

    expect(provider.id).toBe('local-simulation-signals');
    expect(signals[0]).toMatchObject({
      syntheticPatientRef: 'DCU-031',
      sourceSystem: 'simulation-ice',
      simulationOnly: true
    });
    expect(JSON.stringify(signals)).not.toMatch(/nhs_number|date_of_birth|postcode|address/i);
  });

  it('loads database signals through the approved query and closes the pool', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{ signal_timeline: [{ signalId: 'signal-1', syntheticPatientRef: 'DCU-031', simulationOnly: true }] }]
    });
    const provider = createDatabaseSignalProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true', DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    });

    const signals = await provider.listPatientSignals({ patientId: 'DCU-031' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('fictional_scenario is true'), ['DCU-031']);
    expect(end).toHaveBeenCalledTimes(1);
    expect(signals).toEqual([{ signalId: 'signal-1', syntheticPatientRef: 'DCU-031', simulationOnly: true }]);
  });

  it('refuses database mode outside simulation-only mode', () => {
    expect(() => createDatabaseSignalProvider({
      env: { DATABASE_URL: 'postgres://example/safeflow' }
    })).toThrow(/SAFEFLOW_SIMULATION_ONLY=true/);
  });

  it('selects local provider without database configuration', () => {
    expect(createConfiguredSignalProvider({ env: {} }).id).toBe('local-simulation-signals');
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/signalProvider.test.js --configLoader runner
```

Expected: FAIL because `server/signalProvider.js` does not exist.

- [ ] **Step 3: Implement provider**

Create `server/signalProvider.js`:

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool as PgPool } from 'pg';

const SIGNAL_TIMELINE_QUERY_PATH = 'database/queries/simulationSignalTimeline.sql';

const localSignals = [
  {
    signalId: 'signal-dcu-031-potassium-0910',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'potassium',
    displayName: 'Potassium',
    value: '3.1',
    unit: 'mmol/L',
    referenceRange: '3.5-5.3',
    status: 'final',
    collectedAt: '2026-06-10T08:55:00.000Z',
    resultedAt: '2026-06-10T09:10:00.000Z',
    receivedAt: '2026-06-10T09:10:30.000Z',
    effectiveAt: '2026-06-10T09:10:00.000Z',
    sourceFreshness: 'current',
    confidence: 0.98,
    provenance: { feed: 'simulation', messageType: 'ice_pathology_result', directCareIdentifiers: false },
    simulationOnly: true
  },
  {
    signalId: 'signal-dcu-031-magnesium-missing',
    syntheticPatientRef: 'DCU-031',
    sourceSystem: 'simulation-ice',
    sourceType: 'lab',
    signalCode: 'magnesium',
    displayName: 'Magnesium',
    value: null,
    unit: 'mmol/L',
    referenceRange: '0.7-1.0',
    status: 'missing',
    receivedAt: '2026-06-10T09:10:30.000Z',
    effectiveAt: '2026-06-10T09:10:30.000Z',
    sourceFreshness: 'current',
    confidence: 0.9,
    provenance: { feed: 'simulation', messageType: 'expected_pathology_result', directCareIdentifiers: false },
    simulationOnly: true
  }
];

export function createLocalSignalProvider() {
  return {
    id: 'local-simulation-signals',
    async listPatientSignals({ patientId }) {
      return localSignals.filter((signal) => signal.syntheticPatientRef === patientId);
    }
  };
}

export function createDatabaseSignalProvider({
  env = process.env,
  Pool = PgPool,
  poolConfig,
  queryPath = SIGNAL_TIMELINE_QUERY_PATH
} = {}) {
  if (env.SAFEFLOW_SIMULATION_ONLY !== 'true') {
    throw new Error('Database signal mode requires SAFEFLOW_SIMULATION_ONLY=true');
  }
  if (!env.DATABASE_URL && !poolConfig) {
    throw new Error('Database signal mode requires DATABASE_URL');
  }

  return {
    id: 'postgresql-simulation-signals',
    async listPatientSignals({ patientId }) {
      const pool = new Pool(createPoolConfig({ env, poolConfig }));
      try {
        const query = readFileSync(resolve(process.cwd(), queryPath), 'utf8');
        const result = await pool.query(query, [patientId]);
        const payload = result.rows[0]?.signal_timeline ?? [];
        const signals = typeof payload === 'string' ? JSON.parse(payload) : payload;

        if (!Array.isArray(signals) || signals.some((signal) => signal.simulationOnly !== true)) {
          throw new Error('Signal read model returned a non-simulation payload');
        }

        return signals;
      } finally {
        await pool.end();
      }
    }
  };
}

export function createConfiguredSignalProvider({ env = process.env, Pool = PgPool, poolConfig } = {}) {
  if (!env.DATABASE_URL && !poolConfig) {
    return createLocalSignalProvider();
  }

  return createDatabaseSignalProvider({ env, Pool, poolConfig });
}

function createPoolConfig({ env, poolConfig }) {
  if (poolConfig) {
    return { max: 1, application_name: 'safeflow-simulation-signals', ...poolConfig };
  }

  return {
    connectionString: env.DATABASE_URL,
    max: 1,
    application_name: 'safeflow-simulation-signals'
  };
}
```

- [ ] **Step 4: Run provider tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/signalProvider.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add server/signalProvider.js server/signalProvider.test.js
git commit -m "feat: add simulation signal provider"
```

## Task 5: Add Shadow Risk Engine

**Files:**
- Create: `server/riskEngine/simulationFeatureBuilder.js`
- Create: `server/riskEngine/simulationFeatureBuilder.test.js`
- Create: `server/riskEngine/simulationRiskEngine.js`
- Create: `server/riskEngine/simulationRiskEngine.test.js`

- [ ] **Step 1: Write feature builder tests**

Create `server/riskEngine/simulationFeatureBuilder.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { buildSimulationFeatures } from './simulationFeatureBuilder.js';

describe('buildSimulationFeatures', () => {
  it('turns combined signals into missed-action features without identifiers', () => {
    const features = buildSimulationFeatures({
      patientId: 'DCU-031',
      signals: [
        { signalCode: 'potassium', value: '3.1', status: 'final', sourceFreshness: 'current', effectiveAt: '2026-06-10T09:10:00.000Z' },
        { signalCode: 'magnesium', value: null, status: 'missing', sourceFreshness: 'current', effectiveAt: '2026-06-10T09:10:30.000Z' },
        { signalCode: 'NEWS2', value: '7', status: 'final', sourceFreshness: 'current', effectiveAt: '2026-06-10T09:15:00.000Z' }
      ],
      workflowEvidence: { acknowledgedSignalIds: [], openTaskTitles: [], activeEscalationReasons: [] }
    });

    expect(features).toMatchObject({
      patientId: 'DCU-031',
      featureSetVersion: 'signal-features-v0',
      potassiumLow: true,
      magnesiumMissing: true,
      news2High: true,
      hasAcknowledgement: false,
      directCareIdentifiers: false
    });
    expect(JSON.stringify(features)).not.toMatch(/nhs_number|date_of_birth|postcode|address/i);
  });
});
```

- [ ] **Step 2: Write risk engine tests**

Create `server/riskEngine/simulationRiskEngine.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { evaluateSimulationRisk } from './simulationRiskEngine.js';

describe('evaluateSimulationRisk', () => {
  it('creates an urgent missed-action suggestion for abnormal signals without acknowledgement', () => {
    const result = evaluateSimulationRisk({
      patientId: 'DCU-031',
      features: {
        featureSetVersion: 'signal-features-v0',
        potassiumLow: true,
        magnesiumMissing: true,
        news2High: true,
        microbiologyPositive: false,
        hasAcknowledgement: false,
        sourceUnavailable: false
      }
    });

    expect(result).toMatchObject({
      riskType: 'missed_action',
      riskTier: 'urgent',
      modelVersion: 'simulation-risk-v0',
      featureSetVersion: 'signal-features-v0',
      requiresHumanReview: true,
      suggestion: {
        suggestedFlag: 'Electrolyte result review may be needed',
        suggestedBlocker: 'Unresolved abnormal blood result',
        suggestedTask: 'Review blood trend and document action'
      }
    });
    expect(result.riskScore).toBeGreaterThanOrEqual(0.8);
  });

  it('suppresses clinical-action risk when source data is unavailable', () => {
    const result = evaluateSimulationRisk({
      patientId: 'DCU-031',
      features: {
        featureSetVersion: 'signal-features-v0',
        potassiumLow: false,
        magnesiumMissing: false,
        news2High: false,
        microbiologyPositive: false,
        hasAcknowledgement: false,
        sourceUnavailable: true
      }
    });

    expect(result).toMatchObject({
      riskTier: 'info',
      suggestion: {
        suggestedFlag: 'Source data unavailable',
        suggestedBlocker: 'Clinical feed unavailable',
        suggestedTask: 'Check source feed status'
      }
    });
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/riskEngine/simulationFeatureBuilder.test.js server/riskEngine/simulationRiskEngine.test.js --configLoader runner
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 4: Implement feature builder**

Create `server/riskEngine/simulationFeatureBuilder.js`:

```js
export function buildSimulationFeatures({
  patientId,
  signals = [],
  workflowEvidence = {}
} = {}) {
  const byCode = new Map(signals.map((signal) => [signal.signalCode, signal]));
  const potassiumValue = Number(byCode.get('potassium')?.value);
  const news2Value = Number(byCode.get('NEWS2')?.value);

  return {
    patientId,
    featureSetVersion: 'signal-features-v0',
    potassiumLow: Number.isFinite(potassiumValue) && potassiumValue < 3.5,
    magnesiumMissing: byCode.get('magnesium')?.status === 'missing',
    news2High: Number.isFinite(news2Value) && news2Value >= 5,
    microbiologyPositive: signals.some((signal) =>
      signal.sourceType === 'microbiology' && /positive|growth/i.test(String(signal.value ?? signal.signalValue ?? ''))
    ),
    sourceUnavailable: signals.some((signal) => signal.sourceFreshness === 'unavailable' || signal.status === 'unavailable'),
    hasAcknowledgement: (workflowEvidence.acknowledgedSignalIds ?? []).length > 0,
    openTaskCount: (workflowEvidence.openTaskTitles ?? []).length,
    activeEscalationCount: (workflowEvidence.activeEscalationReasons ?? []).length,
    directCareIdentifiers: false
  };
}
```

- [ ] **Step 5: Implement risk engine**

Create `server/riskEngine/simulationRiskEngine.js`:

```js
export function evaluateSimulationRisk({ patientId, features }) {
  if (features.sourceUnavailable) {
    return createResult({
      patientId,
      riskScore: 0.2,
      riskTier: 'info',
      topContributors: ['source_unavailable'],
      suggestion: {
        title: 'Source data unavailable',
        suggestedFlag: 'Source data unavailable',
        suggestedBlocker: 'Clinical feed unavailable',
        suggestedTask: 'Check source feed status',
        evidence: [],
        missingData: ['Source feed unavailable']
      }
    });
  }

  const contributors = [];
  if (features.potassiumLow) contributors.push('potassium_low');
  if (features.magnesiumMissing) contributors.push('magnesium_missing');
  if (features.news2High) contributors.push('news2_high');
  if (features.microbiologyPositive) contributors.push('microbiology_positive');
  if (!features.hasAcknowledgement) contributors.push('no_recent_acknowledgement');

  const score = Math.min(0.95, 0.25 + contributors.length * 0.13);
  const riskTier = score >= 0.8 ? 'urgent' : score >= 0.55 ? 'watch' : 'info';

  return createResult({
    patientId,
    riskScore: Number(score.toFixed(3)),
    riskTier,
    topContributors: contributors,
    suggestion: {
      title: 'Electrolyte result review may be needed',
      suggestedFlag: 'Electrolyte result review may be needed',
      suggestedBlocker: 'Unresolved abnormal blood result',
      suggestedTask: 'Review blood trend and document action',
      evidence: contributors.map((contributor) => ({ label: contributor.replaceAll('_', ' ') })),
      missingData: features.magnesiumMissing ? ['Magnesium result not visible'] : []
    }
  });
}

function createResult({ patientId, riskScore, riskTier, topContributors, suggestion }) {
  return {
    patientId,
    riskType: 'missed_action',
    riskScore,
    riskTier,
    modelVersion: 'simulation-risk-v0',
    featureSetVersion: 'signal-features-v0',
    topContributors,
    uncertainty: 'medium',
    requiresHumanReview: true,
    simulationOnly: true,
    suggestion
  };
}
```

- [ ] **Step 6: Run risk engine tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/riskEngine/simulationFeatureBuilder.test.js server/riskEngine/simulationRiskEngine.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add server/riskEngine/simulationFeatureBuilder.js server/riskEngine/simulationFeatureBuilder.test.js server/riskEngine/simulationRiskEngine.js server/riskEngine/simulationRiskEngine.test.js
git commit -m "feat: add simulation risk engine"
```

## Task 6: Add Suggestion Provider And API Routes

**Files:**
- Create: `server/suggestionProvider.js`
- Create: `server/suggestionProvider.test.js`
- Modify: `server/api.js`
- Modify: `server/api.test.js`
- Modify: `server/readinessReport.js`
- Modify: `server/readinessReport.test.js`

- [ ] **Step 1: Write provider tests**

Create `server/suggestionProvider.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import {
  createConfiguredSuggestionProvider,
  createDatabaseSuggestionProvider,
  createLocalSuggestionProvider
} from './suggestionProvider.js';

function createPoolFactory({ rows = [] } = {}) {
  const query = vi.fn(async () => ({ rows }));
  const end = vi.fn(async () => {});
  const Pool = vi.fn(function Pool() {
    return { query, end };
  });
  return { Pool, query, end };
}

describe('suggestion provider', () => {
  it('lists local simulation suggestions', async () => {
    const provider = createLocalSuggestionProvider();
    const suggestions = await provider.listSuggestions({ patientId: 'DCU-031' });

    expect(provider.id).toBe('local-simulation-risk-suggestions');
    expect(suggestions[0]).toMatchObject({
      syntheticPatientRef: 'DCU-031',
      status: 'suggested',
      requiresHumanReview: true
    });
  });

  it('records local nurse actions and updates suggestion status', async () => {
    const provider = createLocalSuggestionProvider();
    const action = await provider.recordAction({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    });

    expect(action).toMatchObject({
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      status: 'accepted',
      actionType: 'accepted'
    });
  });

  it('uses database query contracts for read and action writes', async () => {
    const { Pool, query, end } = createPoolFactory({
      rows: [{ risk_suggestions: [{ suggestionId: 'suggestion-1', simulationOnly: true }] }]
    });
    const provider = createDatabaseSuggestionProvider({
      env: { SAFEFLOW_SIMULATION_ONLY: 'true', DATABASE_URL: 'postgres://example/safeflow' },
      Pool
    });

    const suggestions = await provider.listSuggestions({ patientId: 'DCU-031', status: 'suggested' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('fictional_scenario is true'), ['DCU-031', 'suggested']);
    expect(end).toHaveBeenCalledTimes(1);
    expect(suggestions).toEqual([{ suggestionId: 'suggestion-1', simulationOnly: true }]);
  });

  it('selects local provider without database configuration', () => {
    expect(createConfiguredSuggestionProvider({ env: {} }).id).toBe('local-simulation-risk-suggestions');
  });
});
```

- [ ] **Step 2: Run provider test and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/suggestionProvider.test.js --configLoader runner
```

Expected: FAIL because `server/suggestionProvider.js` does not exist.

- [ ] **Step 3: Implement provider**

Create `server/suggestionProvider.js` with local and database providers mirroring `server/signalProvider.js`. Use these constants:

```js
const SUGGESTION_QUERY_PATH = 'database/queries/simulationRiskSuggestions.sql';
const SUGGESTION_ACTION_QUERY_PATH = 'database/queries/recordSimulationSuggestionAction.sql';
const actionTypes = new Set(['accepted', 'dismissed', 'snoozed', 'escalated', 'converted_to_task', 'converted_to_blocker', 'resolved']);
```

The local default suggestion must be:

```js
{
  suggestionId: 'suggestion-dcu-031-electrolyte-review',
  syntheticPatientRef: 'DCU-031',
  riskType: 'missed_action',
  riskTier: 'urgent',
  riskScore: 0.86,
  status: 'suggested',
  title: 'Electrolyte result review may be needed',
  suggestedFlag: 'Electrolyte result review may be needed',
  suggestedBlocker: 'Unresolved abnormal blood result',
  suggestedTask: 'Review blood trend and document action',
  evidence: [
    { label: 'Potassium 3.1 mmol/L final at 09:10' },
    { label: 'Magnesium result not visible' },
    { label: 'NEWS2 7 at 09:15' }
  ],
  missingData: ['Magnesium result not visible'],
  modelVersion: 'simulation-risk-v0',
  featureSetVersion: 'signal-features-v0',
  requiresHumanReview: true,
  simulationOnly: true
}
```

`recordAction(input)` must reject unknown `actionType` with an error whose `statusCode` is `400`, and must never include direct identifiers or secrets in returned payloads.

- [ ] **Step 4: Run provider tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/suggestionProvider.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 5: Add API route tests**

Add tests to `server/api.test.js`:

```js
it('returns simulation signal timeline and risk suggestions', async () => {
  const signalProvider = {
    id: 'local-simulation-signals',
    listPatientSignals: vi.fn(async () => [{ signalId: 'signal-1', syntheticPatientRef: 'DCU-031', simulationOnly: true }])
  };
  const suggestionProvider = {
    id: 'local-simulation-risk-suggestions',
    listSuggestions: vi.fn(async () => [{ suggestionId: 'suggestion-1', syntheticPatientRef: 'DCU-031', requiresHumanReview: true }])
  };
  const handler = createApiHandler({ signalProvider, suggestionProvider });

  const signals = await invoke(handler, { method: 'GET', url: '/api/simulation/signals?patientId=DCU-031' });
  const suggestions = await invoke(handler, { method: 'GET', url: '/api/simulation/risk-suggestions?patientId=DCU-031' });

  expect(signals.statusCode).toBe(200);
  expect(JSON.parse(signals.body).signals).toHaveLength(1);
  expect(suggestions.statusCode).toBe(200);
  expect(JSON.parse(suggestions.body).suggestions).toHaveLength(1);
});

it('records nurse suggestion actions through the simulation API', async () => {
  const suggestionProvider = {
    id: 'local-simulation-risk-suggestions',
    recordAction: vi.fn(async () => ({
      suggestionId: 'suggestion-1',
      status: 'accepted',
      actionType: 'accepted'
    }))
  };
  const handler = createApiHandler({ suggestionProvider });

  const response = await invoke(handler, {
    method: 'POST',
    url: '/api/simulation/risk-suggestions/suggestion-1/actions',
    body: {
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    }
  });

  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body).action).toMatchObject({ status: 'accepted' });
});
```

- [ ] **Step 6: Run API tests and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/api.test.js --configLoader runner
```

Expected: FAIL because the API has no signal or suggestion routes.

- [ ] **Step 7: Wire API routes**

Modify `server/api.js`:

```js
import { createConfiguredSignalProvider } from './signalProvider.js';
import { createConfiguredSuggestionProvider } from './suggestionProvider.js';
```

Extend `createApiHandler` parameters:

```js
signalProvider = createConfiguredSignalProvider({ env }),
suggestionProvider = createConfiguredSuggestionProvider({ env })
```

Add routes before draft route:

```js
if (req.method === 'GET' && pathname === '/api/simulation/signals') {
  const patientId = searchParams.get('patientId');
  writeJson(res, 200, {
    product: 'SafeFlow',
    simulationOnly: true,
    source: signalProvider.id,
    signals: await signalProvider.listPatientSignals({ patientId })
  });
  return;
}

if (req.method === 'GET' && pathname === '/api/simulation/risk-suggestions') {
  writeJson(res, 200, {
    product: 'SafeFlow',
    simulationOnly: true,
    source: suggestionProvider.id,
    suggestions: await suggestionProvider.listSuggestions({
      patientId: searchParams.get('patientId'),
      status: searchParams.get('status')
    })
  });
  return;
}

const suggestionActionMatch = pathname.match(/^\/api\/simulation\/risk-suggestions\/([^/]+)\/actions$/);
if (req.method === 'POST' && suggestionActionMatch) {
  const body = await readJson(req);
  const action = await suggestionProvider.recordAction({
    suggestionId: suggestionActionMatch[1],
    ...body
  });
  writeJson(res, 201, { action });
  return;
}
```

Extend `createSimulationReadinessReport` input and output with provider ids for `signals` and `suggestions`.

- [ ] **Step 8: Run API/readiness/provider tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run server/api.test.js server/readinessReport.test.js server/suggestionProvider.test.js server/signalProvider.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add server/api.js server/api.test.js server/readinessReport.js server/readinessReport.test.js server/suggestionProvider.js server/suggestionProvider.test.js
git commit -m "feat: expose simulation risk suggestions API"
```

## Task 7: Wire Private Lambda Routes

**Files:**
- Modify: `infra/aws/lambda/safeflowApi/index.mjs`
- Modify: `infra/aws/lambda/safeflowApi/index.test.js`

- [ ] **Step 1: Add Lambda route tests**

Add tests to `infra/aws/lambda/safeflowApi/index.test.js`:

```js
it('returns private simulation signals from PostgreSQL in database mode', async () => {
  const { Pool } = createPoolFactory({
    rows: [{ signal_timeline: [{ signalId: 'signal-1', syntheticPatientRef: 'DCU-031', simulationOnly: true }] }]
  });
  const apiHandler = createSafeFlowApiHandler({
    Pool,
    readSecret: async () => JSON.stringify({
      username: 'safeflow_api',
      password: 'secret-password',
      host: 'private-rds.example',
      port: 5432,
      dbname: 'safeflow'
    }),
    env: {
      SAFEFLOW_ENVIRONMENT: 'simulation',
      SAFEFLOW_SIMULATION_ONLY: 'true',
      DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
      SAFEFLOW_DATA_MODE: 'database'
    }
  });

  const response = await apiHandler({
    requestContext: { http: { method: 'GET', path: '/api/simulation/signals' } },
    queryStringParameters: { patientId: 'DCU-031' }
  });

  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).source).toBe('postgresql-simulation-signals');
});
```

Add this test for `GET /api/simulation/risk-suggestions`:

```js
it('returns private simulation risk suggestions from PostgreSQL in database mode', async () => {
  const { Pool } = createPoolFactory({
    rows: [{ risk_suggestions: [{ suggestionId: 'suggestion-1', syntheticPatientRef: 'DCU-031', requiresHumanReview: true, simulationOnly: true }] }]
  });
  const apiHandler = createSafeFlowApiHandler({
    Pool,
    readSecret: async () => JSON.stringify({
      username: 'safeflow_api',
      password: 'secret-password',
      host: 'private-rds.example',
      port: 5432,
      dbname: 'safeflow'
    }),
    env: {
      SAFEFLOW_ENVIRONMENT: 'simulation',
      SAFEFLOW_SIMULATION_ONLY: 'true',
      DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
      SAFEFLOW_DATA_MODE: 'database'
    }
  });

  const response = await apiHandler({
    requestContext: { http: { method: 'GET', path: '/api/simulation/risk-suggestions' } },
    queryStringParameters: { patientId: 'DCU-031' }
  });

  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).source).toBe('postgresql-simulation-risk-suggestions');
});
```

Add this test for `POST /api/simulation/risk-suggestions/{id}/actions`:

```js
it('records private simulation risk suggestion actions in PostgreSQL', async () => {
  const { Pool } = createPoolFactory({
    rows: [{ suggestion_action: {
      actionId: 'action-1',
      suggestionId: '00000000-0000-0000-0000-000000000001',
      status: 'accepted',
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      occurredAt: '2026-06-10T09:20:00.000Z'
    } }]
  });
  const apiHandler = createSafeFlowApiHandler({
    Pool,
    readSecret: async () => JSON.stringify({
      username: 'safeflow_api',
      password: 'secret-password',
      host: 'private-rds.example',
      port: 5432,
      dbname: 'safeflow'
    }),
    env: {
      SAFEFLOW_ENVIRONMENT: 'simulation',
      SAFEFLOW_SIMULATION_ONLY: 'true',
      DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database',
      SAFEFLOW_DATA_MODE: 'database'
    }
  });

  const response = await apiHandler({
    requestContext: {
      http: {
        method: 'POST',
        path: '/api/simulation/risk-suggestions/00000000-0000-0000-0000-000000000001/actions'
      }
    },
    body: JSON.stringify({
      actionType: 'accepted',
      actionReason: 'Charge nurse reviewed fictional evidence',
      actorRef: 'fictional-user-laura-bennett'
    })
  });

  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body).action).toMatchObject({
    status: 'accepted',
    actionType: 'accepted'
  });
});
```

- [ ] **Step 2: Run Lambda tests and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run infra/aws/lambda/safeflowApi/index.test.js --configLoader runner
```

Expected: FAIL because Lambda has no signal/suggestion routes.

- [ ] **Step 3: Implement Lambda providers**

Import providers:

```js
import { createDatabaseSignalProvider } from '../../../../server/signalProvider.js';
import { createDatabaseSuggestionProvider } from '../../../../server/suggestionProvider.js';
```

Add providers to `createDatabaseProviders()`:

```js
signalProvider: createDatabaseSignalProvider({ env: providerEnv, Pool, poolConfig }),
suggestionProvider: createDatabaseSuggestionProvider({ env: providerEnv, Pool, poolConfig })
```

Add Lambda routes equivalent to server routes:

```js
if (method === 'GET' && path === '/api/simulation/signals') {
  const { signalProvider } = await createDatabaseProviders();
  return jsonResponse(200, {
    product: 'SafeFlow',
    simulationOnly: true,
    source: signalProvider.id,
    signals: await signalProvider.listPatientSignals({ patientId: event.queryStringParameters?.patientId })
  });
}
```

Implement suggestion GET and action POST using `suggestionProvider`.

- [ ] **Step 4: Run Lambda tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run infra/aws/lambda/safeflowApi/index.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add infra/aws/lambda/safeflowApi/index.mjs infra/aws/lambda/safeflowApi/index.test.js
git commit -m "feat: add private signal intelligence routes"
```

## Task 8: Add Frontend Clients And Local Suggestion State

**Files:**
- Create: `src/services/signalClient.js`
- Create: `src/services/signalClient.test.js`
- Modify: `src/state/simulationWorkspace.js`
- Modify: `src/state/simulationWorkspace.test.js`

- [ ] **Step 1: Write client tests**

Create `src/services/signalClient.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import {
  recordRiskSuggestionAction,
  requestRiskSuggestions,
  requestSignalTimeline
} from './signalClient.js';

describe('signalClient', () => {
  it('returns simulation-safe signal timelines and suggestions', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        simulationOnly: true,
        signals: [{ signalId: 'signal-1', simulationOnly: true }]
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        simulationOnly: true,
        suggestions: [{ suggestionId: 'suggestion-1', requiresHumanReview: true }]
      })));

    await expect(requestSignalTimeline({ patientId: 'DCU-031', fetchImpl })).resolves.toHaveLength(1);
    await expect(requestRiskSuggestions({ patientId: 'DCU-031', fetchImpl })).resolves.toHaveLength(1);
  });

  it('returns null for unsafe or unavailable responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ simulationOnly: false, signals: [] })));

    await expect(requestSignalTimeline({ patientId: 'DCU-031', fetchImpl })).resolves.toBeNull();
  });

  it('posts nurse confirmation actions', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      action: { suggestionId: 'suggestion-1', status: 'accepted' }
    }), { status: 201 }));

    await expect(recordRiskSuggestionAction({
      suggestionId: 'suggestion-1',
      actionType: 'accepted',
      actionReason: 'Reviewed',
      fetchImpl
    })).resolves.toEqual({ suggestionId: 'suggestion-1', status: 'accepted' });
  });
});
```

- [ ] **Step 2: Run client tests and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run src/services/signalClient.test.js --configLoader runner
```

Expected: FAIL because `src/services/signalClient.js` does not exist.

- [ ] **Step 3: Implement client**

Create `src/services/signalClient.js`:

```js
export async function requestSignalTimeline({ patientId, fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(`/api/simulation/signals?patientId=${encodeURIComponent(patientId)}`);
    const payload = await response.json();
    if (payload?.simulationOnly !== true || !Array.isArray(payload.signals)) return null;
    if (payload.signals.some((signal) => signal.simulationOnly !== true)) return null;
    return payload.signals;
  } catch {
    return null;
  }
}

export async function requestRiskSuggestions({ patientId, fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(`/api/simulation/risk-suggestions?patientId=${encodeURIComponent(patientId)}`);
    const payload = await response.json();
    if (payload?.simulationOnly !== true || !Array.isArray(payload.suggestions)) return null;
    if (payload.suggestions.some((suggestion) => suggestion.requiresHumanReview !== true)) return null;
    return payload.suggestions;
  } catch {
    return null;
  }
}

export async function recordRiskSuggestionAction({
  suggestionId,
  actionType,
  actionReason,
  actorRef = 'fictional-user-laura-bennett',
  fetchImpl = fetch
}) {
  try {
    const response = await fetchImpl(`/api/simulation/risk-suggestions/${encodeURIComponent(suggestionId)}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, actionReason, actorRef })
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.action ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Add reducer tests**

Add to `src/state/simulationWorkspace.test.js`:

```js
it('records nurse actions on intelligence suggestions', () => {
  const state = reduce({
    type: 'intelligence/suggestionActioned',
    payload: {
      suggestionId: 'suggestion-dcu-031-electrolyte-review',
      patientId: 'DCU-031',
      actionType: 'accepted',
      actionReason: 'Reviewed fictional evidence'
    }
  });

  expect(state.intelligence.suggestionActions[0]).toMatchObject({
    suggestionId: 'suggestion-dcu-031-electrolyte-review',
    actionType: 'accepted'
  });
  expect(state.auditEvents[0]).toMatchObject({
    label: 'Intelligence suggestion accepted',
    patientId: 'DCU-031'
  });
});
```

- [ ] **Step 5: Run reducer test and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run src/state/simulationWorkspace.test.js --configLoader runner
```

Expected: FAIL because the reducer has no `intelligence` state or action.

- [ ] **Step 6: Implement reducer state**

In `createInitialSimulationState()`, add:

```js
intelligence: {
  suggestionActions: []
}
```

In `simulationReducer`, add:

```js
case 'intelligence/suggestionActioned': {
  const { suggestionId, patientId, actionType, actionReason } = action.payload;
  if (!findPatient(state, patientId)) return state;

  const nextState = {
    ...state,
    intelligence: {
      ...state.intelligence,
      suggestionActions: [
        {
          id: action.payload.id ?? `suggestion-action-${state.intelligence.suggestionActions.length + 1}`,
          suggestionId,
          patientId,
          actionType,
          actionReason
        },
        ...state.intelligence.suggestionActions
      ]
    }
  };

  return withAudit(
    nextState,
    createWorkspaceAuditEvent(
      state,
      action,
      `Intelligence suggestion ${actionType}`,
      actionReason,
      patientId
    )
  );
}
```

- [ ] **Step 7: Run client and reducer tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run src/services/signalClient.test.js src/state/simulationWorkspace.test.js --configLoader runner
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/services/signalClient.js src/services/signalClient.test.js src/state/simulationWorkspace.js src/state/simulationWorkspace.test.js
git commit -m "feat: add client signal suggestion state"
```

## Task 9: Add Nurse Intelligence Panel

**Files:**
- Create: `src/components/IntelligencePanel.jsx`
- Create: `src/components/IntelligencePanel.test.jsx`
- Modify: `src/components/PatientSafetyPanel.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write component test**

Create `src/components/IntelligencePanel.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntelligencePanel } from './IntelligencePanel.jsx';

const suggestion = {
  suggestionId: 'suggestion-1',
  riskTier: 'urgent',
  title: 'Electrolyte result review may be needed',
  suggestedFlag: 'Electrolyte result review may be needed',
  suggestedBlocker: 'Unresolved abnormal blood result',
  suggestedTask: 'Review blood trend and document action',
  evidence: [{ label: 'Potassium 3.1 mmol/L final at 09:10' }],
  missingData: ['Magnesium result not visible'],
  requiresHumanReview: true
};

describe('IntelligencePanel', () => {
  it('shows evidence and lets the nurse accept a suggestion', async () => {
    const onAction = vi.fn();
    render(<IntelligencePanel onAction={onAction} suggestions={[suggestion]} />);

    expect(screen.getByText('Electrolyte result review may be needed')).toBeInTheDocument();
    expect(screen.getByText('Potassium 3.1 mmol/L final at 09:10')).toBeInTheDocument();
    expect(screen.getByText('Magnesium result not visible')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /accept suggestion/i }));

    expect(onAction).toHaveBeenCalledWith({
      suggestionId: 'suggestion-1',
      actionType: 'accepted',
      actionReason: 'Nurse accepted suggested SafeFlow intelligence item'
    });
  });
});
```

- [ ] **Step 2: Run component test and verify failure**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run src/components/IntelligencePanel.test.jsx --configLoader runner
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement component**

Create `src/components/IntelligencePanel.jsx`:

```jsx
import { BellRing, Check, Clock, X } from 'lucide-react';

export function IntelligencePanel({ suggestions = [], onAction }) {
  if (suggestions.length === 0) {
    return (
      <section className="intelligence-panel" aria-label="SafeFlow intelligence">
        <strong>No intelligence suggestions</strong>
        <span>SafeFlow has no current simulation suggestions for this patient.</span>
      </section>
    );
  }

  return (
    <section className="intelligence-panel" aria-label="SafeFlow intelligence">
      {suggestions.map((suggestion) => (
        <article className={`intelligence-suggestion ${suggestion.riskTier}`} key={suggestion.suggestionId}>
          <header>
            <BellRing aria-hidden="true" size={18} />
            <div>
              <strong>{suggestion.title}</strong>
              <span>{suggestion.riskTier} · requires nurse confirmation</span>
            </div>
          </header>
          <dl>
            <div><dt>Flag</dt><dd>{suggestion.suggestedFlag}</dd></div>
            <div><dt>Blocker</dt><dd>{suggestion.suggestedBlocker}</dd></div>
            <div><dt>Task</dt><dd>{suggestion.suggestedTask}</dd></div>
          </dl>
          <ul aria-label="Evidence">
            {(suggestion.evidence ?? []).map((item, index) => <li key={`${suggestion.suggestionId}-evidence-${index}`}>{item.label}</li>)}
          </ul>
          {(suggestion.missingData ?? []).length > 0 && (
            <p className="missing-data">Missing: {suggestion.missingData.join(', ')}</p>
          )}
          <div className="suggestion-actions">
            <button aria-label="Accept suggestion" onClick={() => onAction({
              suggestionId: suggestion.suggestionId,
              actionType: 'accepted',
              actionReason: 'Nurse accepted suggested SafeFlow intelligence item'
            })} type="button"><Check aria-hidden="true" size={16} /></button>
            <button aria-label="Snooze suggestion" onClick={() => onAction({
              suggestionId: suggestion.suggestionId,
              actionType: 'snoozed',
              actionReason: 'Nurse snoozed suggested SafeFlow intelligence item'
            })} type="button"><Clock aria-hidden="true" size={16} /></button>
            <button aria-label="Dismiss suggestion" onClick={() => onAction({
              suggestionId: suggestion.suggestionId,
              actionType: 'dismissed',
              actionReason: 'Nurse dismissed suggested SafeFlow intelligence item'
            })} type="button"><X aria-hidden="true" size={16} /></button>
          </div>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Wire panel into patient panel**

Modify `src/components/PatientSafetyPanel.jsx` to accept `intelligenceSuggestions` and `onIntelligenceAction`, then render:

```jsx
<IntelligencePanel
  onAction={onIntelligenceAction}
  suggestions={intelligenceSuggestions}
/>
```

Place this in the safety overview area near existing flags. Keep existing tabs working.

- [ ] **Step 5: Wire App state and server mirroring**

In `src/App.jsx`, import client functions:

```js
import {
  recordRiskSuggestionAction,
  requestRiskSuggestions,
  requestSignalTimeline
} from './services/signalClient.js';
```

Add state:

```js
const [riskSuggestions, setRiskSuggestions] = useState([]);
const [signalTimeline, setSignalTimeline] = useState([]);
```

When selecting a patient, call:

```js
void requestSignalTimeline({ patientId: nextPatient.id }).then((signals) => setSignalTimeline(signals ?? []));
void requestRiskSuggestions({ patientId: nextPatient.id }).then((suggestions) => setRiskSuggestions(suggestions ?? []));
```

Add handler:

```js
async function handleIntelligenceAction(action) {
  dispatch({
    type: 'intelligence/suggestionActioned',
    payload: {
      ...action,
      patientId: selectedPatient.id
    }
  });
  const result = await recordRiskSuggestionAction(action);
  setDraftStatus(result ? `Intelligence suggestion ${result.status}` : 'Intelligence action saved locally');
}
```

Pass to `PatientSafetyPanel`:

```jsx
intelligenceSuggestions={riskSuggestions}
onIntelligenceAction={handleIntelligenceAction}
signalTimeline={signalTimeline}
```

- [ ] **Step 6: Add styles**

Add to `src/styles.css`:

```css
.intelligence-panel {
  display: grid;
  gap: 0.75rem;
}

.intelligence-suggestion {
  border: 1px solid #c7d7ef;
  border-radius: 8px;
  padding: 0.75rem;
  background: #f8fbff;
}

.intelligence-suggestion.urgent {
  border-color: #d93838;
  background: #fff7f7;
}

.intelligence-suggestion header {
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
}

.intelligence-suggestion dl {
  display: grid;
  gap: 0.4rem;
  margin: 0.75rem 0;
}

.intelligence-suggestion dt {
  font-weight: 700;
}

.intelligence-suggestion dd {
  margin: 0;
}

.missing-data {
  color: #7a4a00;
  font-weight: 600;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
}
```

- [ ] **Step 7: Run component and app tests**

Run:

```powershell
node.exe .\node_modules\vitest\vitest.mjs run src/components/IntelligencePanel.test.jsx src/state/simulationWorkspace.test.js src/services/signalClient.test.js --configLoader runner
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/components/IntelligencePanel.jsx src/components/IntelligencePanel.test.jsx src/components/PatientSafetyPanel.jsx src/App.jsx src/styles.css
git commit -m "feat: add nurse intelligence panel"
```

## Task 10: Verification, Migration, Deploy And Smoke

**Files:**
- Modify only if tests reveal a bug in files already touched above.

- [ ] **Step 1: Run full local verification**

Run:

```powershell
npm test -- --configLoader runner
npm run build
git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run CDK diff**

Run with the existing simulation deployment guard:

```powershell
$env:AWS_PROFILE="safeflow-free-tier"
$env:AWS_REGION="eu-west-2"
$env:CDK_DEFAULT_REGION="eu-west-2"
$env:SAFEFLOW_ENVIRONMENT="simulation"
$env:SAFEFLOW_SIMULATION_ONLY="true"
$env:SAFEFLOW_ACCOUNT_MFA_CONFIRMED="true"
$env:SAFEFLOW_BUDGET_CONFIRMED="true"
$env:SAFEFLOW_DEPLOYMENT_APPROVED="true"
npm run infra:diff:simulation
```

Expected: Lambda code asset updates and no RDS replacement. If schema/seed checksums changed, migration Lambda code asset may also update.

- [ ] **Step 3: Deploy simulation stack**

Run:

```powershell
npm run infra:deploy:simulation -- --require-approval never
```

Expected: CloudFormation `UPDATE_COMPLETE`.

- [ ] **Step 4: Execute approved simulation migration**

Run:

```powershell
$functionName = aws cloudformation describe-stacks --stack-name safeflow-simulation-foundation --query "Stacks[0].Outputs[?OutputKey=='MigrationFunctionName'].OutputValue | [0]" --output text --profile safeflow-free-tier --region eu-west-2
$payloadPath = Join-Path $env:TEMP "safeflow-migration-signal-v0-payload.json"
$responsePath = Join-Path $env:TEMP "safeflow-migration-signal-v0-response.json"
@{ action = "execute-approved-simulation-migration"; approved = $true } | ConvertTo-Json -Compress | Set-Content -Encoding ascii $payloadPath
aws lambda invoke --function-name $functionName --cli-binary-format raw-in-base64-out --payload fileb://$payloadPath $responsePath --profile safeflow-free-tier --region eu-west-2
Get-Content -Raw $responsePath
```

Expected: Lambda `StatusCode` 200 and response body `statusCode` 200.

- [ ] **Step 5: Smoke-test private API routes**

Invoke:

```powershell
$functionName = aws cloudformation describe-stacks --stack-name safeflow-simulation-foundation --query "Stacks[0].Outputs[?OutputKey=='ApiFunctionName'].OutputValue | [0]" --output text --profile safeflow-free-tier --region eu-west-2
```

Use the existing temp-file Lambda invoke pattern from previous work to call:

- `GET /api/simulation/signals?patientId=DCU-031`
- `GET /api/simulation/risk-suggestions?patientId=DCU-031`
- `POST /api/simulation/risk-suggestions/{suggestionId}/actions`

Expected:

- Signals response source is `postgresql-simulation-signals`.
- Suggestions response source is `postgresql-simulation-risk-suggestions`.
- Action response status is `accepted`, `dismissed` or `snoozed`.
- No response includes direct identifiers, secrets, ARNs, database hostnames or raw source payloads.

- [ ] **Step 6: Confirm no stack drift**

Run:

```powershell
npm run infra:diff:simulation
```

Expected: `There were no differences`.

- [ ] **Step 7: Final commit and push**

If verification required a fix, stage the files shown by `git status --short` for this feature area:

```powershell
git status --short
git add database server src infra/aws
git commit -m "fix: verify simulation signal engine v0"
```

Push:

```powershell
git push origin codex/safeflow-prototype
```

Expected: branch pushed successfully.

## Self-Review Checklist

- Spec coverage: Phase 1 signal model is covered by Tasks 1-4. Phase 2 shadow risk engine is covered by Task 5 and provider/API wiring in Tasks 6-7. Phase 3 nurse confirmation workflow is covered by Tasks 6, 8 and 9. Verification/deployment is covered by Task 10.
- Safety coverage: simulation-only schema checks, provider payload checks, local client safety checks, no browser clinical-system access, no live ICE/EPR routes.
- Type consistency: `signalId`, `syntheticPatientRef`, `suggestionId`, `riskTier`, `riskScore`, `requiresHumanReview`, `evidence`, `missingData` are used consistently.
- Out of scope: live integration, real clinical model training, autonomous escalation, prescribing and EPR writeback are not included.
