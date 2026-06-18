with
seed_ward as (
  insert into wards (name, organisation_label, care_setting)
  values ('Day Care Unit', 'Cityview Community Hospital', 'simulation ward')
  on conflict (name) do update
    set organisation_label = excluded.organisation_label,
        care_setting = excluded.care_setting
  returning id
),
ward_ref as (
  select id from seed_ward
  union all
  select id from wards where name = 'Day Care Unit'
  limit 1
),
seed_users as (
  insert into users (external_subject_ref, display_name, role)
  values
    ('fictional-user-laura-bennett', 'Laura Bennett', 'charge_nurse'),
    ('fictional-user-sarah-khan', 'Sarah Khan', 'registered_nurse'),
    ('fictional-user-dr-ahmed', 'Dr J. Ahmed', 'doctor')
  on conflict (external_subject_ref) do update
    set display_name = excluded.display_name,
        role = excluded.role
  returning id, external_subject_ref
),
user_ref as (
  select id, external_subject_ref from seed_users
  union all
  select id, external_subject_ref from users
  where external_subject_ref in (
    'fictional-user-laura-bennett',
    'fictional-user-sarah-khan',
    'fictional-user-dr-ahmed'
  )
),
seed_patients as (
  insert into patient_summaries (
    ward_id,
    synthetic_patient_ref,
    display_label,
    age_band,
    sex_label,
    fictional_scenario,
    risk_level,
    responsible_user_id
  )
  values
    (
      (select id from ward_ref),
      'DCU-031',
      'Mrs A. Patel',
      'late 70s',
      'female',
      true,
      'high',
      (select id from user_ref where external_subject_ref = 'fictional-user-laura-bennett' limit 1)
    ),
    (
      (select id from ward_ref),
      'DCU-028',
      'Mr B. Johnson',
      'mid 60s',
      'male',
      true,
      'at_risk',
      (select id from user_ref where external_subject_ref = 'fictional-user-sarah-khan' limit 1)
    )
  on conflict (synthetic_patient_ref) do update
    set risk_level = excluded.risk_level,
        responsible_user_id = excluded.responsible_user_id
  returning id, synthetic_patient_ref
),
patient_ref as (
  select id, synthetic_patient_ref from seed_patients
  union all
  select id, synthetic_patient_ref from patient_summaries
  where synthetic_patient_ref in ('DCU-031', 'DCU-028')
),
seed_flags as (
  insert into safety_flags (
    patient_summary_id,
    created_by_user_id,
    title,
    category,
    severity,
    evidence_refs,
    status
  )
  values (
    (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
    (select id from user_ref where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
    'Electrolyte plan unclear after falling potassium trend',
    'documentation_gap',
    'urgent',
    '["labs.potassium", "medicines.furosemide", "notes.plan"]'::jsonb,
    'open'
  )
  on conflict (patient_summary_id, title) do update
    set category = excluded.category,
        severity = excluded.severity,
        evidence_refs = excluded.evidence_refs,
        status = excluded.status
  returning id, patient_summary_id
)
insert into audit_events (
  actor_user_id,
  patient_summary_id,
  event_type,
  event_summary,
  source_table,
  source_id,
  metadata,
  occurred_at
)
select
  (select id from user_ref where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  (select id from patient_ref where synthetic_patient_ref = 'DCU-031' limit 1),
  'simulation_seed_created',
  'Fictional SafeFlow Nursing discovery scenario seeded for Day Care Unit.',
  'safety_flags',
  (select id from seed_flags limit 1),
  '{"scope":"fictional","public_safe":true,"seed_key":"safeflow-day-care-unit-v1"}'::jsonb,
  '2026-06-10 09:00:00+00'::timestamptz
where not exists (
  select 1
  from audit_events
  where event_type = 'simulation_seed_created'
    and metadata ->> 'seed_key' = 'safeflow-day-care-unit-v1'
);

insert into observations (
  patient_summary_id,
  observed_by_user_id,
  observation_type,
  observed_value,
  score,
  source_label,
  observed_at
)
values
  (
    (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
    (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
    'NEWS2',
    '7',
    7,
    'fictional simulation',
    '2026-06-10 09:15:00+00'::timestamptz
  ),
  (
    (select id from patient_summaries where synthetic_patient_ref = 'DCU-028' limit 1),
    (select id from users where external_subject_ref = 'fictional-user-sarah-khan' limit 1),
    'NEWS2',
    '4',
    4,
    'fictional simulation',
    '2026-06-10 08:50:00+00'::timestamptz
  )
on conflict (patient_summary_id, observation_type, observed_at, source_label) do update
  set observed_value = excluded.observed_value,
      score = excluded.score,
      observed_by_user_id = excluded.observed_by_user_id;

insert into tasks (
  patient_summary_id,
  safety_flag_id,
  assigned_user_id,
  title,
  status,
  due_at
)
values (
  (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
  (select id from safety_flags where title = 'Electrolyte plan unclear after falling potassium trend' limit 1),
  (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  'Clarify documented electrolyte monitoring plan with medical team',
  'open',
  '2026-06-10 09:45:00+00'::timestamptz
)
on conflict (patient_summary_id, title) do update
  set safety_flag_id = excluded.safety_flag_id,
      assigned_user_id = excluded.assigned_user_id,
      status = excluded.status,
      due_at = excluded.due_at;

insert into escalations (
  patient_summary_id,
  safety_flag_id,
  escalated_by_user_id,
  escalation_target,
  reason,
  status,
  escalated_at
)
values (
  (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
  (select id from safety_flags where title = 'Electrolyte plan unclear after falling potassium trend' limit 1),
  (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  'medical review team',
  'Fictional scenario: NEWS2 risk and unclear monitoring plan need review.',
  'active',
  '2026-06-10 09:20:00+00'::timestamptz
)
on conflict (patient_summary_id, escalation_target, reason) do update
  set safety_flag_id = excluded.safety_flag_id,
      escalated_by_user_id = excluded.escalated_by_user_id,
      status = excluded.status;

insert into handover_items (
  patient_summary_id,
  owner_user_id,
  summary,
  readiness_percent,
  status
)
values (
  (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
  (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  'Fictional SBAR draft pending human review before shift handover.',
  75,
  'draft'
)
on conflict (patient_summary_id, summary) do update
  set owner_user_id = excluded.owner_user_id,
      readiness_percent = excluded.readiness_percent,
      status = excluded.status;

insert into discharge_blockers (
  patient_summary_id,
  owner_user_id,
  blocker_type,
  description,
  status
)
values (
  (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
  (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  'plan_unclear',
  'Monitoring and review plan not yet clear in the fictional discharge checklist.',
  'open'
)
on conflict (patient_summary_id, blocker_type, description) do update
  set owner_user_id = excluded.owner_user_id,
      status = excluded.status;

insert into draft_notes (
  patient_summary_id,
  safety_flag_id,
  created_by_user_id,
  provider_name,
  model_name,
  prompt_version,
  draft_type,
  draft_text,
  source_evidence,
  human_review_status
)
values (
  (select id from patient_summaries where synthetic_patient_ref = 'DCU-031' limit 1),
  (select id from safety_flags where title = 'Electrolyte plan unclear after falling potassium trend' limit 1),
  (select id from users where external_subject_ref = 'fictional-user-laura-bennett' limit 1),
  'deterministic',
  null,
  'sbar-v1',
  'sbar',
  '{"situation":"Fictional DCU-031 needs review for an unclear monitoring plan.","recommendation":"Please review the documented plan; this is not a treatment instruction."}'::jsonb,
  '["labs.potassium", "observations.NEWS2", "notes.plan"]'::jsonb,
  'needs_review'
)
on conflict (patient_summary_id, provider_name, prompt_version, draft_type) do update
  set safety_flag_id = excluded.safety_flag_id,
      draft_text = excluded.draft_text,
      source_evidence = excluded.source_evidence,
      human_review_status = excluded.human_review_status;

insert into discovery_scenarios (
  scenario_code,
  title,
  workflow_area,
  fictional_scenario,
  success_criteria
)
values (
  'SF-DISCOVERY-001',
  'Electrolyte documentation gap tabletop',
  'ward_safety_board',
  true,
  '["charge nurse can see the risk", "draft remains editable", "audit event captures the action"]'::jsonb
)
on conflict (scenario_code) do update
  set title = excluded.title,
      workflow_area = excluded.workflow_area,
      success_criteria = excluded.success_criteria;

insert into hazard_log_entries (
  scenario_id,
  hazard,
  control,
  owner_role,
  status
)
values (
  (select id from discovery_scenarios where scenario_code = 'SF-DISCOVERY-001' limit 1),
  'AI wording may sound like autonomous clinical advice.',
  'Draft output is evidence-bound, editable and labelled as requiring human review.',
  'clinical safety lead',
  'open'
)
on conflict (scenario_id, hazard) do update
  set control = excluded.control,
      owner_role = excluded.owner_role,
      status = excluded.status;
