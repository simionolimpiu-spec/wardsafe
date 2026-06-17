import { useMemo, useState } from 'react';
import { simulatedPatients, wardSummary } from './data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from './domain/safetyRules.js';
import { PatientSafetyPanel } from './components/PatientSafetyPanel.jsx';
import { SafetyBanner } from './components/SafetyBanner.jsx';
import { WardSafetyBoard } from './components/WardSafetyBoard.jsx';

export default function App() {
  const [selectedPatientId, setSelectedPatientId] = useState(simulatedPatients[0].id);
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
      <div className="dashboard-layout">
        <WardSafetyBoard
          summary={wardSummary}
          patients={simulatedPatients}
          selectedPatientId={selectedPatient.id}
          onSelectPatient={setSelectedPatientId}
        />
        <PatientSafetyPanel patient={selectedPatient} flag={potassiumFlag} />
      </div>
    </main>
  );
}
