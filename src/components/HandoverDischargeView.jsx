import { ClipboardCheck, FileCheck2, Home, ListChecks } from 'lucide-react';

export function HandoverDischargeView({ patient }) {
  const completedTasks = patient.tasks.filter((task) => task.status === 'Done').length;
  const openTasks = patient.tasks.length - completedTasks;

  return (
    <section className="workflow-view" aria-label="Handover and discharge readiness">
      <div className="section-heading">
        <ClipboardCheck aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Nurse-led flow</p>
          <h2>Handover and Discharge Readiness</h2>
        </div>
      </div>

      <div className="workflow-grid">
        <article>
          <h3><ListChecks aria-hidden="true" size={18} /> Handover</h3>
          <span className="big-number">{patient.handoverComplete}%</span>
          <p>Handover {patient.handoverComplete}% complete for {patient.id}.</p>
          <p>{openTasks} open task{openTasks === 1 ? '' : 's'} need allocation before transfer of responsibility.</p>
        </article>

        <article>
          <h3><Home aria-hidden="true" size={18} /> Discharge</h3>
          <span className="big-number">{patient.dischargeReady ? 'Ready' : 'Blocked'}</span>
          <p>{patient.dischargeReady ? 'No blockers visible in this scenario.' : 'Discharge readiness is blocked in this scenario.'}</p>
        </article>
      </div>

      <article className="readiness-panel">
        <h3><FileCheck2 aria-hidden="true" size={18} /> Readiness checklist</h3>
        <ul className="readiness-list">
          <li className={patient.handoverComplete === 100 ? 'complete' : 'blocked'}>
            <span>{patient.handoverComplete === 100 ? 'Complete' : 'Blocked'}</span>
            Handover summary
          </li>
          {patient.dischargeBlockers.map((blocker) => (
            <li className="blocked" key={blocker}>
              <span>Blocked</span>
              {blocker}
            </li>
          ))}
          {patient.tasks.map((task) => (
            <li className={task.status === 'Done' ? 'complete' : 'blocked'} key={task.id}>
              <span>{task.status}</span>
              {task.label} - {task.owner} {task.due}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
