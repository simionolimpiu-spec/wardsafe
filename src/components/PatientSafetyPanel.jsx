import { CheckCircle2, CloudCog, Phone, Plus, Siren } from 'lucide-react';
import { useState } from 'react';

export function PatientSafetyPanel({ patient, flag }) {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    ['overview', 'Safety Overview'],
    ['sbar', 'SBAR'],
    ['tasks', `Tasks ${patient.tasks.length}`],
    ['audit', 'Audit Trail']
  ];
  const auditTrail = patient.auditTrail?.length ? patient.auditTrail : patient.responseHistory;

  return (
    <aside className="patient-panel" aria-label="Patient safety panel">
      <div className="panel-heading">
        <div>
          <h2>{patient.id}</h2>
          <p>{patient.name} - fictional scenario</p>
        </div>
        <span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk} risk</span>
      </div>

      <div className="panel-tabs" role="tablist" aria-label="Patient detail tabs">
        {tabs.map(([id, label]) => (
          <button
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            key={id}
            onClick={() => setActiveTab(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="alert-list">
            {patient.allergies.length > 0 && <p>Allergy: {patient.allergies.join(', ')}</p>}
            {flag.level !== 'none' && <p>{flag.title}</p>}
            <p>{patient.escalation === 'Active' ? 'Escalation active - medical team informed' : 'No active escalation'}</p>
            {patient.escalation === 'Active' && (
              <button className="call-button" type="button"><Phone aria-hidden="true" size={16} /> Call team</button>
            )}
          </div>
          <SbarSummary patient={patient} />
        </>
      )}

      {activeTab === 'sbar' && <SbarSummary patient={patient} />}

      {activeTab === 'tasks' && <TaskList patient={patient} />}

      {activeTab === 'audit' && (
        <section>
          <h3>Audit Trail</h3>
          <ul className="audit-preview">
            {auditTrail.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      <div className="integration-card">
        <CloudCog aria-hidden="true" size={22} />
        <div>
          <strong>FHIR-ready integrations</strong>
          <span>Placeholder for approved EPR, observations, labs and documents.</span>
        </div>
      </div>
    </aside>
  );
}

function SbarSummary({ patient }) {
  return (
    <section>
      <h3>SBAR summary</h3>
      <dl className="sbar-list">
        <dt>S</dt><dd>{patient.sbar.situation}</dd>
        <dt>B</dt><dd>{patient.sbar.background}</dd>
        <dt>A</dt><dd>{patient.sbar.assessment}</dd>
        <dt>R</dt><dd>{patient.sbar.recommendation}</dd>
      </dl>
    </section>
  );
}

function TaskList({ patient }) {
  return (
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
      <button className="secondary-action" type="button"><Plus aria-hidden="true" size={16} /> Add task</button>
    </section>
  );
}
