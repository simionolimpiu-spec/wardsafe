import { useMemo, useState } from 'react';
import { wardSummary } from './data/simulatedPatients.js';
import { createSbarDraft } from './domain/draftProvider.js';
import { evaluatePotassiumSafetyGap } from './domain/safetyRules.js';
import { createSimulationRiskSupport } from './domain/simulationRiskSupport.js';
import { createAuditEvent, initialAuditEvents } from './domain/workflowEvents.js';
import { requestReadinessReport } from './services/readinessClient.js';
import { requestSbarDraft } from './services/draftClient.js';
import { requestWorkspaceSnapshot } from './services/workspaceClient.js';
import {
  requestSimulationAuditEvent,
  requestSimulationAuditEvents
} from './services/auditClient.js';
import { AuditLearningView } from './components/AuditLearningView.jsx';
import { ArchitectureStrip } from './components/ArchitectureStrip.jsx';
import { HandoverDischargeView } from './components/HandoverDischargeView.jsx';
import { PatientSafetyPanel } from './components/PatientSafetyPanel.jsx';
import { PotassiumSafetyGapView } from './components/PotassiumSafetyGapView.jsx';
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
import { SimulationDialog } from './components/SimulationDialog.jsx';
import { SafeFlowPitch } from './components/SafeFlowPitch.jsx';
import {
  selectActiveEscalationCount,
  selectAllTasks,
  selectPatient as selectPatientFromState
} from './state/simulationWorkspace.js';
import { useSimulationWorkspace } from './state/useSimulationWorkspace.js';
import { buildWardReportRows, downloadSimulationCsv } from './domain/simulationExport.js';

const tabs = [
  { id: 'board', label: 'Ward board' },
  { id: 'handover', label: 'Handover' },
  { id: 'potassium', label: 'Potassium flag' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'audit', label: 'Audit' }
];

function formatDraftSections(draft) {
  return Object.entries(draft.sections)
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join('\n\n');
}

export function PrototypeApp({ onBackToPitch }) {
  const { state, dispatch, reset } = useSimulationWorkspace();
  const selectedPatient = selectPatientFromState(state) ?? state.patients[0];
  const allTasks = selectAllTasks(state);
  const openTaskCount = allTasks.filter((task) => task.status !== 'Done').length;
  const showPatientPanel = ['board', 'patients', 'observations', 'tasks', 'escalations', 'handover', 'discharges', 'potassium'].includes(state.selectedView);
  const potassiumFlag = useMemo(() => evaluatePotassiumSafetyGap(selectedPatient), [selectedPatient]);
  const riskSupport = useMemo(() => {
    return createSimulationRiskSupport({ patient: selectedPatient, safetyFlag: potassiumFlag });
  }, [selectedPatient, potassiumFlag]);
  const initialDraft = useMemo(() => {
    return formatDraftSections(createSbarDraft({ patient: selectedPatient, flag: potassiumFlag }));
  }, [selectedPatient, potassiumFlag]);
  const [draftText, setDraftText] = useState(initialDraft);
  const [auditEvents, setAuditEvents] = useState(() => initialAuditEvents(selectedPatient));
  const [draftStatus, setDraftStatus] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [backendWorkspace, setBackendWorkspace] = useState(null);
  const [readinessReport, setReadinessReport] = useState(null);
  const [serverAuditStatus, setServerAuditStatus] = useState('');
  const [backendAuditEvents, setBackendAuditEvents] = useState([]);
  const [backendAuditStatus, setBackendAuditStatus] = useState('');
  const [isRefreshingBackendAudit, setIsRefreshingBackendAudit] = useState(false);
  const [dialog, setDialog] = useState(null);

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
      metadata: { screen: 'potassium' }
    });
  }

  function navigate(view) {
    dispatch({ type: 'navigation/changed', payload: { view } });
    setDraftStatus('');
    setServerAuditStatus('');
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
        databaseLabel: report.database?.configured ? 'Simulation database configured' : 'Fixture mode'
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
    <main className={`app-shell ${state.settings.compactMode ? 'compact-mode' : ''}`}>
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
            {onBackToPitch && (
              <button className="secondary-action" onClick={onBackToPitch} type="button">
                Back to CEP pitch
              </button>
            )}
            <span className="product-note">SafeFlow Nursing concept</span>
          </div>
        </header>
        <SafetyBanner />
        <nav aria-label="Prototype journey">
          <div className="tab-list" role="tablist">
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
          </div>
        </nav>
        <div className={`dashboard-layout ${showPatientPanel ? '' : 'full-width'}`}>
          <div>
            {state.selectedView === 'board' && (
              <WardSafetyBoard
                summary={wardSummary}
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
            {state.selectedView === 'potassium' && (
              <PotassiumSafetyGapView
                patient={selectedPatient}
                flag={potassiumFlag}
                draftText={draftText}
                onDraftChange={setDraftText}
                onGenerateDraft={generateProviderDraft}
                onSaveDraft={saveDraft}
                isGeneratingDraft={isGeneratingDraft}
              />
            )}
            {state.selectedView === 'scenarios' && <ScenarioLibraryView />}
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
              onAddTask={addTask}
              onRequestContact={requestContact}
              patient={selectedPatient}
            />
          )}
        </div>
        <ArchitectureStrip />
        {draftStatus && <p className="status-message" role="status">{draftStatus}</p>}
        {serverAuditStatus && <p className="backend-note">{serverAuditStatus}</p>}
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

export default function App() {
  const [mode, setMode] = useState('pitch');

  if (mode === 'prototype') {
    return <PrototypeApp onBackToPitch={() => setMode('pitch')} />;
  }

  return <SafeFlowPitch onOpenPrototype={() => setMode('prototype')} />;
}
