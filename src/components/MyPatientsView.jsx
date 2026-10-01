import { useState } from 'react';

export function MyPatientsView({ patients, simulationUser, onSelectPatient }) {
  const [reviewer, setReviewer] = useState(simulationUser);
  const nurses = [...new Set([simulationUser, ...patients.map((patient) => patient.responsibleNurse).filter(Boolean)])];
  const assignedPatients = patients.filter(
    (patient) => patient.responsibleNurse === reviewer
  );

  return (
    <section className="operational-view" aria-labelledby="my-patients-title">
      <header className="view-heading">
        <div>
          <p className="eyebrow">Assigned workload</p>
          <h2 id="my-patients-title">My Patients</h2>
        </div>
        <strong>{assignedPatients.length} assigned</strong>
      </header>
      <div className="toolbar">
        <label htmlFor="workload-reviewer">Review nurse workload</label>
        <select id="workload-reviewer" value={reviewer} onChange={(event) => setReviewer(event.target.value)}>
          {nurses.map((nurse) => <option key={nurse}>{nurse}</option>)}
        </select>
      </div>
      <p>Fictional patients assigned to {reviewer}.</p>
      <div className="record-list">
        {assignedPatients.map((patient) => (
          <article key={patient.id}>
            <button
              className="link-button"
              onClick={() => onSelectPatient(patient.id)}
              type="button"
            >
              {patient.id}
            </button>
            <strong>{patient.name}</strong>
            <span>NEWS2 {patient.news2}</span>
            <span>{patient.nextAction}</span>
          </article>
        ))}
      </div>
      {assignedPatients.length === 0 && (
        <p className="empty-state">No fictional patients match this simulation identity.</p>
      )}
    </section>
  );
}
