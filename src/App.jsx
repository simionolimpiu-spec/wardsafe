import { useMemo, useState } from 'react';
import { simulatedPatients, wardSummary } from './data/simulatedPatients.js';
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
  const [selectedPatientId, setSelectedPatientId] = useState(simulatedPatients[0].id);
  const [activeTab, setActiveTab] = useState('board');
  const selectedPatient = simulatedPatients.find((patient) => patient.id === selectedPatientId) ?? simulatedPatients[0];
  const potassiumFlag = useMemo(() => evaluatePotassiumSafetyGap(selectedPatient), [selectedPatient]);
  const initialDraft = useMemo(() => {
    return formatDraftSections(createSbarDraft({ patient: selectedPatient, flag: potassiumFlag }));
  }, [selectedPatient, potassiumFlag]);
  const [draftText, setDraftText] = useState(initialDraft);
  const [auditEvents, setAuditEvents] = useState(() => initialAuditEvents(selectedPatient));
  const [draftStatus, setDraftStatus] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  function selectPatient(patientId) {
    const nextPatient = simulatedPatients.find((patient) => patient.id === patientId) ?? simulatedPatients[0];
    const nextFlag = evaluatePotassiumSafetyGap(nextPatient);
    const nextDraft = createSbarDraft({ patient: nextPatient, flag: nextFlag });
    setSelectedPatientId(patientId);
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

  return (
    <main className="app-shell">
      <WorkspaceNav />
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
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="dashboard-layout">
          <div>
            {activeTab === 'board' && (
              <WardSafetyBoard
                summary={wardSummary}
                patients={simulatedPatients}
                selectedPatientId={selectedPatient.id}
                onSelectPatient={selectPatient}
              />
            )}
            {activeTab === 'handover' && <HandoverDischargeView patient={selectedPatient} />}
            {activeTab === 'potassium' && (
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
            {activeTab === 'scenarios' && <ScenarioLibraryView />}
            {activeTab === 'audit' && <AuditLearningView events={auditEvents} />}
          </div>
          <PatientSafetyPanel patient={selectedPatient} flag={potassiumFlag} />
        </div>
        <ArchitectureStrip />
        {draftStatus && <p className="status-message" role="status">{draftStatus}</p>}
      </div>
    </main>
  );
}
