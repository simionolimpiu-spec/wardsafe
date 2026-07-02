import { Download, FileBarChart } from 'lucide-react';
import { useState } from 'react';

export function ReportsView({ patients, auditEvents, onExportWard }) {
  const [report, setReport] = useState('ward');
  const completeHandovers = patients.filter((patient) => patient.handoverComplete === 100).length;
  const dischargeReady = patients.filter((patient) => patient.dischargeReady).length;

  return (
    <section className="operational-view" aria-labelledby="reports-title">
      <header className="view-heading">
        <div><p className="eyebrow">Simulation evidence</p><h2 id="reports-title">Reports</h2></div>
        <button aria-label="Export ward board CSV" className="primary-action" onClick={onExportWard} type="button"><Download aria-hidden="true" size={16} /> Export ward board</button>
      </header>
      <p>Exports contain fictional identifiers only and do not represent clinical records.</p>
      <div className="segmented-control" aria-label="Report type">
        {['ward', 'handover', 'audit'].map((item) => (
          <button
            aria-pressed={report === item}
            className={report === item ? 'active' : ''}
            key={item}
            onClick={() => setReport(item)}
            type="button"
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="report-summary">
        <FileBarChart aria-hidden="true" size={24} />
        {report === 'ward' && <><strong>{patients.length} fictional patients</strong><span>{patients.filter((patient) => patient.news2 >= 5).length} with NEWS2 5 or above</span></>}
        {report === 'handover' && <><strong>{completeHandovers} complete handovers</strong><span>{dischargeReady} patients marked discharge ready</span></>}
        {report === 'audit' && <><strong>{auditEvents.length} simulation events</strong><span>Actions recorded in the browser-local audit trail</span></>}
      </div>
    </section>
  );
}
