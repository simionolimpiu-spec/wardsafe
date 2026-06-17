import { AlertTriangle, ClipboardPenLine, FileWarning } from 'lucide-react';

export function PotassiumSafetyGapView({ patient, flag, draftText, onDraftChange, onSaveDraft }) {
  return (
    <section className="potassium-view" aria-label="Potassium electrolyte safety gap">
      <div className="section-heading">
        <FileWarning aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Explainable intelligence</p>
          <h2>Potassium / Electrolyte Safety Gap</h2>
        </div>
      </div>

      <div className="evidence-grid">
        <article>
          <h3>Input signals</h3>
          <ul>
            {flag.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            {patient.medicines.map((medicine) => <li key={medicine}>Medicine context: {medicine}</li>)}
          </ul>
        </article>
        <article>
          <h3><AlertTriangle aria-hidden="true" size={18} /> SafeFlow flag</h3>
          <p>{flag.title}</p>
          <p><strong>Confidence:</strong> {flag.confidence}</p>
          <ul>
            {flag.missingInformation.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article>
          <h3>Nursing response supported</h3>
          <ul>
            {flag.recommendedNursingActions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </article>
      </div>

      <div className="boundary-card">
        <strong>Boundary</strong>
        <p>{flag.boundary}</p>
      </div>

      <label className="draft-label" htmlFor="sbar-draft">
        <ClipboardPenLine aria-hidden="true" size={18} />
        Editable SBAR draft
      </label>
      <textarea
        id="sbar-draft"
        aria-label="Editable SBAR draft"
        value={draftText}
        onChange={(event) => onDraftChange(event.target.value)}
        rows={8}
      />
      <button className="primary-action" onClick={onSaveDraft} type="button">Save SBAR draft</button>
    </section>
  );
}
