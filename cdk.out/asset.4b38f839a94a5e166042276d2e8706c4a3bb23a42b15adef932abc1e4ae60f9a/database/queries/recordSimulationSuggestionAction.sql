/*
  SafeFlow simulation risk suggestion action contract.
  Appends a nurse confirmation action, then mirrors the suggestion status.
*/

with target_suggestion as (
  select rs.id
  from risk_suggestions rs
  join patient_summaries ps
    on ps.id = rs.patient_summary_id
    and ps.fictional_scenario is true
  where rs.seed_key = $1
    and rs.simulation_only is true
  limit 1
),
actor_ref as (
  select id
  from users
  where external_subject_ref = coalesce(nullif($4::text, ''), 'fictional-user-laura-bennett')
  limit 1
),
inserted_action as (
  insert into suggestion_actions (
    suggestion_id,
    actor_user_id,
    action_type,
    action_reason,
    metadata
  )
  select
    target_suggestion.id,
    (select id from actor_ref),
    $2,
    $3,
    '{"simulationOnly":true,"humanConfirmed":true}'::jsonb
  from target_suggestion
  returning id, suggestion_id, action_type, action_reason, occurred_at
),
updated_suggestion as (
  update risk_suggestions rs
    set status = inserted_action.action_type
  from inserted_action
  where rs.id = inserted_action.suggestion_id
  returning rs.seed_key, rs.status, rs.updated_at
)
select
  inserted_action.id::text as action_id,
  updated_suggestion.seed_key as suggestion_id,
  updated_suggestion.status,
  inserted_action.action_type,
  inserted_action.action_reason,
  inserted_action.occurred_at,
  updated_suggestion.updated_at
from inserted_action
join updated_suggestion on true;
