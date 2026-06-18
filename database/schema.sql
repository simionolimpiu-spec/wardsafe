create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_subject_ref text not null unique,
  display_name text not null,
  role text not null check (role in ('charge_nurse', 'registered_nurse', 'doctor', 'admin', 'observer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  organisation_label text not null,
  care_setting text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patient_summaries (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards (id),
  synthetic_patient_ref text not null unique check (synthetic_patient_ref ~ '^DCU-[0-9]{3}$'),
  display_label text not null check (display_label ~ '^(Mr|Mrs|Ms|Mx) [A-Z]\. [A-Za-z-]+$'),
  age_band text not null,
  sex_label text not null,
  fictional_scenario boolean not null default true check (fictional_scenario is true),
  risk_level text not null check (risk_level in ('low', 'at_risk', 'high')),
  responsible_user_id uuid references users (id),
  current_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists observations (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  observed_by_user_id uuid references users (id),
  observation_type text not null,
  observed_value text not null,
  score integer check (score >= 0),
  source_label text not null default 'simulation',
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists safety_flags (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  created_by_user_id uuid references users (id),
  title text not null,
  category text not null,
  severity text not null check (severity in ('information', 'watch', 'urgent')),
  evidence_refs jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  safety_flag_id uuid references safety_flags (id),
  assigned_user_id uuid references users (id),
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists escalations (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  safety_flag_id uuid references safety_flags (id),
  escalated_by_user_id uuid not null references users (id),
  escalation_target text not null,
  reason text not null,
  status text not null default 'active' check (status in ('active', 'accepted', 'closed')),
  escalated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists handover_items (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  owner_user_id uuid references users (id),
  summary text not null,
  readiness_percent integer not null default 0 check (readiness_percent between 0 and 100),
  status text not null default 'draft' check (status in ('draft', 'ready', 'handed_over')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists discharge_blockers (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  owner_user_id uuid references users (id),
  blocker_type text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'cleared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists draft_notes (
  id uuid primary key default gen_random_uuid(),
  patient_summary_id uuid not null references patient_summaries (id),
  safety_flag_id uuid references safety_flags (id),
  created_by_user_id uuid not null references users (id),
  provider_name text not null,
  model_name text,
  prompt_version text not null,
  draft_type text not null check (draft_type in ('sbar', 'handover', 'learning_summary')),
  draft_text jsonb not null,
  source_evidence jsonb not null default '[]'::jsonb,
  human_review_status text not null default 'needs_review' check (human_review_status in ('needs_review', 'edited', 'approved', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users (id),
  patient_summary_id uuid references patient_summaries (id),
  event_type text not null,
  event_summary text not null,
  source_table text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists discovery_scenarios (
  id uuid primary key default gen_random_uuid(),
  scenario_code text not null unique,
  title text not null,
  workflow_area text not null,
  fictional_scenario boolean not null default true check (fictional_scenario is true),
  success_criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hazard_log_entries (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references discovery_scenarios (id),
  hazard text not null,
  control text not null,
  owner_role text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'controlled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_summaries_ward_id on patient_summaries (ward_id);
create index if not exists idx_observations_patient_summary_id on observations (patient_summary_id);
create index if not exists idx_safety_flags_patient_summary_id on safety_flags (patient_summary_id);
create index if not exists idx_tasks_patient_summary_id on tasks (patient_summary_id);
create index if not exists idx_escalations_patient_summary_id on escalations (patient_summary_id);
create index if not exists idx_handover_items_patient_summary_id on handover_items (patient_summary_id);
create index if not exists idx_discharge_blockers_patient_summary_id on discharge_blockers (patient_summary_id);
create index if not exists idx_draft_notes_patient_summary_id on draft_notes (patient_summary_id);
create index if not exists idx_audit_events_patient_summary_id on audit_events (patient_summary_id);
create index if not exists idx_audit_events_event_type on audit_events (event_type);
create unique index if not exists idx_observations_seed_unique on observations (patient_summary_id, observation_type, observed_at, source_label);
create unique index if not exists idx_safety_flags_seed_unique on safety_flags (patient_summary_id, title);
create unique index if not exists idx_tasks_seed_unique on tasks (patient_summary_id, title);
create unique index if not exists idx_escalations_seed_unique on escalations (patient_summary_id, escalation_target, reason);
create unique index if not exists idx_handover_items_seed_unique on handover_items (patient_summary_id, summary);
create unique index if not exists idx_discharge_blockers_seed_unique on discharge_blockers (patient_summary_id, blocker_type, description);
create unique index if not exists idx_draft_notes_seed_unique on draft_notes (patient_summary_id, provider_name, prompt_version, draft_type);
create unique index if not exists idx_hazard_log_entries_seed_unique on hazard_log_entries (scenario_id, hazard);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on users;
create trigger set_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists set_wards_updated_at on wards;
create trigger set_wards_updated_at
before update on wards
for each row execute function set_updated_at();

drop trigger if exists set_patient_summaries_updated_at on patient_summaries;
create trigger set_patient_summaries_updated_at
before update on patient_summaries
for each row execute function set_updated_at();

drop trigger if exists set_safety_flags_updated_at on safety_flags;
create trigger set_safety_flags_updated_at
before update on safety_flags
for each row execute function set_updated_at();

drop trigger if exists set_tasks_updated_at on tasks;
create trigger set_tasks_updated_at
before update on tasks
for each row execute function set_updated_at();

drop trigger if exists set_handover_items_updated_at on handover_items;
create trigger set_handover_items_updated_at
before update on handover_items
for each row execute function set_updated_at();

drop trigger if exists set_discharge_blockers_updated_at on discharge_blockers;
create trigger set_discharge_blockers_updated_at
before update on discharge_blockers
for each row execute function set_updated_at();

drop trigger if exists set_draft_notes_updated_at on draft_notes;
create trigger set_draft_notes_updated_at
before update on draft_notes
for each row execute function set_updated_at();

drop trigger if exists set_hazard_log_entries_updated_at on hazard_log_entries;
create trigger set_hazard_log_entries_updated_at
before update on hazard_log_entries
for each row execute function set_updated_at();

create or replace function prevent_audit_event_mutation()
returns trigger as $$
begin
  raise exception 'audit_events are append-only; insert a compensating event instead';
  return old;
end;
$$ language plpgsql;

drop trigger if exists prevent_audit_event_update on audit_events;
create trigger prevent_audit_event_update
before update on audit_events
for each row execute function prevent_audit_event_mutation();

drop trigger if exists prevent_audit_event_delete on audit_events;
create trigger prevent_audit_event_delete
before delete on audit_events
for each row execute function prevent_audit_event_mutation();
