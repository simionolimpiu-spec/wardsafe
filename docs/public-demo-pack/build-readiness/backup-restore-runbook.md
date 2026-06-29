# SafeFlow Backup And Restore Runbook

## Scope

This runbook is for SafeFlow synthetic development and simulation environments. It does not authorise a pilot, clinical deployment, live system integration or live patient data.

## Current Backup Controls

- RDS PostgreSQL storage is KMS encrypted.
- Automated backup retention is profile-controlled.
- `DeleteAutomatedBackups` is disabled so retained database resources do not silently lose automated backups during stack changes.
- Deletion protection is enabled.
- Resource tags are copied to snapshots.
- The database and credential secret use retain removal policies.

## Restore Drill Preconditions

Do not begin a restore drill unless all are true:

- The source contains synthetic SafeFlow data only.
- An owner and reviewer are named.
- The target AWS account, region and profile are recorded.
- A cost limit and cleanup owner are agreed.
- The restore target will be private, encrypted and isolated from application traffic.
- The approved migration manifest and checksums are recorded.

## Restore Drill Procedure

1. Record the source DB identifier, environment profile, backup timestamp and current migration manifest.
2. Select an automated backup or manual snapshot created before the test event.
3. Restore into a new isolated DB instance. Never overwrite the source instance.
4. Confirm public accessibility is disabled, storage encryption is enabled and only the temporary review security group has access.
5. Confirm the restored database contains only the expected fictional SafeFlow references.
6. Run `npm run db:manifest` and the gated migration dry-run. Do not execute migrations unless the approval file still matches.
7. Verify core tables, append-only audit controls and synthetic-only constraints.
8. Record restore start/end time, recovery point, validation results and any deviations.
9. Export the evidence log without patient-like identifiers.
10. Remove the temporary restore target only after the reviewer confirms evidence capture and the cleanup action is approved.

## Migration Rollback

- SQL migrations execute inside one transaction and roll back automatically on failure.
- If a committed change later proves unsafe, stop application access and restore to a new instance from the last approved recovery point.
- Do not mutate or delete the source database while investigating.
- Re-run validation against the restored instance before any traffic switch.

## Stop Conditions

Stop immediately if:

- Any data may be identifiable or non-synthetic.
- The restore target is public or reachable beyond the approved review path.
- Encryption, backup provenance or migration approval cannot be verified.
- The manifest checksum differs from `database/migrationApproval.json`.
- A clinical, governance, security or cost owner withdraws approval.

## Evidence Record

Record at minimum:

| Field | Evidence |
| --- | --- |
| Drill owner and reviewer | Names/roles |
| Environment profile | `dev` or `simulation` |
| Source recovery point | Timestamp and backup identifier |
| Restore target | Private temporary DB identifier |
| Encryption and network checks | Pass/fail with evidence reference |
| Migration manifest | SHA-256 values |
| Recovery point objective result | Measured data-loss window |
| Recovery time objective result | Measured restore/validation duration |
| Validation outcome | Pass/fail and deviations |
| Cleanup confirmation | Timestamp and approver |

## Public References

- Amazon RDS automated backups: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html
- Amazon RDS point-in-time recovery: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html
- Amazon RDS snapshot restore: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RestoreFromSnapshot.html
