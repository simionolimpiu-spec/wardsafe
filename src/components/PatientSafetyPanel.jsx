import { CheckCircle2, CloudCog, Phone, Plus, Siren } from 'lucide-react';
import { useRef, useState } from 'react';
import { InformationPanel, PatientBanner, ReviewCueGroup, SafetyStatus } from '../design-system/index.js';
import { toPatientBannerModel } from '../domain/patientBannerModel.js';
import { PotassiumSafetyGapView } from './PotassiumSafetyGapView.jsx';
import { SbarDraftEditor } from './SbarDraftEditor.jsx';

export function PatientSafetyPanel({
  patient,
  flag,
  draftText = '',
  draftSaveHint = 'Fictional draft. Save to keep changes on this device.',
  isGeneratingDraft = false,
  onAddTask = () => {},
  onDraftChange = () => {},
  onGenerateDraft = () => {},
  onRequestContact = () => {},
  onSaveDraft = () => {},
  heuristicCues = [],
  reviewSignals = [],
  signalSnapshot = null,
  wardName,
  hospitalName
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const tabRefs = useRef([]);
  const tabs = [
    { id: 'overview', label: 'Safety Overview' },
    { id: 'sbar', label: 'SBAR' },
    { id: 'tasks', label: `Tasks ${patient.tasks.length}` },
    { id: 'audit', label: 'Audit Trail' }
  ];
  const bannerModel = toPatientBannerModel(patient, { wardName, hospitalName });
  const isEscalationActive = patient.escalation === 'Active';
  const auditTrail = patient.auditTrail?.length ? patient.auditTrail : patient.responseHistory;
  const riskFlags = Array.isArray(patient.riskFlags) ? patient.riskFlags.filter(Boolean) : [];
  const canShowSafetyGapDetail = flag?.level !== 'none'
    && Array.isArray(flag?.reasons)
    && Array.isArray(flag?.missingInformation)
    && Array.isArray(flag?.recommendedNursingActions);

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
      <PatientBanner {...bannerModel} className="sf-patient-panel-banner">
        <SafetyStatus
          aria-label="Patient review alert"
          role="note"
          state={isEscalationActive ? 'critical' : 'neutral'}
          title={isEscalationActive ? 'Active simulation review cue. Human review required.' : 'Simulation review status. Human review required.'}
        >
          {isEscalationActive ? 'Escalation active - medical team informed.' : 'No active escalation.'}
        </SafetyStatus>
      </PatientBanner>

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
              <section aria-labelledby="patient-safety-context-heading" className="sf-panel-section">
                <h3 className="sf-panel-section__title" id="patient-safety-context-heading">Safety context</h3>
                {riskFlags.length > 0 && (
                  <ul className="flag-stack overview-risk-flags" aria-label={`Risk flags for ${patient.name}`}>
                    {riskFlags.map((riskFlag) => (
                      <li className={`risk risk-${patient.risk.toLowerCase()}`} key={riskFlag}>{riskFlag}</li>
                    ))}
                  </ul>
                )}
                {flag.level !== 'none' && (
                  <SafetyStatus state="review" title={flag.title}>
                    Rule-based simulation flag. Human review required.
                  </SafetyStatus>
                )}
              </section>
              {canShowSafetyGapDetail && (
                <PotassiumSafetyGapView
                  draftText={draftText}
                  draftSaveHint={draftSaveHint}
                  flag={flag}
                  isGeneratingDraft={isGeneratingDraft}
                  onDraftChange={onDraftChange}
                  onGenerateDraft={onGenerateDraft}
                  onSaveDraft={onSaveDraft}
                  patient={patient}
                />
              )}
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
          {activeTab === 'sbar' && <SbarDraftEditor draftText={draftText} draftSaveHint={draftSaveHint}
            onDraftChange={onDraftChange} onSaveDraft={onSaveDraft} onGenerateDraft={onGenerateDraft} isGeneratingDraft={isGeneratingDraft} />}
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

      <div className="panel-footer-actions">
        <button className="primary-action" onClick={() => setActiveTab('sbar')} type="button">Review SBAR</button>
        <button
          aria-haspopup={patient.escalation === 'Active' ? 'dialog' : undefined}
          className="danger-action"
          disabled={patient.escalation !== 'Active'}
          onClick={() => onRequestContact(patient)}
          type="button"
        >
          <Phone aria-hidden="true" size={16} /> Call team
        </button>
      </div>

      <InformationPanel className="sf-panel-integrations" icon={CloudCog} title="FHIR-ready integrations">
        Placeholder for approved EPR, observations, labs and documents.
      </InformationPanel>
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
    <ReviewCueGroup
      available={hasSignalSnapshot}
      cues={displayCues}
      headingId="patient-review-cues-heading"
      sourceNotes={[signalProviderNote, suggestionProviderNote]}
    />
  );
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
