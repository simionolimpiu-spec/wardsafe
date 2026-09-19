import { Download } from 'lucide-react';
import { BoardSummaryCards } from './BoardSummaryCards.jsx';
import { Badge, ClinicalValue, news2BandStatus, SimulationLabel, WardBoardPatientCell, WardBoardStatusCell } from '../design-system/index.js';

function News2Value({ value }) {
  const recorded = value !== null && value !== undefined && value !== '';
  const band = news2BandStatus(recorded ? getNews2Band(value) : undefined);
  return <ClinicalValue label="NEWS2" value={value} state={band.state} stateLabel={recorded ? band.label : undefined} />;
}

function HandoverProgress({ patient }) {
  const progress = patient.handoverComplete;
  if (progress === null || progress === undefined || progress === '') return <span>Not recorded</span>;
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

      <div className="sf-board-boundary">
        <SimulationLabel>Simulation-only</SimulationLabel>
        <p>Fictional records only. Human review required.</p>
        <p>Not clinically validated and not for clinical decision-making.</p>
      </div>

      <BoardSummaryCards summary={summary} />

      <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable ward patient table">
        <table aria-label="Ward patient list" className="patient-table">
          <thead>
            <tr>
              <th scope="col">Patient ID / Fictional label</th>
              <th scope="col">Risk</th>
              <th scope="col">Escalation status</th>
              <th scope="col">Next action</th>
              <th scope="col">NEWS2</th>
              <th scope="col">Responsible fictional nurse</th>
              <th scope="col">Handover %</th>
              <th scope="col">Discharge-ready</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr className={patient.id === selectedPatientId ? 'is-selected' : ''} key={patient.id}>
                <WardBoardPatientCell patient={patient} selected={patient.id === selectedPatientId} onSelectPatient={onSelectPatient} />
                <WardBoardStatusCell kind="risk" value={patient.risk}>
                  {patient.riskFlags?.length > 0 && (
                    <ul className="sf-board-flags" aria-label={`Risk flags for ${patient.name}`}>
                      {patient.riskFlags.map((flag) => (
                        <li key={flag}><Badge tone="neutral" variant="outline">{flag}</Badge></li>
                      ))}
                    </ul>
                  )}
                </WardBoardStatusCell>
                <WardBoardStatusCell kind="escalation" value={patient.escalation} />
                <td>{patient.nextAction || 'Not recorded'}</td>
                <td><News2Value value={patient.news2} /></td>
                <td>{patient.responsibleNurse || 'Not recorded'}</td>
                <td><HandoverProgress patient={patient} /></td>
                <WardBoardStatusCell kind="discharge" value={patient.dischargeReady} />
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
