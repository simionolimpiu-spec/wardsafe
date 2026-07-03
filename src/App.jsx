import { useEffect, useMemo, useState } from 'react';
import { getHospitalInsightsSnapshot } from './services/hospitalInsightsService.js';
import { getSimulationReviewReportSnapshot } from './services/simulationReviewReportService.js';
import { createSbarDraft } from './domain/draftProvider.js';
import { buildHeuristicCues } from './domain/heuristicCueEngine.js';
import { evaluatePotassiumSafetyGap } from './domain/safetyRules.js';
import { createSimulationRiskSupport } from './domain/simulationRiskSupport.js';
import { createAuditEvent, initialAuditEvents } from './domain/workflowEvents.js';
import { requestReadinessReport } from './services/readinessClient.js';
import { requestSbarDraft } from './services/draftClient.js';
import { requestRiskSuggestions, requestSignalTimeline } from './services/signalClient.js';
import { requestWorkspaceSnapshot } from './services/workspaceClient.js';
import {
  requestSimulationAuditEvent,
  requestSimulationAuditEvents
} from './services/auditClient.js';
import { AuditLearningView } from './components/AuditLearningView.jsx';
import { DemoScenarioSelector } from './components/DemoScenarioSelector.jsx';
import { ArchitectureStrip } from './components/ArchitectureStrip.jsx';
import { HospitalInsightsButton, HospitalInsightsDrawer } from './components/HospitalInsightsDrawer.jsx';
import { HospitalInsightsView } from './components/HospitalInsightsView.jsx';
import { HandoverDischargeView } from './components/HandoverDischargeView.jsx';
import { PatientSafetyPanel } from './components/PatientSafetyPanel.jsx';
import { SimulationReviewReportButton, SimulationReviewReportDrawer } from './components/SimulationReviewReportDrawer.jsx';
import { SafetyBanner } from './components/SafetyBanner.jsx';
import { ScenarioLibraryView } from './components/ScenarioLibraryView.jsx';
import { WardSafetyBoard } from './components/WardSafetyBoard.jsx';
import { WorkspaceNav } from './components/WorkspaceNav.jsx';
import { MyPatientsView } from './components/MyPatientsView.jsx';
import { ObservationsView } from './components/ObservationsView.jsx';
import { TasksView } from './components/TasksView.jsx';
import { EscalationsView } from './components/EscalationsView.jsx';
import { DischargesView } from './components/DischargesView.jsx';
import { ReportsView } from './components/ReportsView.jsx';
import { SettingsView } from './components/SettingsView.jsx';
import { PatientJourneyTwin } from './components/PatientJourneyTwin.jsx';
import { SimulationDialog } from './components/SimulationDialog.jsx';
import { CompetencyPassportView } from './CompetencyPassportView.jsx';
import { LearningHubView } from './LearningHubView.jsx';
import { getDemoScenarioOptions } from './data/demoScenarios.js';
import {
  selectActiveEscalationCount,
  selectAllTasks,
  selectPatient as selectPatientFromState,
  selectPatientSimulationSignals
} from './state/simulationWorkspace.js';
import { useSimulationWorkspace } from './state/useSimulationWorkspace.js';
import { buildWardReportRows, downloadSimulationCsv } from './domain/simulationExport.js';

const tabs = [
  { id: 'board', label: 'Ward board' },
  { id: 'handover', label: 'Handover' },
  { id: 'twin', label: 'Patient Journey Twin' },
  { id: 'audit', label: 'Audit' }
];
const PREVIEW_BOUNDARY_COPY = 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.';
const PRESENTATION_FLOW_STEPS = ['Demo Scenario', 'Patient Review Cues', 'Hospital Insights', 'Simulation Review Report'];
const PRESENTATION_ROADMAP_NOTE =
  'Roadmap: patient view → review cues → ward comparison → hospital insights → future NHS/AWS integration.';
