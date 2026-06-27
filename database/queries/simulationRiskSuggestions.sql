/*
  SafeFlow simulation risk suggestion read contract.
  Returns ML-shaped missed-action proposals that always require nurse review.
*/

select
  rs.seed_key as suggestion_id,
  ps.synthetic_patient_ref,
  rp.risk_type,
  rp.risk_tier,
  rp.risk_score,
  rs.status,
  rs.title,
  rs.suggested_flag,
  rs.suggested_blocker,
  rs.suggested_task,
  rs.evidence,
  rs.missing_data,
  rp.model_version,
  rp.feature_set_version,
  rp.requires_human_review,
  rs.created_at,
  rs.updated_at,
  action_log.actions
from risk_suggestions rs
join risk_predictions rp
  on rp.id = rs.prediction_id
  and rp.simulation_only is true
join patient_summaries ps
  on ps.id = rs.patient_summary_id
  and ps.fictional_scenario is true
left join lateral (
  select coalesce(jsonb_agg(jsonb_build_object(
    'actionId', sa.id::text,
    'actionType', sa.action_type,
    'actionReason', sa.action_reason,
    'actorRef', u.external_subject_ref,
    'occurredAt', sa.occurred_at
  ) order by sa.occurred_at desc), '[]'::jsonb) as actions
  from suggestion_actions sa
  left join users u on u.id = sa.actor_user_id
  where sa.suggestion_id = rs.id
) action_log on true
where rs.simulation_only is true
  and rp.requires_human_review is true
  and ($1::text is null or ps.synthetic_patient_ref = $1)
order by
  case rp.risk_tier when 'urgent' then 1 when 'watch' then 2 else 3 end,
  rs.created_at desc;
