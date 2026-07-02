/*
  SafeFlow simulation workspace read model.
  This is a reviewable query contract, not an approved migration.
  It projects fictional PostgreSQL rows into the API workspace shape and
  deliberately filters out any non-fictional patient summary.
*/

select jsonb_build_object(
  'schemaVersion', 1,
  'product', 'SafeFlow',
  'simulationOnly', true,
  'safetyBoundary', jsonb_build_object(
    'noLivePatientData', true,
    'directCareIdentifiers', false,
    'humanReviewRequired', true
  ),
  'workspace', jsonb_build_object(
    'summary', jsonb_build_object(
      'wardName', w.name,
      'patientCount', count(distinct ps.id),
      'openTaskCount', count(distinct t.id) filter (where t.status <> 'completed'),
      'activeEscalationCount', count(distinct e.id) filter (where e.status <> 'closed')
    ),
    'patients', coalesce(jsonb_agg(distinct jsonb_build_object(
      'syntheticPatientRef', ps.synthetic_patient_ref,
      'displayLabel', ps.display_label,
      'ageBand', ps.age_band,
      'sexLabel', ps.sex_label,
      'riskLevel', ps.risk_level,
      'fictionalScenario', ps.fictional_scenario
    )) filter (where ps.id is not null), '[]'::jsonb)
  )
) as workspace_snapshot
from wards w
join patient_summaries ps on ps.ward_id = w.id
left join tasks t on t.patient_summary_id = ps.id
left join escalations e on e.patient_summary_id = ps.id
where ps.fictional_scenario is true
group by w.id, w.name;
