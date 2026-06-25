import { Check, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

export function TasksView({ tasks, patients, selectedPatientId, onAddTask, onChangeStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Open');
  const [patientId, setPatientId] = useState(selectedPatientId);
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Done') return task.status === 'Done';
    return task.status !== 'Done';
  }), [statusFilter, tasks]);

  function submit(event) {
    event.preventDefault();
    if (!description.trim() || !owner.trim() || !due) {
      setError('Description, owner and due time are required.');
      return;
    }
    onAddTask({ patientId, label: description.trim(), owner: owner.trim(), due });
    setDescription('');
    setOwner('');
    setDue('');
    setError('');
    setShowForm(false);
  }

  return (
    <section className="operational-view" aria-labelledby="tasks-title">
      <header className="view-heading">
        <div><p className="eyebrow">Shared workload</p><h2 id="tasks-title">Tasks</h2></div>
        <button className="primary-action" onClick={() => setShowForm((value) => !value)} type="button">
          <Plus aria-hidden="true" size={16} /> Add task
        </button>
      </header>
      <div className="toolbar">
        <label htmlFor="task-status-filter">Status</label>
        <select id="task-status-filter" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
          <option>Open</option><option>Done</option><option>All</option>
        </select>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={submit}>
          <label htmlFor="task-patient">Patient<select id="task-patient" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.id}</option>)}</select></label>
          <label htmlFor="task-description">Task description<input id="task-description" onChange={(event) => setDescription(event.target.value)} value={description} /></label>
          <label htmlFor="task-owner">Owner<input id="task-owner" onChange={(event) => setOwner(event.target.value)} value={owner} /></label>
          <label htmlFor="task-due">Due time<input id="task-due" onChange={(event) => setDue(event.target.value)} type="time" value={due} /></label>
          {error && <p role="alert">{error}</p>}
          <button className="primary-action" type="submit">Save task</button>
        </form>
      )}
      <div className="record-list">
        {visibleTasks.map((task) => (
          <article key={`${task.patientId}-${task.id}`}>
            <span className={`task-state ${task.status === 'Done' ? 'complete' : ''}`}>{task.status}</span>
            <div><strong>{task.label}</strong><p>{task.patientId} - {task.owner} - due {task.due}</p></div>
            <button
              aria-label={task.status === 'Done' ? `Reopen ${task.label}` : `Mark ${task.label} Done`}
              className="icon-action"
              onClick={() => onChangeStatus({ patientId: task.patientId, taskId: task.id, status: task.status === 'Done' ? 'Due' : 'Done' })}
              title={task.status === 'Done' ? 'Reopen task' : 'Complete task'}
              type="button"
            >
              {task.status === 'Done' ? <RotateCcw aria-hidden="true" size={17} /> : <Check aria-hidden="true" size={17} />}
            </button>
          </article>
        ))}
      </div>
      {visibleTasks.length === 0 && <p className="empty-state">No tasks match this filter.</p>}
    </section>
  );
}
