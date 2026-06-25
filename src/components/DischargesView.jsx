import { CheckCircle2, CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DischargesView({ patients, selectedPatientId, onSelectPatient, onSaveBlockers }) {
  const patient = patients.find((item) => item.id === selectedPatientId) ?? patients[0];
  const [selectedBlockers, setSelectedBlockers] = useState(patient.dischargeBlockers);

  useEffect(() => {
    setSelectedBlockers(patient.dischargeBlockers);
  }, [patient.id, patient.dischargeBlockers]);

  function toggleBlocker(blocker) {
    setSelectedBlockers((current) => current.includes(blocker)
      ? current.filter((item) => item !== blocker)
      : [...current, blocker]);
  }

  return (
    <section className="operational-view" aria-labelledby="discharges-title">
      <header className="view-heading">
        <div><p className="eyebrow">Fictional readiness workflow</p><h2 id="discharges-title">Discharges</h2></div>
        <strong>{patients.filter((item) => item.dischargeReady).length} ready</strong>
      </header>
      <div className="patient-switcher" aria-label="Select discharge patient">
        {patients.map((item) => <button aria-pressed={item.id === patient.id} className={item.id === patient.id ? 'active' : ''} key={item.id} onClick={() => onSelectPatient(item.id)} type="button">{item.id}</button>)}
      </div>
      <div className="readiness-summary">
        {selectedBlockers.length === 0 ? <CheckCircle2 aria-hidden="true" size={20} /> : <CircleAlert aria-hidden="true" size={20} />}
        <strong>{selectedBlockers.length === 0 ? 'Ready for simulated discharge' : `${selectedBlockers.length} blocker${selectedBlockers.length === 1 ? '' : 's'} remain`}</strong>
      </div>
      <fieldset className="blocker-list">
        <legend>Readiness blockers for {patient.id}</legend>
        {patient.dischargeBlockers.map((blocker) => (
          <label key={blocker}><input checked={selectedBlockers.includes(blocker)} onChange={() => toggleBlocker(blocker)} type="checkbox" />{blocker}</label>
        ))}
        {patient.dischargeBlockers.length === 0 && <p className="empty-state">No blockers recorded in this fictional scenario.</p>}
      </fieldset>
      <button className="primary-action" onClick={() => onSaveBlockers({ patientId: patient.id, blockers: selectedBlockers })} type="button">Save discharge readiness</button>
    </section>
  );
}
