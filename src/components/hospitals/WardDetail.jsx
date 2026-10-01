import { PatientNameWithChart } from './PatientNameWithChart.jsx';
import { ragWord } from '../../domain/patientRag.js';
import { useEffect, useRef, useState } from 'react';
import { DaySurgeryBoard } from '../DaySurgeryBoard.jsx';
import { ServiceEvidence } from './ServiceEvidence.jsx';

function RagBar({ summary, total }) {
  const denom = total || 1;
  const seg = (n) => `${(n / denom) * 100}%`;
  return (
    <div className="rag-bar" role="img"
      aria-label={`${summary.red} red, ${summary.amber} amber, ${summary.green} green, ${summary.unknown ?? 0} not assessed`}>
      <span className="rag-bar-red" style={{ width: seg(summary.red) }} />
      <span className="rag-bar-amber" style={{ width: seg(summary.amber) }} />
      <span className="rag-bar-green" style={{ width: seg(summary.green) }} />
      <span style={{ width: seg(summary.unknown ?? 0), background: '#4c6272' }} />
    </div>
  );
}

function StaffRow({ member }) {
  return (
    <li>
      <span className="staff-role">{member.role}</span>
      <span className="staff-name">{member.name}</span>
      <span className="staff-band">Band {member.band}</span>
    </li>
  );
}

export function WardDetail({ ward, hospital, onBack, onOpenWorkflow }) {
  const { staffing } = ward;
  const headingRef = useRef(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  useEffect(() => { headingRef.current?.focus(); }, []);
  const visiblePatients = ward.patients.filter((patient) =>
    `${patient.name} ${patient.id} ${patient.bed} ${patient.responsibleNurse}`.toLowerCase().includes(query.trim().toLowerCase())
    && (status === 'all' || (status === 'review' ? patient.rag !== 'green' : patient.rag === status))
  );
  if (ward.profile?.mode === 'day-surgery') return <section className="ward-detail" aria-label={`${ward.name} detail`}>
    <button type="button" className="back-link" onClick={onBack}>← All wards</button>
    <h2 ref={headingRef} tabIndex={-1}>{ward.name}</h2>
    <ServiceEvidence profile={ward.profile} />
    {onOpenWorkflow && <button type="button" className="primary-action" onClick={() => onOpenWorkflow()}>Open this ward workspace</button>}
    <DaySurgeryBoard patients={ward.patients} date={ward.activityDate} onReviewPatient={onOpenWorkflow} />
  </section>;
  return (
    <section className="ward-detail" aria-label={`${ward.name} detail`}>
      <button type="button" className="back-link" onClick={onBack}>← All wards</button>

      <header className="ward-detail-head">
        <div>
          <p className="eyebrow">{hospital.shortName}</p>
          <h2 ref={headingRef} tabIndex={-1}>{ward.name}</h2>
          <p className="ward-specialty">{ward.specialty}</p>
          <p>{ward.profile?.focus}</p><p>{ward.profile?.evidence}</p>
          {ward.profile?.source && <a href={ward.profile.source} target="_blank" rel="noreferrer">Published service information</a>}
          {onOpenWorkflow && <button type="button" className="primary-action" onClick={() => onOpenWorkflow()}>Open this ward workspace</button>}
        </div>
        <div className="ward-detail-metrics">
          <div><strong>{ward.patientCount}</strong><span>{['inpatient', 'assessment'].includes(ward.profile?.mode) ? 'current fictional patients' : 'fictional session attendances'}</span></div>
          <div><strong>{ward.bedCount ?? '—'}</strong><span>{ward.profile?.capacityLabel}</span></div>
          <div><strong>{ward.profile?.observationScale === 'NEWS2' ? ward.ragSummary.highNews2 : 'Not applicable'}</strong><span>{ward.profile?.observationScale === 'NEWS2' ? 'NEWS2 ≥ 5' : 'Adult NEWS2'}</span></div>
        </div>
      </header>

      <ServiceEvidence profile={ward.profile} />

      <div className="ward-detail-grid">
        <aside className="ward-staffing" aria-label="Ward nursing establishment">
          <h3>Nursing establishment (this shift)</h3>
          <ul className="staff-list">
            <StaffRow member={staffing.matron} />
            <StaffRow member={staffing.sister} />
            <StaffRow member={staffing.inCharge} />
            {staffing.staffNurses.map((member) => (
              <StaffRow key={member.name} member={member} />
            ))}
            {staffing.healthcareAssistants.map((member) => (
              <StaffRow key={member.name} member={member} />
            ))}
          </ul>
          <p className="staffing-note">
            {staffing.staffNurses.length} registered staff nurses, nurse in charge,
            ward sister and matron. Illustrative fictional roster, not the actual establishment or recommended staffing.
          </p>
        </aside>

        <div className="ward-patients">
          <div className="ward-patients-head">
            <h3>Patients ({ward.patientCount})</h3>
            <p className="hint">Select a patient name to review their care-status chart.</p>
          </div>
          <div className="ward-review-tools">
            <label>Find a patient<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, bed, ID or nurse" /></label>
            <label>Care status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All patients</option><option value="review">Review needed or not assessed</option><option value="red">Red</option><option value="amber">Amber</option><option value="green">Green</option></select></label>
          </div>
          <p role="status">Showing {visiblePatients.length} of {ward.patientCount} fictional patients</p>
          {!ward.patientCount && <p>No patient list has been generated for this service. This does not mean that the real service is empty.</p>}
          <table className="patient-table hospital-patient-table" aria-label={`${ward.name} patients`}>
            <thead>
              <tr>
                <th scope="col">Bed</th>
                <th scope="col">Patient</th>
                <th scope="col">Age</th>
                <th scope="col">Reason for attendance</th>
                <th scope="col">Observations</th>
                <th scope="col">Named nurse</th>
                <th scope="col">Status</th>
                {onOpenWorkflow && <th scope="col">Review</th>}
              </tr>
            </thead>
            <tbody>
              {visiblePatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="cell-bed">{patient.bed}</td>
                  <td><PatientNameWithChart patient={patient} /></td>
                  <td>{patient.ageLabel ?? patient.age}</td>
                  <td className="cell-dx">{patient.diagnosis}{patient.simulatedCareLevel != null && <p>Fictional care level {patient.simulatedCareLevel}</p>}</td>
                  <td className={`cell-news2 news2-${patient.rag}`}>{patient.news2 ?? `${patient.observationScale} — no score recorded`}</td>
                  <td className="cell-nurse">{patient.responsibleNurse}</td>
                  <td><span className={`rag-pill rag-${patient.rag}`}>{ragWord(patient.rag)}</span></td>
                  {onOpenWorkflow && <td><button className="secondary-action" type="button" onClick={() => onOpenWorkflow(patient.id)} aria-label={`Review ${patient.name} in ward workspace`}>Review patient</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export { RagBar };
