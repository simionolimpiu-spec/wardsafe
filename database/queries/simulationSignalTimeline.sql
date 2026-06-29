/*
  SafeFlow simulation signal timeline read contract.
  Returns fictional, simulation-only signal rows for a synthetic patient.
*/

select
  cs.id::text as signal_id,
  ps.synthetic_patient_ref,
  cs.source_system,
  cs.source_type,
  cs.signal_code,
  cs.display_name,
  cs.signal_value,
  cs.unit,
  cs.reference_range,
  cs.status,
  cs.collected_at,
  cs.resulted_at,
  cs.received_at,
  cs.effective_at,
  cs.source_freshness,
  cs.confidence,
  cs.provenance,
  cs.simulation_only
from clinical_signals cs
join patient_summaries ps
  on ps.id = cs.patient_summary_id
  and ps.fictional_scenario is true
where cs.simulation_only is true
  and ($1::text is null or ps.synthetic_patient_ref = $1)
order by cs.effective_at desc, cs.received_at desc;
