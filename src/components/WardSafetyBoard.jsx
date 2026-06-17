import { AlertTriangle, ClipboardCheck, Home, Users } from 'lucide-react';

const metricIcons = [Users, AlertTriangle, AlertTriangle, ClipboardCheck, Home];

export function WardSafetyBoard({ summary, patients, selectedPatientId, onSelectPatient }) {
  const metrics = [
    ['Patients', summary.metrics.patients, 'In unit'],
    ['Escalations', summary.metrics.activeEscalations, 'Active'],
    ['NEWS2 >=5', summary.metrics.highNews, 'High risk'],
    ['Handover', `${summary.metrics.handoverCompletePercent}%`, 'Complete'],
    ['Discharge ready', summary.metrics.dischargeReadyToday, 'Today']
  ];

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
        {metrics.map(([label, value, caption], index) => {
          const Icon = metricIcons[index];
          return (
            <div className="metric" key={label}>
              <Icon aria-hidden="true" size={22} />
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{caption}</small>
            </div>
          );
        })}
      </div>

      <table aria-label="Ward patient list" className="patient-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Risk</th>
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
              <td><span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk}</span></td>
              <td>{patient.news2}</td>
              <td>{patient.responsibleNurse}</td>
              <td>{patient.nextAction}</td>
              <td>{patient.escalation}</td>
              <td>{patient.handoverComplete}%</td>
              <td>{patient.dischargeReady ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="last-updated">Last updated: {summary.lastUpdated}</p>
    </section>
  );
}
