import { ClinicalStatusBadge } from './ClinicalStatusBadge.jsx';
import { dischargeReadinessStatus, escalationStatus, riskStatus } from './clinicalStates.js';

const statusMappers = {
  risk: riskStatus,
  escalation: escalationStatus,
  discharge: dischargeReadinessStatus
};

export function WardBoardStatusCell({ kind, value, children }) {
  return (
    <td className={`sf-ward-status-cell sf-ward-status-cell--${kind}`}>
      <ClinicalStatusBadge status={statusMappers[kind](value)} />
      {children}
    </td>
  );
}
