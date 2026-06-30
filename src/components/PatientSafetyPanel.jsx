import { BarChart3, CheckCircle2, CloudCog, Phone, Plus, Siren } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function PatientSafetyPanel({
  patient,
  flag,
  onAddTask = () => {},
  onRequestContact = () => {},
  reviewSignals = [],
  signalSnapshot = null,
  roleMode = 'clinical-staff',
  detailLevel = 'standard',
  showClinicalGraphs = true
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const isFamilySafePreview = roleMode === 'family-safe-preview';
  const tasks = Array.isArray(patient.tasks) ? patient.tasks : [];
  const observations = Array.isArray(patient.observations) ? patient.observations : [];
  const dischargeBlockers = Array.isArray(patient.dischargeBlockers) ? patient.dischargeBlockers : [];
  const allergies = Array.isArray(patient.allergies) ? patient.allergies : [];
  const tabs = useMemo(() => {
    if (isFamilySafePreview) {
      return [
        ['overview', 'Summary'],
        ['reviewed', 'Reviewed'],
        ['updates', 'Updates']
      ];
    }

    return [
      ['overview', 'Safety Overview'],
      ['sbar', 'SBAR'],
      ['tasks', `Tasks ${tasks.length}`],
      ['audit', 'Audit Trail']
    ];
  }, [isFamilySafePreview, tasks.length]);
  const auditTrail = Array.isArray(patient.auditTrail) && patient.auditTrail.length
    ? patient.auditTrail
    : Array.isArray(patient.responseHistory)
      ? patient.responseHistory
      : [];

  useEffect(() => {
    setActiveTab('overview');
  }, [roleMode, patient.id]);

  return (
    <aside className="patient-panel" aria-label="Patient safety panel">
      <div className="panel-heading">
        <div>
          <h2>{patient.id}</h2>
          <p>{patient.name} - fictional scenario</p>
        </div>
        {isFamilySafePreview ? (
          <span className="role-pill">Family-safe preview</span>
        ) : (
          <span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk} risk</span>
        )}
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
            {!isFamilySafePreview && allergies.length > 0 && <p>Allergy: {allergies.join(', ')}</p>}
            {!isFamilySafePreview && flag.level !== 'none' && <p>{flag.title}</p>}
            <p>{isFamilySafePreview ? 'Plain-language simulation summary only.' : patient.escalation === 'Active' ? 'Escalation active - medical team informed' : 'No active escalation'}</p>
            {!isFamilySafePreview && patient.escalation === 'Active' && (
              <button className="call-button" onClick={() => onRequestContact(patient)} type="button">
                <Phone aria-hidden="true" size={16} />
                Call team
              </button>
            )}
          </div>

          {isFamilySafePreview ? (
            <FamilySafeSummary patient={patient} />
          ) : (
            <>
              {showClinicalGraphs && (
                <PatientJourneyTwin
                  detailLevel={detailLevel}
                  patient={patient}
                  reviewSignals={reviewSignals}
                  signalSnapshot={signalSnapshot}
                />
              )}
              <ReviewCuesSection reviewSignals={reviewSignals} signalSnapshot={signalSnapshot} />
              <SbarSummary patient={patient} />
            </>
          )}
        </>
      )}

      {activeTab === 'sbar' && (!isFamilySafePreview ? <SbarSummary patient={patient} /> : <FamilySafeSummary patient={patient} />)}

      {activeTab === 'tasks' && (!isFamilySafePreview ? <TaskList onAddTask={onAddTask} patient={patient} /> : <FamilySafeReviewed patient={patient} />)}

      {activeTab === 'reviewed' && isFamilySafePreview && <FamilySafeReviewed patient={patient} />}

      {activeTab === 'updates' && isFamilySafePreview && <FamilySafeUpdates patient={patient} />}

      {activeTab === 'audit' && !isFamilySafePreview && (
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

function ReviewCuesSection({ reviewSignals, signalSnapshot }) {
  const hasSignalSnapshot = Boolean(signalSnapshot);
  const signalProviderNote = formatPreviewSourceNote(signalSnapshot?.signalSourceMetadata, 'Signals');
  const suggestionProviderNote = formatPreviewSourceNote(signalSnapshot?.suggestionSourceMetadata, 'Risk suggestions');

  return (
    <section aria-labelledby="patient-review-cues-heading">
      <h3 id="patient-review-cues-heading">Simulation Review Cues</h3>
      <p>Simulation-only cues. Human review required.</p>
      <p className="risk-support-boundary">Simulation output for preview only. Not clinically validated and not for clinical decision-making.</p>
      {(signalProviderNote || suggestionProviderNote) && (
        <p className="risk-support-boundary">
          {[signalProviderNote, suggestionProviderNote].filter(Boolean).join(' ')}
        </p>
      )}
      {!hasSignalSnapshot ? (
        <p>No signal snapshot available yet.</p>
      ) : reviewSignals.length > 0 ? (
        <ul className="review-cue-stack">
          {reviewSignals.map((signal) => (
            <li key={signal.id}>
              <ReviewSignalCard signal={signal} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No current simulation review cues for this patient.</p>
      )}
    </section>
  );
}

function ReviewSignalCard({ signal }) {
  return (
    <article className="integration-card review-cue-card">
      <Siren aria-hidden="true" size={18} />
      <div>
        <p className="review-cue-meta">
          <span>{formatSignalCategory(signal.category)}</span>
          <span>{formatSignalPriority(signal.priority)}</span>
        </p>
        <strong>{signal.title}</strong>
        <p>{signal.explanation}</p>
        {signal.evidence?.length > 0 && (
          <ul className="review-cue-evidence">
            {signal.evidence.map((item, index) => (
              <li key={`${signal.id}-evidence-${index}`}>{item.label ?? 'Simulation signal'}</li>
            ))}
          </ul>
        )}
        {signal.freshness?.label && <p>{signal.freshness.label}</p>}
        {signal.missingDataNotes?.length > 0 && (
          <ul className="review-cue-notes">
            {signal.missingDataNotes.map((note, index) => (
              <li key={`${signal.id}-note-${index}`}>{note}</li>
            ))}
          </ul>
        )}
        <p>{signal.suggestedHumanReviewAction}</p>
      </div>
    </article>
  );
}

function PatientJourneyTwin({ detailLevel, patient, reviewSignals, signalSnapshot }) {
  const tasks = Array.isArray(patient.tasks) ? patient.tasks : [];
  const observations = Array.isArray(patient.observations) ? patient.observations : [];
  const dischargeBlockers = Array.isArray(patient.dischargeBlockers) ? patient.dischargeBlockers : [];
  const openTaskCount = tasks.filter((task) => task.status !== 'Done').length;
  const cueCount = reviewSignals.length;
  const blockerCount = dischargeBlockers.length;
  const documentationScore = clampPercent(patient.handoverComplete);
  const readinessScore = clampPercent(
    patient.dischargeReady ? 100 : Math.max(20, patient.handoverComplete - blockerCount * 10)
  );
  const journeyScore = clampPercent(
    Math.max(25, Math.min(100, observations.length * 18 + (patient.escalation === 'Active' ? 22 : 8) + patient.news2 * 4))
  );

  return (
    <section className="journey-twin" aria-labelledby="patient-journey-twin-heading">
      <div className="section-heading journey-twin-heading">
        <BarChart3 aria-hidden="true" size={18} />
        <div>
          <p className="eyebrow">Clinical-only graph surface</p>
          <h3 id="patient-journey-twin-heading">Patient Journey Twin</h3>
          <p>Simulation-only trend surfaces for staff review. Human review required.</p>
        </div>
      </div>
      <div className="journey-twin-grid">
        <TrendTile
          detail={detailLevel}
          label="Journey trend"
          note="Simulation-only ward journey profile."
          value={journeyScore}
        />
        <TrendTile
          detail={detailLevel}
          label="Improvement / readiness trend"
          note={patient.dischargeReady ? 'Ready for the next step.' : 'Readiness still building.'}
          value={readinessScore}
        />
        <TrendTile
          detail={detailLevel}
          label="Unresolved tasks"
          note={`${openTaskCount} open task${openTaskCount === 1 ? '' : 's'} remaining.`}
          value={clampPercent(Math.max(10, 100 - openTaskCount * 25))}
        />
        <TrendTile
          detail={detailLevel}
          label="Discharge readiness"
          note={dischargeBlockers.length > 0 ? `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} visible.` : 'No blockers visible.'}
          value={readinessScore}
        />
        <TrendTile
          detail={detailLevel}
          label="Review cue load"
          note={`${cueCount} cue${cueCount === 1 ? '' : 's'} in the simulation snapshot.`}
          value={clampPercent(Math.max(15, 100 - cueCount * 18))}
        />
        <TrendTile
          detail={detailLevel}
          label="Documentation completeness"
          note={signalSnapshot?.sourceFreshness?.label ?? 'Latest simulated documentation feed.'}
          value={documentationScore}
        />
      </div>
    </section>
  );
}

function TrendTile({ label, note, value, detail }) {
  const compact = detail === 'summary';

  return (
    <article className="journey-tile">
      <div className="journey-tile-copy">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="journey-bar" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
      {!compact && <p>{note}</p>}
    </article>
  );
}

function FamilySafeSummary({ patient }) {
  return (
    <section className="family-safe-summary" aria-label="Family-safe preview">
      <h3>Family-safe preview</h3>
      <p>Simulation-only summary. No real patient data is used. The clinical team remains responsible.</p>
      <div className="family-safe-summary-grid">
        <article>
          <span>What has been reviewed</span>
          <strong>Current ward summary and plain-language progress.</strong>
        </article>
        <article>
          <span>What is still being checked</span>
          <strong>{patient.dischargeReady ? 'Final confirmation before the next update.' : 'The next update and any remaining paperwork.'}</strong>
        </article>
        <article>
          <span>Next update</span>
          <strong>A member of the clinical team will share the next update.</strong>
        </article>
      </div>
      <p className="family-safe-responsibility">Clinical team responsibility remains central throughout the simulation.</p>
    </section>
  );
}

function FamilySafeReviewed({ patient }) {
  return (
    <section className="family-safe-summary" aria-label="Reviewed items">
      <h3>Reviewed</h3>
      <p>Plain-language items already checked for this fictional patient.</p>
      <ul className="family-safe-list">
        <li>Current ward summary</li>
        <li>Care team review notes</li>
        <li>Documentation and next-step planning</li>
        <li>Family-safe update preparation</li>
      </ul>
      <p className="family-safe-responsibility">The clinical team remains responsible for any next step.</p>
    </section>
  );
}

function FamilySafeUpdates({ patient }) {
  return (
    <section className="family-safe-summary" aria-label="Next updates">
      <h3>Updates</h3>
      <p>What is still being checked before the next family-safe update.</p>
      <ul className="family-safe-list">
        <li>{patient.dischargeReady ? 'Final confirmation only' : 'A further clinical check is still in progress'}</li>
        <li>Next update placeholder remains available</li>
        <li>Clinical team remains responsible for the next step</li>
      </ul>
      <p className="family-safe-responsibility">The simulation remains fictional and review-led.</p>
    </section>
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatSignalCategory(category) {
  const labels = {
    documentation: 'Documentation',
    'electrolyte-review': 'Electrolyte review',
    'infection-review': 'Infection review',
    escalation: 'Escalation',
    handover: 'Handover',
    discharge: 'Discharge',
    learning: 'Learning',
    'simulation-fallback': 'Fallback'
  };

  return labels[category] ?? 'Simulation cue';
}

function formatSignalPriority(priority) {
  const labels = {
    blocker: 'Blocker',
    review: 'Review',
    watch: 'Watch',
    learning: 'Learning'
  };

  return labels[priority] ?? 'Review';
}

function formatPreviewSourceNote(metadata, label) {
  if (!metadata || metadata.clinicalUse !== false) {
    return null;
  }

  const providerLabels = {
    placeholder: 'placeholder preview provider',
    'database-read-model': 'database read model',
    fixture: 'fictional fixture provider',
    'simulation-provider': 'simulation provider'
  };

  return `${label}: ${metadata.source} (${providerLabels[metadata.provider] ?? 'simulation provider'}).`;
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

function TaskList({ patient, onAddTask }) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!description.trim() || !due) {
      setError('Task description and due time are required.');
      return;
    }
    onAddTask({
      patientId: patient.id,
      label: description.trim(),
      owner: patient.responsibleNurse,
      due
    });
    setDescription('');
    setDue('');
    setError('');
    setShowForm(false);
  }

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
      <button className="secondary-action" onClick={() => setShowForm((value) => !value)} type="button"><Plus aria-hidden="true" size={16} /> Add task</button>
      {showForm && (
        <form className="panel-task-form" onSubmit={submit}>
          <label htmlFor="patient-task-description">Patient task description<input id="patient-task-description" onChange={(event) => setDescription(event.target.value)} value={description} /></label>
          <label htmlFor="patient-task-due">Patient task due time<input id="patient-task-due" onChange={(event) => setDue(event.target.value)} type="time" value={due} /></label>
          {error && <p role="alert">{error}</p>}
          <button className="primary-action" type="submit">Save patient task</button>
        </form>
      )}
    </section>
  );
}
