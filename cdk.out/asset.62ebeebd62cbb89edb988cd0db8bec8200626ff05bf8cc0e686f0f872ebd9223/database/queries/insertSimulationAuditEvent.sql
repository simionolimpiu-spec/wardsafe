/*
  SafeFlow simulation audit event append contract.
  This is a reviewable query contract, not an approved migration.
  It appends to audit_events only when the supplied synthetic reference belongs
  to a fictional patient summary and returns public-safe event metadata.
*/

insert into audit_events (
  patient_summary_id,
  event_type,
  event_summary,
  source_table,
  metadata
)
select
  ps.id,
  $2,
  $3,
  $4,
  coalesce($5::jsonb, '{}'::jsonb)
from patient_summaries ps
where ps.synthetic_patient_ref = $1
  and ps.fictional_scenario is true
returning
  id::text,
  event_type,
  event_summary,
  $1 as synthetic_patient_ref,
  occurred_at;
