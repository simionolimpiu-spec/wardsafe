import { AlertTriangle, ClipboardCheck, Download, Home, Users } from 'lucide-react';

const metricCards = [
  { label: 'Patients', valueKey: 'patients', caption: 'In unit', icon: Users, tone: 'neutral' },
  { label: 'Escalations', valueKey: 'activeEscalations', caption: 'Active', icon: AlertTriangle, tone: 'danger' },
  { label: 'NEWS2 >=5', valueKey: 'highNews', caption: 'High risk', icon: AlertTriangle, tone: 'warning' },
  { label: 'Handover', valueKey: 'handoverCompletePercent', caption: 'Complete', icon: ClipboardCheck, tone: 'neutral', suffix: '%' },
  { label: 'Discharge ready', valueKey: 'dischargeReadyToday', caption: 'Today', icon: Home, tone: 'neutral' }
];

function HandoverProgress({ patient }) {
  const progress = patient.handoverComplete;
  return (
    <div
      aria-label={`Handover progress ${progress} percent for ${patient.name}`}
      className="progress-ring"
      style={{ '--progress': `${progress}%` }}
    >
      <span>{progress}%</span>
    </div>
  );
}

export function WardSafetyBoard({ summary, patients, selectedPatientId, onSelectPatient, onExport = () => {} }) {
  return (
    <section className="ward-board" aria-labelledby="ward-board-title">
      <div className="board-header">
        <div>
          <p className="eyebrow">{summary.unitName}</p>
          <h2 id="ward-board-title">Ward Safety Board</h2>
        </div>
        <p className="date-chip">{summary.dateLabel}</p>
      </div>

      <div className="metric-grid" aria-label="Ward metrics">
        {metricCards.map((metric) => {
          const value = metric.suffix
            ? `${summary.metrics[metric.valueKey]}${metric.suffix}`
            : summary.metrics[metric.valueKey];
          const Icon = metric.icon;

          return (
            <article className={`metric metric-${metric.tone}`} key={metric.label}>
              <div aria-hidden="true" className="metric-icon">
                <Icon size={18} />
              </div>
              <div className="metric-copy">
                <span>{metric.label}</span>
                <strong>{value}</strong>
                <small>{metric.caption}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="table-scroll">
        <table aria-label="Ward patient list" className="patient-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Risk flags</th>
              <th>NEWS2</th>
              <th>Responsible nurse</th>
              <th>Next action</th>
              <th>Escalation</th>
              <th>Handover</th>
              <th>Discharge</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr className={patient.id === selectedPatientId ? 'is-selected' : ''} key={patient.id}>
                <td>
                  <button
                    aria-label={`Open ${patient.name} (${patient.id})`}
                    className="link-button"
                    onClick={() => onSelectPatient(patient.id)}
                    type="button"
                  >
                    {patient.id}
                  </button>
                </td>
                <td>{patient.name}</td>
                <td>
                  <div className="flag-stack">
                    {(patient.riskFlags?.length ? patient.riskFlags : [patient.risk]).map((flag) => (
                      <span className={`risk risk-${patient.risk.toLowerCase()}`} key={flag}>{flag}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`news2-score news2-score-${getNews2Band(patient.news2)}`}>
                    {patient.news2}
                  </span>
                </td>
                <td>{patient.responsibleNurse}</td>
                <td>{patient.nextAction}</td>
                <td>{patient.escalation}</td>
                <td><HandoverProgress patient={patient} /></td>
                <td>
                  <span className={patient.dischargeReady ? 'readiness ready' : 'readiness blocked'}>
                    {patient.dischargeReady ? 'Ready' : 'Needs review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="board-footer">
        <p className="last-updated">Last updated: {summary.lastUpdated}</p>
        <button aria-label="Export ward board CSV" className="secondary-action" onClick={onExport} type="button"><Download aria-hidden="true" size={16} /> Export board</button>
      </div>
    </section>
  );
}

function getNews2Band(value) {
  if (Number(value) >= 5) {
    return 'high';
  }

  if (Number(value) >= 3) {
    return 'watch';
  }

  return 'normal';
}
