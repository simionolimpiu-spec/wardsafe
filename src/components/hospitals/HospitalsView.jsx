import { useEffect, useMemo, useRef, useState } from 'react';
import { getPopulatedHospitals, ragSummaryOf } from '../../domain/wardPopulation.js';
import { WardDetail, RagBar } from './WardDetail.jsx';
import { directoryPatientsForWard } from '../../domain/hospitalWorkspace.js';
import { DEFAULT_ACTIVITY_DATE } from '../../domain/daySurgery.js';
import { HospitalCapabilities } from './ServiceEvidence.jsx';

function WardCard({ ward, onOpen, buttonRef }) {
  return (
    <button ref={buttonRef} type="button" className="ward-card" onClick={() => onOpen(ward.id)}>
      <div className="ward-card-head">
        <strong>{ward.name}</strong>
        <span className={`ward-group-tag group-${ward.wardGroup}`}>{ward.wardGroup}</span>
      </div>
      <p className="ward-card-specialty">{ward.specialty}</p>
      <div className="ward-card-metrics">
        <span>{!ward.profile.canPopulate || ward.profile.mode === 'procedure-area' ? 'Separate patient mix not modelled' : ward.profile.mode === 'inpatient' ? `${ward.patientCount} current inpatients` : ward.profile.mode === 'assessment' ? `${ward.patientCount} current assessments` : `${ward.patientCount} booked attendances`}</span>
        <span>{ward.bedCount ?? '—'} {ward.profile.capacityLabel}</span>
      </div>
      <p className="ward-profile-focus">{ward.profile.focus}</p>
      <p>{ward.profile.evidence}</p>
      {ward.patientCount > 0 && <RagBar summary={ward.ragSummary} total={ward.patientCount} />}
      <p className="ward-card-staff">
        Illustrative roster: {ward.staffing.staffNurses.length} staff nurses
      </p>
    </button>
  );
}

export function HospitalsView({ currentWardName, onOpenWorkflow, workspace, onOpenWard }) {
  const hospitals = useMemo(() => getPopulatedHospitals(workspace?.activityDate ?? DEFAULT_ACTIVITY_DATE).map((hospital) => {
    if (!workspace) return hospital;
    const wards = hospital.wards.map((ward) => {
      const patients = directoryPatientsForWard(workspace, hospital.id, ward.id, ward.patients);
      return { ...ward, patients, ragSummary: ragSummaryOf(patients) };
    });
    return { ...hospital, wards, ragSummary: ragSummaryOf(wards.flatMap((ward) => ward.patients)) };
  }), [workspace]);
  const [hospitalId, setHospitalId] = useState(workspace?.selectedHospitalId ?? hospitals[0]?.id ?? null);
  const [wardId, setWardId] = useState(workspace?.selectedWardId ?? null);
  const [query, setQuery] = useState('');
  const wardButtons = useRef(new Map());
  const returnToWard = useRef(null);

  useEffect(() => {
    if (!wardId && returnToWard.current) {
      wardButtons.current.get(returnToWard.current)?.focus();
      returnToWard.current = null;
    }
  }, [wardId]);

  const hospital = hospitals.find((entry) => entry.id === hospitalId) ?? hospitals[0];
  const originalWard = hospital?.wards.find((entry) => entry.id === wardId) ?? null;
  const ward = originalWard && workspace ? { ...originalWard,
    patients: directoryPatientsForWard(workspace, hospital.id, originalWard.id, originalWard.patients)
  } : originalWard;

  function selectHospital(id) {
    setHospitalId(id);
    setWardId(null);
    setQuery('');
  }

  return (
    <section className="hospitals-view" aria-label="Hospitals and wards">
      <header className="hospitals-head">
        <div>
          <p className="eyebrow">Secondary care · wards, day units and specialist services</p>
          <h1>Hospitals &amp; Wards</h1>
          <p className="hospitals-boundary">
            Real NHS trust and ward structures. All patients and staff are fictional. Simulation only, not for clinical use.
          </p>
        </div>
      </header>
      {onOpenWorkflow && <div className="ward-browser-tools">
        <p>Current ward workflow: <strong>{currentWardName}</strong>. Open any ward below to review its fictional patients.</p>
        <button className="primary-action" type="button" onClick={onOpenWorkflow}>Open current ward workflow</button>
      </div>}

      <nav className="hospital-tabs" aria-label="Select hospital">
        {hospitals.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`hospital-tab ${entry.id === hospital.id ? 'is-active' : ''}`}
            aria-pressed={entry.id === hospital.id}
            onClick={() => selectHospital(entry.id)}
          >
            <strong>{entry.shortName}</strong>
            <span>{entry.role}</span>
          </button>
        ))}
      </nav>

      <div className="hospital-summary">
        <div><strong>{hospital.wardCount}</strong><span>wards</span></div>
        <div><strong>{hospital.inpatientTotal}</strong><span>simulated inpatients</span></div>
        <div><strong>{hospital.assessmentTotal}</strong><span>current assessments</span></div>
        <div><strong>{hospital.dayActivityTotal}</strong><span>day / session records</span></div>
        <div><strong>{hospital.bedTotal}</strong><span>modelled inpatient capacity</span></div>
        <div className="hospital-summary-rag">
          <span className="chip rag-red">{hospital.ragSummary.red} red</span>
          <span className="chip rag-amber">{hospital.ragSummary.amber} amber</span>
          <span className="chip rag-green">{hospital.ragSummary.green} green</span>
        </div>
      </div>

      <HospitalCapabilities hospital={hospital} />
      {ward ? (
        <WardDetail key={ward.id} ward={ward} hospital={hospital}
          onOpenWorkflow={onOpenWard && ward.patients.length ? (patientId) => onOpenWard(hospital.id, ward.id, patientId) : undefined}
          onBack={() => { returnToWard.current = ward.id; setWardId(null); }} />
      ) : (
        <>
        <div className="ward-browser-tools"><label>Find a ward<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ward name or specialty" /></label></div>
        <div className="ward-grid">
          {hospital.wards.filter((entry) => `${entry.name} ${entry.specialty}`.toLowerCase().includes(query.toLowerCase().trim())).map((entry) => (
            <WardCard key={entry.id} ward={entry} onOpen={setWardId} buttonRef={(node) => { if (node) wardButtons.current.set(entry.id, node); else wardButtons.current.delete(entry.id); }} />
          ))}
        </div>
        {hospital.wards.every((entry) => !`${entry.name} ${entry.specialty}`.toLowerCase().includes(query.toLowerCase().trim())) && <p role="status">No wards match. Try another name or specialty.</p>}
        </>
      )}
    </section>
  );
}