const PRESENTATION_BOUNDARY_NOTE =
  'Simulation-only. Human review required. Designed for NHS leadership, ward managers, clinical educators, and digital safety leads.';

function formatDraftSections(draft) {
  return Object.entries(draft.sections)
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join('\n\n');
}

function cloneSnapshotEntry(entry) {
  return entry && typeof entry === 'object' && !Array.isArray(entry) ? { ...entry } : null;
}

function isSignalEnvelope(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.signals);
}

function isSuggestionEnvelope(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.suggestions);
}

function coerceFreshness(value, hasData) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      ...value,
      state:
        typeof value.state === 'string' && value.state.trim()
          ? value.state.trim()
          : hasData
            ? 'current'
            : 'unavailable',
      label:
        typeof value.label === 'string' && value.label.trim()
          ? value.label.trim()
          : hasData
            ? 'Latest simulated signal feed'
            : 'No signal freshness available.'
    };
  }

  if (typeof value === 'string' && value.trim()) {
    return {
      state: value.trim(),
      label: 'Latest simulated signal feed'
    };
  }

  return hasData
    ? {
        state: 'current',
        label: 'Latest simulated signal feed'
      }
    : {
        state: 'unavailable',
        label: 'No signal freshness available.'
      };
}

function collectMissingDataNotes(signalTimeline, riskSuggestions, hasData) {
  const notes = [];

  for (const signal of signalTimeline) {
    if (!signal || typeof signal !== 'object') continue;
    const sourceNotes = Array.isArray(signal.missingData) ? signal.missingData : signal.missingDataNotes;
    if (!Array.isArray(sourceNotes)) continue;
    for (const note of sourceNotes) {
      const text = typeof note === 'string' ? note.trim() : String(note ?? '').trim();
      if (text) notes.push(text);
    }
  }

  for (const suggestion of riskSuggestions) {
    if (!suggestion || typeof suggestion !== 'object') continue;
    const sourceNotes = Array.isArray(suggestion.missingData) ? suggestion.missingData : suggestion.missingDataNotes;
    if (!Array.isArray(sourceNotes)) continue;
    for (const note of sourceNotes) {
      const text = typeof note === 'string' ? note.trim() : String(note ?? '').trim();
      if (text) notes.push(text);
    }
  }

  if (!hasData && notes.length === 0) {
    notes.push('No signal snapshot available yet.');
  }

  return notes;
}

