import { Download } from 'lucide-react';
import { useState } from 'react';
import { BoardSummaryCards } from './BoardSummaryCards.jsx';

function HandoverProgress({ patient }) {
  const progress = patient.handoverComplete;
  return (
    <div
      aria-label={`Handover progress ${progress} percent for ${patient.name}`}
      className="handover-progress"
    >
      <span>{progress}%</span>
      <progress aria-hidden="true" max="100" value={progress}>{progress}%</progress>
    </div>
  );
}

export function WardSafetyBoard({ summary, patients, selectedPatientId, onSelectPatient, onExport = () => {} }) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  return (
    <section className="ward-board" aria-labelledby="ward-board-title">
      <div className="board-header">
        <div>
          <p className="eyebrow">{summary.unitName}</p>
          <h2 id="ward-board-title">Ward Safety Board</h2>
        </div>
        <p className="date-chip">{summary.dateLabel}</p>
      </div>

      <BoardSummaryCards summary={summary} />

      <div className="board-column-controls">
        <span>On narrow screens, scroll the table to see more details.</span>
        <button type="button" className="secondary-action" aria-pressed={showAllColumns} onClick={() => setShowAllColumns((value) => !value)}>
          {showAllColumns ? 'Use compact columns' : 'Show all columns'}
        </button>
      </div>

      <div className={`table-scroll ${showAllColumns ? 'all-columns' : 'compact-columns'}`} tabIndex={0} role="region" aria-label="Scrollable ward patient records">
        <table aria-label="Ward patient list" className="patient-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Fictional label</th>
              <th>Risk</th>
              <th>NEWS2</th>
              <th>Responsible fictional nurse</th>
              <th>Next action</th>
              <th>Escalation status</th>
              <th>Handover %</th>
              <th>Discharge-ready</th>
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
                  <span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk}</span>
                  <div className="flag-stack">
                    {(patient.riskFlags?.length ? patient.riskFlags : [patient.risk]).map((flag) => (
                      <small key={flag}>{flag}</small>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`news2-score news2-score-${getNews2Band(patient.news2)}`}>
                    {patient.news2 ?? 'Not applicable'}
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
