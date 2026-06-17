import { useMemo, useState } from 'react';
import { simulatedPatients, wardSummary } from './data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from './domain/safetyRules.js';
import { HandoverDischargeView } from './components/HandoverDischargeView.jsx';
import { PatientSafetyPanel } from './components/PatientSafetyPanel.jsx';
import { SafetyBanner } from './components/SafetyBanner.jsx';
import { WardSafetyBoard } from './components/WardSafetyBoard.jsx';

const tabs = [
  { id: 'board', label: 'Ward board' },
  { id: 'handover', label: 'Handover' }
];

export default function App() {
  const [selectedPatientId, setSelectedPatientId] = useState(simulatedPatients[0].id);
  const [activeTab, setActiveTab] = useState('board');
  const selectedPatient = simulatedPatients.find((patient) => patient.id === selectedPatientId) ?? simulatedPatients[0];
  const potassiumFlag = useMemo(() => evaluatePotassiumSafetyGap(selectedPatient), [selectedPatient]);

  return (
    <main className="app-shell">
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
              onSelectPatient={setSelectedPatientId}
            />
          )}
          {activeTab === 'handover' && <HandoverDischargeView patient={selectedPatient} />}
        </div>
        <PatientSafetyPanel patient={selectedPatient} flag={potassiumFlag} />
      </div>
    </main>
  );
}
