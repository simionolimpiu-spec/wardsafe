import { CheckCircle2, Plus, Siren } from 'lucide-react';

export function PatientSafetyPanel({ patient, flag }) {
  return (
    <aside className="patient-panel" aria-label="Patient safety panel">
      <div className="panel-heading">
        <div>
          <h2>{patient.id}</h2>
          <p>{patient.name} - fictional scenario</p>
        </div>
        <span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk} risk</span>
      </div>

      <div className="alert-list">
        {patient.allergies.length > 0 && <p>Allergy: {patient.allergies.join(', ')}</p>}
        {flag.level !== 'none' && <p>{flag.title}</p>}
        <p>{patient.escalation === 'Active' ? 'Escalation active - medical team informed' : 'No active escalation'}</p>
      </div>

      <section>
        <h3>SBAR summary</h3>
        <dl className="sbar-list">
          <dt>S</dt><dd>{patient.sbar.situation}</dd>
          <dt>B</dt><dd>{patient.sbar.background}</dd>
          <dt>A</dt><dd>{patient.sbar.assessment}</dd>
          <dt>R</dt><dd>{patient.sbar.recommendation}</dd>
        </dl>
      </section>

      <section>
        <h3>Tasks ({patient.tasks.length})</h3>
        <ul className="task-list">
          {patient.tasks.map((task) => (
            <li key={task.id}>
              {task.status === 'Done' ? <CheckCircle2 aria-hidden="true" size={16} /> : <Siren aria-hidden="true" size={16} />}
              <span>{task.label}</span>
              <small>{task.status} {task.due}</small>
            </li>
          ))}
        </ul>
      </section>

      <button className="secondary-action" type="button"><Plus aria-hidden="true" size={16} /> Add task</button>
    </aside>
  );
}
