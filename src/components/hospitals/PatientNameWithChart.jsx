import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PatientRagDonut, PatientRagLegend } from './PatientRagDonut.jsx';
import { useModalFocusTrap } from '../useModalFocusTrap.js';
import { ragWord } from '../../domain/patientRag.js';

export function PatientNameWithChart({ patient }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();
  useModalFocusTrap({ active: open, containerRef: dialogRef, onEscape: () => setOpen(false) });

  return (
    <>
      <button type="button" className={`patient-name-trigger rag-${patient.rag}`}
        aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="patient-rag-marker" aria-hidden="true" />
        {patient.name}
      </button>
      {open && createPortal(
        <div className="dialog-overlay">
          <div className="dialog-backdrop" aria-hidden="true" onMouseDown={() => setOpen(false)} />
          <section className="simulation-dialog patient-chart-dialog" ref={dialogRef}
            role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
            <div className="patient-chart-popover-head">
              <div>
                <h2 id={titleId}>{patient.name}</h2>
                <p>{patient.id} · {patient.bed} · {patient.ageLabel ?? `${patient.age} yrs`}</p>
                <p>{patient.diagnosis}</p>
              </div>
              <button className="secondary-action" type="button" onClick={() => setOpen(false)}>Close chart</button>
            </div>
            <p><strong>Care status: {ragWord(patient.rag)}</strong></p>
            {patient.documentationTopics?.length > 0 && <div>
              <h3>Fictional service record</h3>
              <p>{patient.simulatedCareLevel != null ? `Simulated adult care level ${patient.simulatedCareLevel}.` : 'Adult care level not recorded for this pathway.'} Human review required.</p>
              <p>Documentation review topics; completion has not been recorded.</p>
              <ul>{patient.documentationTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            </div>}
            {!patient.documentationTopics?.length && <p>Service-level metadata is not recorded in this saved patient record. Existing notes are preserved; no care level has been inferred.</p>}
            <div className="patient-chart-popover-body">
              <PatientRagDonut patient={patient} size={168} thickness={20} />
              <PatientRagLegend patient={patient} />
            </div>
            <p className="patient-chart-footnote">Simulation only. Fictional patient. Not for clinical decision-making. Missing assessments are shown as not assessed.</p>
          </section>
        </div>, document.body
      )}
    </>
  );
}
