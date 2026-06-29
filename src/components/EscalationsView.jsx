import { CheckCheck, Plus, X } from 'lucide-react';
import { useState } from 'react';

export function EscalationsView({ escalations, patients, selectedPatientId, simulationUser, onCreate, onChangeStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState(selectedPatientId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Escalation reason is required.');
      return;
    }
    onCreate({ patientId, reason: reason.trim(), owner: simulationUser });
    setReason('');
    setError('');
    setShowForm(false);
  }

  return (
    <section className="operational-view" aria-labelledby="escalations-title">
      <header className="view-heading">
        <div><p className="eyebrow">Simulation escalation register</p><h2 id="escalations-title">Escalations</h2></div>
        <button className="primary-action" onClick={() => setShowForm((value) => !value)} type="button"><Plus aria-hidden="true" size={16} /> New escalation</button>
      </header>
      {showForm && (
        <form className="inline-form" onSubmit={submit}>
          <label htmlFor="escalation-patient">Patient<select id="escalation-patient" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.id}</option>)}</select></label>
          <label htmlFor="escalation-reason">Escalation reason<input id="escalation-reason" onChange={(event) => setReason(event.target.value)} value={reason} /></label>
          {error && <p role="alert">{error}</p>}
          <button className="primary-action" type="submit">Create simulated escalation</button>
        </form>
      )}
      <div className="record-list">
        {escalations.map((escalation) => (
          <article key={escalation.id}>
            <span className={`escalation-state state-${escalation.status.toLowerCase()}`}>{escalation.status}</span>
            <div><strong>{escalation.reason}</strong><p>{escalation.patientId} - {escalation.owner}</p></div>
            <div className="row-actions">
              {escalation.status === 'Active' && <button aria-label={`Acknowledge ${escalation.reason}`} className="icon-action" onClick={() => onChangeStatus({ escalationId: escalation.id, patientId: escalation.patientId, status: 'Monitoring' })} title="Acknowledge escalation" type="button"><CheckCheck aria-hidden="true" size={17} /></button>}
              {escalation.status !== 'Closed' && <button aria-label={`Close ${escalation.reason}`} className="icon-action" onClick={() => onChangeStatus({ escalationId: escalation.id, patientId: escalation.patientId, status: 'Closed' })} title="Close escalation" type="button"><X aria-hidden="true" size={17} /></button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
