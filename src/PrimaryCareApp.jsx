import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { PrimaryCareWorkspace } from './components/PrimaryCareWorkspace.jsx';
import { getPrimaryCareScenario, getPrimaryCareScenarioOptions, PRIMARY_CARE_PATHWAY } from './data/primaryCareScenarios.js';
import { summarisePrimaryCareContacts } from './domain/primaryCareReview.js';

const initialAuditEvents = [
  { id: 'pc-audit-1', time: '08:05', label: 'Primary care simulation opened', detail: 'Fictional workflow records loaded.' },
  { id: 'pc-audit-2', time: '08:06', label: 'Deterministic checks completed', detail: 'Documentation-only traffic-light cues prepared for human review.' }
];

export function PrimaryCareApp({ onPathwayChange, onSignOut } = {}) {
  const scenarioOptions = useMemo(() => getPrimaryCareScenarioOptions(), []);
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarioOptions[0]?.id ?? '');
  const [activeView, setActiveView] = useState('practice-overview');
  const scenario = useMemo(() => getPrimaryCareScenario(selectedScenarioId), [selectedScenarioId]);
  const [selectedRecordId, setSelectedRecordId] = useState(scenario.contacts[0]?.id ?? '');
  const [notes, setNotes] = useState({});
  const [status, setStatus] = useState('');
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const summary = useMemo(() => summarisePrimaryCareContacts(scenario.contacts), [scenario]);
  const selectedRecord = scenario.contacts.find((record) => record.id === selectedRecordId) ?? scenario.contacts[0];

  useEffect(() => {
    setSelectedRecordId(scenario.contacts[0]?.id ?? '');
    setStatus('');
  }, [scenario]);

  function navigate(view) {
    setActiveView(view);
    setStatus('');
  }

  function changeScenario(scenarioId) {
    setSelectedScenarioId(scenarioId);
    setActiveView('practice-overview');
  }

  function saveReviewNote(recordId) {
    const note = notes[recordId]?.trim();
    const label = note ? `Review note saved for ${recordId}` : `Blank review note recorded for ${recordId}`;
    setStatus(label);
    setAuditEvents((events) => [{
      id: `pc-audit-${Date.now()}`,
      time: 'Simulation session',
      label,
      detail: 'Browser-local fictional review event.'
    }, ...events]);
  }

  return (
    <AppShell
      activeView={activeView}
      carePathway={PRIMARY_CARE_PATHWAY}
      compactMode={false}
      currentLocationName={scenario.networkName}
      currentWardName={scenario.practiceName}
      dateLabel={scenario.dateLabel}
      escalationCount={summary.documentationBlockers}
      onCarePathwayChange={onPathwayChange}
      onNavigate={navigate}
      onScenarioChange={changeScenario}
      onSignOut={onSignOut}
      scenarioDescription={scenario.description}
      scenarioOptions={scenarioOptions}
      selectedScenarioId={selectedScenarioId}
      taskCount={summary.reviewItems + summary.documentationBlockers}
    >
      <PrimaryCareWorkspace
        activeView={activeView}
        auditEvents={auditEvents}
        notes={notes}
        onNoteChange={(recordId, value) => setNotes((current) => ({ ...current, [recordId]: value }))}
        onSaveNote={saveReviewNote}
        onSelectRecord={setSelectedRecordId}
        scenario={scenario}
        selectedRecord={selectedRecord}
        status={status}
        summary={summary}
      />
    </AppShell>
  );
}
