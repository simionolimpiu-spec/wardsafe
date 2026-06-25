import { useMemo, useState } from 'react';
import { wardSummary } from './data/simulatedPatients.js';
import { createSbarDraft } from './domain/draftProvider.js';
import { evaluatePotassiumSafetyGap } from './domain/safetyRules.js';
import { createAuditEvent, initialAuditEvents } from './domain/workflowEvents.js';
import { requestSbarDraft } from './services/draftClient.js';
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

export default function App() {
  const { state, dispatch, reset } = useSimulationWorkspace();
  const selectedPatient = selectPatientFromState(state) ?? state.patients[0];
  const allTasks = selectAllTasks(state);
  const openTaskCount = allTasks.filter((task) => task.status !== 'Done').length;
  const showPatientPanel = ['board', 'patients', 'observations', 'tasks', 'escalations', 'handover', 'discharges', 'potassium'].includes(state.selectedView);
  const potassiumFlag = useMemo(() => evaluatePotassiumSafetyGap(selectedPatient), [selectedPatient]);
  const initialDraft = useMemo(() => {
    return formatDraftSections(createSbarDraft({ patient: selectedPatient, flag: potassiumFlag }));
  }, [selectedPatient, potassiumFlag]);
  const [draftText, setDraftText] = useState(initialDraft);
  const [auditEvents, setAuditEvents] = useState(() => initialAuditEvents(selectedPatient));
  const [draftStatus, setDraftStatus] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [dialog, setDialog] = useState(null);

  function selectPatient(patientId) {
    const nextPatient = selectPatientFromState(state, patientId) ?? state.patients[0];
    const nextFlag = evaluatePotassiumSafetyGap(nextPatient);
    const nextDraft = createSbarDraft({ patient: nextPatient, flag: nextFlag });
    dispatch({ type: 'patient/selected', payload: { patientId: nextPatient.id } });
    setDraftText(formatDraftSections(nextDraft));
    setAuditEvents(initialAuditEvents(nextPatient));
    setDraftStatus('');
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
  }

  function navigate(view) {
    dispatch({ type: 'navigation/changed', payload: { view } });
    setDraftStatus('');
  }

  function recordObservation(observation) {
    dispatch({ type: 'observation/added', payload: observation });
    setDraftStatus(`Observation recorded for ${observation.patientId}`);
  }

  function addTask(task) {
    dispatch({ type: 'task/added', payload: task });
    setDraftStatus(`Task added for ${task.patientId}`);
  }

  function changeTaskStatus(change) {
    dispatch({ type: 'task/statusChanged', payload: change });
    setDraftStatus(`Task marked ${change.status}`);
  }

  function createEscalation(escalation) {
    dispatch({ type: 'escalation/created', payload: escalation });
    setDraftStatus(`Escalation created for ${escalation.patientId}`);
  }

  function changeEscalationStatus(change) {
    dispatch({ type: 'escalation/statusChanged', payload: change });
    setDraftStatus(`Escalation ${change.status}`);
  }

  function saveHandover(handover) {
    dispatch({ type: 'handover/saved', payload: handover });
    setDraftStatus(`Handover saved for ${handover.patientId}`);
  }

  function saveDischargeBlockers(discharge) {
    dispatch({ type: 'discharge/blockersChanged', payload: discharge });
    setDraftStatus(`Discharge readiness saved for ${discharge.patientId}`);
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
          <div>
            <p className="eyebrow">Simulation prototype</p>
            <h1>SafeFlow</h1>
          </div>
          <span className="product-note">SafeFlow Nursing concept</span>
        </header>
        <SafetyBanner />
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
            {state.selectedView === 'handover' && <HandoverDischargeView onSaveHandover={saveHandover} patient={selectedPatient} />}
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
            {state.selectedView === 'audit' && <AuditLearningView events={state.auditEvents} />}
            {state.selectedView === 'settings' && (
              <SettingsView onRequestReset={() => setDialog({ type: 'reset' })} onSave={saveSettings} settings={state.settings} />
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