function receivedAtFromEntries(signalTimeline, riskSuggestions) {
  const candidateFields = [
    ['receivedAt', 'effectiveAt', 'recordedAt'],
    ['receivedAt', 'createdAt', 'updatedAt']
  ];

  const entries = [signalTimeline, riskSuggestions];
  for (let index = 0; index < entries.length; index += 1) {
    for (const entry of entries[index]) {
      if (!entry || typeof entry !== 'object') continue;
      for (const field of candidateFields[index]) {
        const value = entry[field];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
  }

  return null;
}

function extractSignalSourceMetadata(envelope) {
  if (!isSignalEnvelope(envelope) && !isSuggestionEnvelope(envelope)) {
    return null;
  }

  return {
    source: typeof envelope.source === 'string' ? envelope.source : 'unknown-simulation-provider',
    provider: typeof envelope.provider === 'string' ? envelope.provider : 'simulation-provider',
    mode: typeof envelope.mode === 'string' ? envelope.mode : 'simulation',
    clinicalUse: envelope.clinicalUse === false ? false : null,
    validationStatus: typeof envelope.validationStatus === 'string'
      ? envelope.validationStatus
      : 'not-clinically-validated',
    explanation: typeof envelope.explanation === 'string'
      ? envelope.explanation
      : PREVIEW_BOUNDARY_COPY
  };
}

function formatProviderLabel(providerId, providerType) {
  const labels = {
    placeholder: 'placeholder preview provider',
    'database-read-model': 'database read model',
    fixture: 'fictional fixture provider',
    'simulation-provider': 'simulation provider'
  };

  return `${providerId} (${labels[providerType] ?? 'simulation provider'})`;
}

function buildSignalSnapshot({ signals, suggestions } = {}) {
  const signalTimelineSource = isSignalEnvelope(signals) ? signals.signals : signals;
  const riskSuggestionSource = isSuggestionEnvelope(suggestions) ? suggestions.suggestions : suggestions;
  const signalTimeline = Array.isArray(signalTimelineSource) ? signalTimelineSource.map(cloneSnapshotEntry).filter(Boolean) : [];
  const riskSuggestions = Array.isArray(riskSuggestionSource) ? riskSuggestionSource.map(cloneSnapshotEntry).filter(Boolean) : [];
  const hasData = signalTimeline.length > 0 || riskSuggestions.length > 0;
  const sourceFreshnessCandidate =
    signalTimeline.find((signal) => signal && signal.sourceFreshness != null)?.sourceFreshness ??
    riskSuggestions.find((suggestion) => suggestion && suggestion.sourceFreshness != null)?.sourceFreshness;

  return {
    signalTimeline,
    riskSuggestions,
    signalSourceMetadata: extractSignalSourceMetadata(signals),
    suggestionSourceMetadata: extractSignalSourceMetadata(suggestions),
    sourceFreshness: coerceFreshness(sourceFreshnessCandidate, hasData),
    missingDataNotes: collectMissingDataNotes(signalTimeline, riskSuggestions, hasData),
    receivedAt: receivedAtFromEntries(signalTimeline, riskSuggestions)
  };
}

export default function App() {
  const { state, dispatch, reset } = useSimulationWorkspace();
  const selectedPatient = selectPatientFromState(state) ?? state.patients[0];
  const demoScenarioOptions = useMemo(() => getDemoScenarioOptions(), []);
  const selectedScenario = useMemo(
    () => demoScenarioOptions.find((option) => option.id === state.selectedScenarioId) ?? demoScenarioOptions[0] ?? null,
    [demoScenarioOptions, state.selectedScenarioId]
  );
  const reviewSignals = useMemo(
    () => selectPatientSimulationSignals(state, selectedPatient?.id),
    [selectedPatient?.id, state]
  );
  const potassiumFlag = useMemo(() => evaluatePotassiumSafetyGap(selectedPatient), [selectedPatient]);
  const heuristicCues = useMemo(
    () => buildHeuristicCues({ signals: reviewSignals, flag: potassiumFlag }),
    [reviewSignals, potassiumFlag]
  );
  const allTasks = selectAllTasks(state);
  const openTaskCount = allTasks.filter((task) => task.status !== 'Done').length;
  const showPatientPanel = ['board', 'patients', 'observations', 'tasks', 'escalations', 'handover', 'discharges'].includes(state.selectedView);
  const riskSupport = useMemo(() => {
    return createSimulationRiskSupport({ patient: selectedPatient, safetyFlag: potassiumFlag });
  }, [selectedPatient, potassiumFlag]);
  const hospitalInsights = useMemo(
    () => getHospitalInsightsSnapshot({
      currentWardName: state.currentWardName,
      hospitalName: state.hospitalName
    }),
    [state.currentWardName, state.hospitalName]
  );
  const selectedSignalSnapshot = state.signalSnapshots?.[selectedPatient?.id] ?? null;
  const simulationReviewReport = useMemo(
    () =>
      getSimulationReviewReportSnapshot({
        patient: selectedPatient,
        reviewSignals,
        hospitalInsights,
        signalSnapshot: selectedSignalSnapshot,
        selectedScenario
      }),
    [hospitalInsights, reviewSignals, selectedPatient, selectedSignalSnapshot, selectedScenario]
  );
  const initialDraft = useMemo(() => {
    return formatDraftSections(createSbarDraft({ patient: selectedPatient, flag: potassiumFlag }));
  }, [selectedPatient, potassiumFlag]);
  const [draftText, setDraftText] = useState(initialDraft);
  const [auditEvents, setAuditEvents] = useState(() => initialAuditEvents(selectedPatient));
  const [draftStatus, setDraftStatus] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [backendWorkspace, setBackendWorkspace] = useState(null);
  const [readinessReport, setReadinessReport] = useState(null);
  const [serverAuditStatus, setServerAuditStatus] = useState('');
  const [backendAuditEvents, setBackendAuditEvents] = useState([]);
  const [backendAuditStatus, setBackendAuditStatus] = useState('');
  const [isRefreshingBackendAudit, setIsRefreshingBackendAudit] = useState(false);
  const [isHospitalInsightsOpen, setIsHospitalInsightsOpen] = useState(false);
  const [isReviewReportOpen, setIsReviewReportOpen] = useState(false);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    setDraftText(formatDraftSections(createSbarDraft({ patient: selectedPatient, flag: potassiumFlag })));
    setAuditEvents(initialAuditEvents(selectedPatient));
    setDraftStatus('');
    setServerAuditStatus('');
  }, [selectedPatient?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadSignalSnapshot() {
      const patientId = selectedPatient?.id;
      if (!patientId) return;

      let signals = null;
      let suggestions = null;
      try {
        [signals, suggestions] = await Promise.all([
          requestSignalTimeline({ patientId, includeMetadata: true }),
          requestRiskSuggestions({ patientId, includeMetadata: true })
        ]);
      } catch {
        signals = null;
        suggestions = null;
      }

      if (cancelled) return;

      dispatch({
        type: 'signal/snapshotStored',
        payload: {
          patientId,
          snapshot: buildSignalSnapshot({ signals, suggestions })
        }
      });
    }

    void loadSignalSnapshot();

    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedPatient?.id]);

  function selectPatient(patientId) {
    const nextPatient = selectPatientFromState(state, patientId) ?? state.patients[0];
    const nextFlag = evaluatePotassiumSafetyGap(nextPatient);
    const nextDraft = createSbarDraft({ patient: nextPatient, flag: nextFlag });
    dispatch({ type: 'patient/selected', payload: { patientId: nextPatient.id } });
    setDraftText(formatDraftSections(nextDraft));
    setAuditEvents(initialAuditEvents(nextPatient));
    setDraftStatus('');
    setServerAuditStatus('');
  }

  async function generateProviderDraft() {
    setIsGeneratingDraft(true);
    setDraftStatus('');
    const draft = await requestSbarDraft({ patient: selectedPatient, flag: potassiumFlag });
    setDraftText(formatDraftSections(draft));
    setDraftStatus(draft.provider === 'openai' ? 'OpenAI provider draft ready' : 'Deterministic fallback draft ready');
    setIsGeneratingDraft(false);
  }

  function saveDraft() {
    const label = 'SBAR draft edited and saved';
    setAuditEvents((events) => [
      createAuditEvent({ label, detail: draftText }),
      ...events
    ]);
    setDraftStatus(label);
    mirrorServerAuditEvent({
      patientId: selectedPatient.id,
      eventType: 'draft.saved',
      eventSummary: 'Fictional SBAR draft saved',
      sourceTable: 'drafts',
      metadata: { screen: 'patient_panel' }
    });
  }

  function navigate(view) {
    dispatch({ type: 'navigation/changed', payload: { view } });
    setDraftStatus('');
    setServerAuditStatus('');
  }

  function changeDemoScenario(scenarioId) {
    dispatch({ type: 'scenario/selected', payload: { scenarioId } });
    setIsHospitalInsightsOpen(false);
    setIsReviewReportOpen(false);
    setDialog(null);
    setDraftStatus('');
    setServerAuditStatus('');
  }

  function togglePresentationMode() {
    setIsPresentationMode((current) => !current);
  }

  function mirrorServerAuditEvent({ patientId, eventType, eventSummary, sourceTable, metadata = {} }) {
    setServerAuditStatus('');
    void requestSimulationAuditEvent({
      patientId,
      eventType,
      eventSummary,
      actorRole: 'charge_nurse',
      sourceTable,
      metadata
    }).then((event) => {
      if (event?.source) {
        setServerAuditStatus(`Server audit mirrored to ${event.source}`);
      }
    });
  }

  function recordObservation(observation) {
    dispatch({ type: 'observation/added', payload: observation });
    setDraftStatus(`Observation recorded for ${observation.patientId}`);
    mirrorServerAuditEvent({
      patientId: observation.patientId,
      eventType: 'observation.recorded',
      eventSummary: 'Fictional observation recorded',
      sourceTable: 'observations',
      metadata: { screen: 'observations', news2: observation.news2 }
    });
  }

  function addTask(task) {
    dispatch({ type: 'task/added', payload: task });
    setDraftStatus(`Task added for ${task.patientId}`);
    mirrorServerAuditEvent({
      patientId: task.patientId,
      eventType: 'task.created',
      eventSummary: 'Fictional task created',
      sourceTable: 'tasks',
      metadata: { screen: state.selectedView }
    });
  }

  function changeTaskStatus(change) {
    dispatch({ type: 'task/statusChanged', payload: change });
    setDraftStatus(`Task marked ${change.status}`);
    mirrorServerAuditEvent({
      patientId: change.patientId,
      eventType: change.status === 'Done' ? 'task.completed' : 'task.reopened',
      eventSummary: `Fictional task marked ${change.status}`,
      sourceTable: 'tasks',
      metadata: { screen: 'tasks', taskId: change.taskId, status: change.status }
    });
  }

  function createEscalation(escalation) {
    dispatch({ type: 'escalation/created', payload: escalation });
    setDraftStatus(`Escalation created for ${escalation.patientId}`);
    mirrorServerAuditEvent({
      patientId: escalation.patientId,
      eventType: 'escalation.created',
      eventSummary: 'Fictional escalation created',
      sourceTable: 'escalations',
      metadata: { screen: 'escalations' }
    });
  }

  function changeEscalationStatus(change) {
    dispatch({ type: 'escalation/statusChanged', payload: change });
    setDraftStatus(`Escalation ${change.status}`);
    mirrorServerAuditEvent({
      patientId: change.patientId,
      eventType: change.status === 'Closed' ? 'escalation.closed' : 'escalation.updated',
      eventSummary: `Fictional escalation ${change.status}`,
      sourceTable: 'escalations',
      metadata: { screen: 'escalations', escalationId: change.escalationId, status: change.status }
    });
  }

  function saveHandover(handover) {
    dispatch({ type: 'handover/saved', payload: handover });
    setDraftStatus(`Handover saved for ${handover.patientId}`);
    mirrorServerAuditEvent({
      patientId: handover.patientId,
      eventType: 'handover.saved',
      eventSummary: 'Fictional handover saved',
      sourceTable: 'handover',
      metadata: { screen: 'handover', completion: Number(handover.handoverComplete) }
    });
  }

  function saveDischargeBlockers(discharge) {
    dispatch({ type: 'discharge/blockersChanged', payload: discharge });
    setDraftStatus(`Discharge readiness saved for ${discharge.patientId}`);
    mirrorServerAuditEvent({
      patientId: discharge.patientId,
      eventType: 'discharge.updated',
      eventSummary: 'Fictional discharge readiness updated',
      sourceTable: 'discharges',
      metadata: { screen: 'discharges', blockerCount: discharge.blockers.length }
    });
  }

  function exportWardBoard() {
    try {
      downloadSimulationCsv('safeflow-fictional-ward-board.csv', buildWardReportRows(state.patients));
      setDraftStatus('Fictional ward board exported');
    } catch {
      setDraftStatus('Ward board export could not be created');
    }
  }

  function saveSettings(settings) {
    dispatch({ type: 'settings/changed', payload: settings });
    setDraftStatus('Simulation settings saved');
  }

  async function checkBackendWorkspace() {
    setIsCheckingBackend(true);
    const snapshot = await requestWorkspaceSnapshot();
    if (snapshot) {
      setBackendWorkspace({
        source: snapshot.source ?? 'simulation endpoint',
        patientCount: snapshot.workspace?.summary?.patientCount ?? 0,
        openTaskCount: snapshot.workspace?.summary?.openTaskCount ?? 0,
        activeEscalationCount: snapshot.workspace?.summary?.activeEscalationCount ?? 0
      });
      setDraftStatus('Backend workspace check complete');
    } else {
      setBackendWorkspace(null);
      setDraftStatus('Backend workspace unavailable; using browser-local simulation');
    }
    setIsCheckingBackend(false);
  }

  async function checkBuildReadiness() {
    setIsCheckingReadiness(true);
    const report = await requestReadinessReport();
    if (report) {
      setReadinessReport({
        migrationLabel: report.migrations?.approved ? 'Migration approval current' : 'Migration approval needs review',
        draftProvider: report.providers?.draft ?? 'Unknown',
        workspaceProvider: report.providers?.workspace ?? 'Unknown',
        auditProvider: report.providers?.audit ?? 'Unknown',
        signalProvider: formatProviderLabel(
          report.providerMetadata?.signals?.providerId ?? report.providers?.signals ?? 'unknown-signal-provider',
          report.providerMetadata?.signals?.provider ?? 'simulation-provider'
        ),
        suggestionProvider: formatProviderLabel(
          report.providerMetadata?.suggestions?.providerId ?? report.providers?.suggestions ?? 'unknown-suggestion-provider',
          report.providerMetadata?.suggestions?.provider ?? 'simulation-provider'
        ),
        databaseLabel: report.database?.configured ? 'Simulation database configured' : 'Fixture mode',
        boundaryNote: report.explanation ?? PREVIEW_BOUNDARY_COPY
      });
      setDraftStatus('Build readiness check complete');
    } else {
      setReadinessReport(null);
      setDraftStatus('Build readiness unavailable; keep simulation-only defaults');
    }
    setIsCheckingReadiness(false);
  }

  async function refreshBackendAuditEvents() {
    setIsRefreshingBackendAudit(true);
    const auditPayload = await requestSimulationAuditEvents();

    if (auditPayload) {
      setBackendAuditEvents(auditPayload.events);
      setBackendAuditStatus(`Backend audit source: ${auditPayload.source}`);
      setDraftStatus('Backend audit refresh complete');
    } else {
      setBackendAuditEvents([]);
      setBackendAuditStatus('Backend audit unavailable; local audit retained');
      setDraftStatus('Backend audit unavailable; local audit retained');
    }

    setIsRefreshingBackendAudit(false);
  }

  function confirmReset() {
    reset();
    setDialog(null);
    setDraftStatus('Simulation reset to fictional defaults');
  }

  function requestContact(patient) {
    setDialog({ type: 'contact', patientId: patient.id });
  }

  function confirmContact() {
    const patientId = dialog?.patientId;
    if (!patientId) return;
    dispatch({
      type: 'contact/recorded',
      payload: {
        patientId,
        detail: `Medical team contact documented for ${patientId} in simulation.`
      }
    });
    setDialog(null);
    setDraftStatus(`Simulated team contact recorded for ${patientId}`);
    mirrorServerAuditEvent({
      patientId,
      eventType: 'contact.recorded',
      eventSummary: 'Fictional team contact recorded',
      sourceTable: 'contacts',
      metadata: { screen: 'patient_panel' }
    });
  }

  return (
    <main className={`app-shell ${state.settings.compactMode ? 'compact-mode' : ''} ${isPresentationMode ? 'presentation-mode' : ''}`}>
      <WorkspaceNav
        activeView={state.selectedView}
        escalationCount={selectActiveEscalationCount(state)}
        onNavigate={navigate}
        taskCount={openTaskCount}
      />
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Simulation prototype</p>
            <h1>SafeFlow</h1>
          </div>
          <div className="topbar-actions">
            <DemoScenarioSelector
              description={state.scenarioDescription}
              onChange={changeDemoScenario}
              options={demoScenarioOptions}
              value={state.selectedScenarioId}
            />
            <span className="product-note">SafeFlow Nursing concept</span>
            <button
              aria-pressed={isPresentationMode}
              className="secondary-action presentation-mode-trigger"
              onClick={togglePresentationMode}
              type="button"
            >
              {isPresentationMode ? 'Exit presentation mode' : 'Presentation mode'}
            </button>
            <SimulationReviewReportButton
              isOpen={isReviewReportOpen}
              onClick={() => {
                setIsReviewReportOpen((current) => !current);
                setIsHospitalInsightsOpen(false);
              }}
            />
            <HospitalInsightsButton
              isOpen={isHospitalInsightsOpen}
              onClick={() => {
                setIsHospitalInsightsOpen((current) => !current);
                setIsReviewReportOpen(false);
              }}
            />
          </div>
        </header>
        {isPresentationMode && (
          <section className="presentation-banner" aria-label="Presentation mode">
            <div className="presentation-banner-copy">
              <p className="eyebrow">Presentation mode</p>
              <h2>Simulation-only SafeFlow demo</h2>
              <p className="presentation-banner-boundary">{PRESENTATION_BOUNDARY_NOTE}</p>
              <p className="presentation-banner-scenario">
                Selected scenario: <strong>{selectedScenario?.label ?? 'Demo scenario'}</strong>
              </p>
              <p className="presentation-banner-description">
                {selectedScenario?.description ?? 'Fictional patient and ward context for demonstration and human-led review only.'}
              </p>
            </div>
            <div className="presentation-banner-actions">
              <button className="secondary-action presentation-exit-trigger" onClick={togglePresentationMode} type="button">
                Exit presentation mode
              </button>
            </div>
            <ol className="presentation-flow" aria-label="Presentation flow">
              {PRESENTATION_FLOW_STEPS.map((step, index) => (
                <li key={step}>
                  <span>Step {index + 1}</span>
                  <strong>{step}</strong>
                </li>
              ))}
            </ol>
            <p className="presentation-banner-note">{PRESENTATION_ROADMAP_NOTE}</p>
          </section>
        )}
        {state.selectedView !== 'hospital-insights' && <SafetyBanner />}
        <nav className="tab-list" aria-label="Prototype journey">
          {tabs.map((tab) => (
            <button
              aria-selected={state.selectedView === tab.id}
              className={state.selectedView === tab.id ? 'active' : ''}
              key={tab.id}
              onClick={() => navigate(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className={`dashboard-layout ${showPatientPanel ? '' : 'full-width'}`}>
          <div>
            {state.selectedView === 'board' && (
              <WardSafetyBoard
                summary={state.wardSummary}
                patients={state.patients}
                selectedPatientId={selectedPatient.id}
                onSelectPatient={selectPatient}
                onExport={exportWardBoard}
              />
            )}
            {state.selectedView === 'patients' && (
              <MyPatientsView
                patients={state.patients}
                simulationUser={state.settings.simulationUser}
                onSelectPatient={selectPatient}
              />
            )}
            {state.selectedView === 'observations' && (
              <ObservationsView patient={selectedPatient} onRecord={recordObservation} />
            )}
            {state.selectedView === 'tasks' && (
              <TasksView
                onAddTask={addTask}
                onChangeStatus={changeTaskStatus}
                patients={state.patients}
                selectedPatientId={selectedPatient.id}
                tasks={allTasks}
              />
            )}
            {state.selectedView === 'escalations' && (
              <EscalationsView
                escalations={state.escalations}
                onChangeStatus={changeEscalationStatus}
                onCreate={createEscalation}
                patients={state.patients}
                selectedPatientId={selectedPatient.id}
                simulationUser={state.settings.simulationUser}
              />
            )}
            {state.selectedView === 'handover' && (
              <HandoverDischargeView
                onSaveHandover={saveHandover}
                patient={selectedPatient}
                riskSupport={riskSupport}
              />
            )}
            {state.selectedView === 'discharges' && (
              <DischargesView
                onSaveBlockers={saveDischargeBlockers}
                onSelectPatient={selectPatient}
                patients={state.patients}
                selectedPatientId={selectedPatient.id}
              />
            )}
            {state.selectedView === 'reports' && (
              <ReportsView auditEvents={state.auditEvents} onExportWard={exportWardBoard} patients={state.patients} />
            )}
            {state.selectedView === 'hospital-insights' && (
              <HospitalInsightsView
                currentWardName={state.currentWardName}
                hospitalName={state.hospitalName}
                heuristicCues={heuristicCues}
                patient={selectedPatient}
                reviewSignals={reviewSignals}
                safetyFlag={potassiumFlag}
              />
            )}
            {state.selectedView === 'scenarios' && <ScenarioLibraryView />}
            {state.selectedView === 'competency-passport' && (
              <CompetencyPassportView />
            )}
            {state.selectedView === 'learning-hub' && <LearningHubView />}
            {state.selectedView === 'twin' && (
              <PatientJourneyTwin patient={selectedPatient} />
            )}
            {state.selectedView === 'audit' && (
              <AuditLearningView
                backendAuditStatus={backendAuditStatus}
                backendEvents={backendAuditEvents}
                events={state.auditEvents}
                isLoadingBackendAudit={isRefreshingBackendAudit}
                onRefreshBackendAudit={refreshBackendAuditEvents}
              />
            )}
            {state.selectedView === 'settings' && (
              <SettingsView
                backendWorkspace={backendWorkspace}
                isCheckingBackend={isCheckingBackend}
                isCheckingReadiness={isCheckingReadiness}
                onCheckBackend={checkBackendWorkspace}
                onCheckReadiness={checkBuildReadiness}
                onRequestReset={() => setDialog({ type: 'reset' })}
                onSave={saveSettings}
                readinessReport={readinessReport}
                settings={state.settings}
              />
            )}
          </div>
          {showPatientPanel && (
            <PatientSafetyPanel
              flag={potassiumFlag}
              draftText={draftText}
              isGeneratingDraft={isGeneratingDraft}
              onAddTask={addTask}
              onDraftChange={setDraftText}
              onGenerateDraft={generateProviderDraft}
              onRequestContact={requestContact}
              onSaveDraft={saveDraft}
              patient={selectedPatient}
              heuristicCues={heuristicCues}
              reviewSignals={reviewSignals}
              signalSnapshot={state.signalSnapshots?.[selectedPatient.id] ?? null}
            />
          )}
        </div>
        {!isPresentationMode && <ArchitectureStrip />}
        <HospitalInsightsDrawer
          isOpen={isHospitalInsightsOpen}
          onClose={() => setIsHospitalInsightsOpen(false)}
          snapshot={hospitalInsights}
        />
        <SimulationReviewReportDrawer
          isOpen={isReviewReportOpen}
          onClose={() => setIsReviewReportOpen(false)}
          snapshot={simulationReviewReport}
        />
        {draftStatus && <p className="status-message" role="status">{draftStatus}</p>}
        {serverAuditStatus && <p className="backend-note" role="status">{serverAuditStatus}</p>}
      </div>
      {dialog?.type === 'reset' && (
        <SimulationDialog confirmLabel="Confirm reset" onClose={() => setDialog(null)} onConfirm={confirmReset} title="Reset simulation">
          <p>This clears browser-local changes and restores the original fictional scenario.</p>
        </SimulationDialog>
      )}
      {dialog?.type === 'contact' && (
        <SimulationDialog confirmLabel="Record contact" onClose={() => setDialog(null)} onConfirm={confirmContact} title="Record simulated team contact">
          <p>No call will be placed. This records a fictional contact event for {dialog.patientId}.</p>
        </SimulationDialog>
      )}
    </main>
  );
}
