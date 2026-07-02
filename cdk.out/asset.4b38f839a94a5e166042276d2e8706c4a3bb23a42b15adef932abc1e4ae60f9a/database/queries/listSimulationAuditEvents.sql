/*
  SafeFlow simulation audit event read contract.
  Returns public-safe audit metadata only for fictional patient summaries.
*/

select
  ae.id::text,
  ae.event_type,
  ae.event_summary,
  ps.synthetic_patient_ref,
  ae.occurred_at,
  ae.metadata
from audit_events ae
join patient_summaries ps
  on ps.id = ae.patient_summary_id
  and ps.fictional_scenario is true
order by ae.occurred_at desc
limit $1;
