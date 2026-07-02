import { CheckCircle2, CloudCog, Phone, Plus, Siren } from 'lucide-react';
import { useRef, useState } from 'react';

export function PatientSafetyPanel({
  patient,
  flag,
  onAddTask = () => {},
  onRequestContact = () => {},
  heuristicCues = [],
  reviewSignals = [],
  signalSnapshot = null
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const tabRefs = useRef([]);
  const tabs = [
    { id: 'overview', label: 'Safety Overview' },
    { id: 'sbar', label: 'SBAR' },
    { id: 'tasks', label: `Tasks ${patient.tasks.length}` },
    { id: 'audit', label: 'Audit Trail' }
  ];
  const auditTrail = patient.auditTrail?.length ? patient.auditTrail : patient.responseHistory;

  function focusTab(index) {
    const nextTab = tabs[index];
    if (!nextTab) {
      return;
    }

    setActiveTab(nextTab.id);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event, index) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      focusTab(0);
      return;
    }

    if (event.key === 'End') {
      focusTab(tabs.length - 1);
      return;
    }

    const nextIndex = event.key === 'ArrowRight'
      ? (index + 1) % tabs.length
      : (index - 1 + tabs.length) % tabs.length;
    focusTab(nextIndex);
  }

  return (
    <aside className="patient-panel" aria-label="Patient safety panel">
      <div className="panel-heading">
        <div>
          <h2>{patient.id}</h2>
          <p>{patient.name} - fictional scenario</p>
        </div>
        <span className={`risk risk-${patient.risk.toLowerCase()}`}>{patient.risk} risk</span>
      </div>

      <div className="panel-tabs" aria-label="Patient detail tabs" role="tablist">
        {tabs.map(({ id, label }, index) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            id={`${id}-tab`}
            key={id}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            role="tab"
            tabIndex={activeTab === id ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel-tabpanels">
        <div
          aria-labelledby="overview-tab"
          hidden={activeTab !== 'overview'}
          id="overview-panel"
          role="tabpanel"
        >
          {activeTab === 'overview' && (
            <>
              <div className="alert-list">
                {patient.allergies.length > 0 && <p>Allergy: {patient.allergies.join(', ')}</p>}
                {flag.level !== 'none' && <p>{flag.title}</p>}
                <p>{patient.escalation === 'Active' ? 'Escalation active - medical team informed' : 'No active escalation'}</p>
                {patient.escalation === 'Active' && (
                  <button
                    aria-haspopup="dialog"
                    className="call-button"
                    onClick={() => onRequestContact(patient)}
                    type="button"
                  >
                    <Phone aria-hidden="true" size={16} />
                    Call team
                  </button>
                )}
              </div>
              <ReviewCuesSection
                flag={flag}
                heuristicCues={heuristicCues}
                reviewSignals={reviewSignals}
                signalSnapshot={signalSnapshot}
              />
              <SbarSummary patient={patient} />
            </>
          )}
        </div>

        <div
          aria-labelledby="sbar-tab"
          hidden={activeTab !== 'sbar'}
          id="sbar-panel"
          role="tabpanel"
        >
          {activeTab === 'sbar' && <SbarSummary patient={patient} />}
        </div>

        <div
          aria-labelledby="tasks-tab"
          hidden={activeTab !== 'tasks'}
          id="tasks-panel"
          role="tabpanel"
        >
          {activeTab === 'tasks' && <TaskList onAddTask={onAddTask} patient={patient} />}
        </div>

        <div
          aria-labelledby="audit-tab"
          hidden={activeTab !== 'audit'}
          id="audit-panel"
          role="tabpanel"
        >
          {activeTab === 'audit' && (
            <section>
              <h3>Audit Trail</h3>
              <ul className="audit-preview">
                {auditTrail.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div className="integration-card integration-card--muted">
        <CloudCog aria-hidden="true" size={22} />
        <div>
          <strong>FHIR-ready integrations</strong>
          <span>Placeholder for approved EPR, observations, labs and documents.</span>
        </div>
      </div>
    </aside>
  );
}

function ReviewCuesSection({ flag, heuristicCues, reviewSignals, signalSnapshot }) {
  const hasSignalSnapshot = Boolean(signalSnapshot);
  const signalProviderNote = formatPreviewSourceNote(signalSnapshot?.signalSourceMetadata, 'Signals');
  const suggestionProviderNote = formatPreviewSourceNote(signalSnapshot?.suggestionSourceMetadata, 'Risk suggestions');
  const reviewSignalIndex = new Map(reviewSignals.map((signal) => [signal.id, signal]));
  const heuristicDisplayCues = heuristicCues.map((cue) => buildHeuristicDisplayCue(cue, reviewSignalIndex, flag));
  const displayCues = [...reviewSignals, ...heuristicDisplayCues];

  return (
    <section aria-labelledby="patient-review-cues-heading" className="review-cue-section">
      <h3 id="patient-review-cues-heading">Simulation Review Cues</h3>
      <p>Simulation-only cues. Human review required.</p>
      <p className="risk-support-boundary">Simulation output for preview only. Not clinically validated and not for clinical decision-making.</p>
      {(signalProviderNote || suggestionProviderNote) && (
        <p className="risk-support-boundary">
          {[signalProviderNote, suggestionProviderNote].filter(Boolean).join(' ')}
        </p>
      )}
      {!hasSignalSnapshot && displayCues.length === 0 ? (
        <p>No signal snapshot available yet.</p>
      ) : displayCues.length > 0 ? (
        <ul className="review-cue-stack">
          {displayCues.map((signal) => (
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
  const showRationaleDisclosure = Boolean(signal.ruleId || signal.threshold);

  return (
    <article className={`integration-card review-cue-card review-cue-${signal.priority ?? 'review'}`}>
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
        {showRationaleDisclosure && (
          <details className="review-cue-details">
            <summary>Why flagged</summary>
            <div className="review-cue-details-body">
              {signal.ruleId && (
                <p><span className="review-cue-detail-label">Rule</span> {signal.ruleId}</p>
              )}
              {signal.rationale && <p>{signal.rationale}</p>}
              {signal.threshold && (
                <p><span className="review-cue-detail-label">Threshold</span> {signal.threshold}</p>
              )}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

function formatSignalCategory(category) {
  const labels = {
    documentation: 'Documentation',
    'electrolyte-review': 'Electrolyte review',
    'infection-review': 'Infection review',
    'sepsis-screen': 'Sepsis screen',
    'falls-risk': 'Falls risk',
    'medication-timing': 'Medication timing',
    'deteriorating-obs': 'Deteriorating observations',
    escalation: 'Escalation',
    handover: 'Handover',
    discharge: 'Discharge',
    learning: 'Learning',
    heuristic: 'Heuristic',
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

function buildHeuristicDisplayCue(cue, reviewSignalIndex, flag) {
  return {
    id: `heuristic-${cue.ruleId}`,
    category: 'heuristic',
    priority: cue.severity,
    title: cue.cue,
    explanation: 'Simulation-only cue from explicit rules. Human review required.',
    evidence: cue.contributingSignals.map((signalId) => ({
      id: signalId,
      label: formatHeuristicContributor(signalId, reviewSignalIndex, flag)
    })),
    suggestedHumanReviewAction: 'Human review required: confirm the matching cues and document the outcome.',
    simulationOnly: true,
    humanReviewRequired: true,
    unsafeClinicalAdvice: false,
    ruleId: cue.ruleId,
    rationale: cue.rationale,
    threshold: cue.threshold,
    contributingSignals: cue.contributingSignals
  };
}

function formatHeuristicContributor(contributorId, reviewSignalIndex, flag) {
  if (typeof contributorId !== 'string' || !contributorId.trim()) {
    return 'Simulation cue';
  }

  if (contributorId.startsWith('flag:')) {
    const level = contributorId.slice(5).trim();
    return flag?.title ? `Safety flag: ${flag.title}` : `Safety flag: ${level || 'unknown'}`;
  }

  const signal = reviewSignalIndex.get(contributorId);
  return signal?.title ?? signal?.explanation ?? contributorId;
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
