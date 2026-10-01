import { useState } from 'react';
import { clockLabel, dayCaseTotals, durationLabel, validActivityDate } from '../domain/daySurgery.js';
import { DCU_SOURCE, DCU_LEAFLETS, DCU_SPECIALTIES, DAY_SURGERY_PROCEDURES, DCU_CATALOGUE_REVIEW_NOTES } from '../data/clinical/daySurgeryCatalogue.js';

export function DaySurgeryBoard({ patients, date, onDateChange, onReviewPatient, selectedPatientId }) {
  const [stage, setStage] = useState('All');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const totals = dayCaseTotals(patients);
  const visible = patients.filter((patient) => (stage === 'All' || patient.dayCase.stage === stage)
    && `${patient.name} ${patient.dayCase.procedure} ${patient.dayCase.consultant}`.toLowerCase().includes(query.toLowerCase().trim()));
  function changeDate(value) {
    if (!validActivityDate(value)) { setError('Choose a valid date.'); return; }
    if ([0, 6].includes(new Date(`${value}T12:00:00Z`).getUTCDay())) {
      setError('The published routine service runs Monday to Friday. Choose a weekday; the current list has been kept.'); return;
    }
    setError(''); setStage('All'); onDateChange?.(value);
  }
  return <section className="day-surgery-board operational-view" aria-labelledby="day-surgery-title">
    <header className="view-heading"><div><p className="eyebrow">James Paget · Day Care Unit</p><h2 id="day-surgery-title">Day surgery flow</h2></div>
      {onDateChange && <label htmlFor="day-surgery-date">Day list date<input type="date" id="day-surgery-date" value={date} onChange={(event) => changeDate(event.target.value)} aria-describedby={error ? 'day-date-error' : 'day-case-basis'} /></label>}
    </header>
    {error && <p id="day-date-error" role="alert">{error}</p>}
    <p id="day-case-basis">14:00 snapshot · {date}. Around 30 daily bookings is the user-provided modelling baseline. Other weekdays vary. All lists, people, timings and outcomes are fictional; these are not hospital performance figures.</p>
    <div className="day-flow-metrics" aria-label="Day surgery activity">
      {[[totals.booked, 'Booked today'], [totals.present, 'Currently in pathway'], [totals.inTheatre, 'In theatre'], [totals.recovery, 'Recovery / discharge review'], [totals.discharged, 'Discharged home'], [totals.transfers, 'Overnight admissions recorded'], [totals.cancelled, 'Cancelled']].map(([count, label]) => <article key={label}><strong>{count}</strong><span>{label}</span></article>)}
    </div>
    <p className="service-boundary">Published capacity: 20 day beds. The unit has no overnight accommodation. Daily bookings are not occupied beds. Transfers require a documented receiving-team decision; the simulation never recommends a destination.</p>
    <div className="ward-review-tools">
      <label>Find a case<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Patient, procedure or consultant" /></label>
      <label>Pathway stage<select value={stage} onChange={(event) => setStage(event.target.value)}>{['All', 'Booked', 'Arrived', 'In theatre', 'Recovery', 'Discharge review', 'Discharged', 'Awaiting transfer', 'Transferred', 'Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <p role="status">Showing {visible.length} of {patients.length} booked cases</p>
    <div className="day-flow-table" tabIndex={0} role="region" aria-label="Scrollable day surgery cases">
      <table aria-label="Day surgery list"><thead><tr><th scope="col">Patient / list</th><th scope="col">Procedure / consultant</th><th scope="col">Arrival / theatre</th><th scope="col">Stage / stay</th><th scope="col">Record</th></tr></thead>
        <tbody>{visible.map((patient) => { const item = patient.dayCase; return <tr key={patient.id} className={selectedPatientId === patient.id ? 'is-selected' : ''}>
          <td><strong>{patient.name}</strong><small>{patient.age} years · {item.list}</small><small>{patient.id}</small></td>
          <td><strong>{item.procedure}</strong><small>{item.consultant}</small><small>{item.anaesthetist}</small></td>
          <td><span>Booked arrival {clockLabel(item.scheduledArrival)}</span><small>Actual arrival {clockLabel(item.arrival)}</small><small>Theatre {clockLabel(item.theatre)}</small></td>
          <td><strong>{item.stage}</strong><small>{durationLabel(item.stayMinutes)} {item.departure != null ? 'total stay' : 'elapsed'}</small></td>
          <td>{onReviewPatient && <button type="button" className="secondary-action" onClick={() => onReviewPatient(patient.id)} aria-label={`Review ${patient.name} in ward workspace`}>Review patient</button>}
            <details><summary>Times and outcome for {patient.name}</summary>
              <dl>{[['Planned theatre time', clockLabel(item.plannedTheatre)], ['Theatre location', item.theatreRoom], ['Procedure ended', clockLabel(item.procedureEnd)], ['Operation duration', durationLabel(item.operationMinutes)], ['Recovery arrival', clockLabel(item.recovery)], ['Returned to day unit', clockLabel(item.returnToUnit)], ['Departure', clockLabel(item.departure)], ['Outcome', item.outcome], ['Destination', item.destination]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <p><strong>Recorded interventions</strong></p>{item.interventions.length ? <ul>{item.interventions.map((value) => <li key={value}>{value}</li>)}</ul> : <p>No post-operative interventions recorded yet.</p>}
              {item.transfer && <p><strong>{item.transfer.status}:</strong> {item.transfer.reason} Destination: {item.transfer.destination}. Receiving service reference: {item.transfer.wardId}.</p>}
            </details>
          </td>
        </tr>; })}</tbody>
      </table>
    </div>
    {!visible.length && <p>No cases match these filters.</p>}
    <details className="service-evidence"><summary>Service evidence and procedure catalogue</summary>
      <p>Published DCU specialty areas: {DCU_SPECIALTIES.join(', ')}. General-surgery examples are also present in the DCU leaflets.</p>
      <p><a href={DCU_SOURCE} target="_blank" rel="noreferrer">Trust service description</a> · <a href={DCU_LEAFLETS} target="_blank" rel="noreferrer">Public procedure leaflets</a> · checked 9 September 2026</p>
      <ul>{DAY_SURGERY_PROCEDURES.map((procedure) => <li key={procedure.id}>{procedure.label} — {procedure.specialty}</li>)}</ul>
      <ul>{DCU_CATALOGUE_REVIEW_NOTES.map((note) => <li key={note}>{note}</li>)}</ul>
    </details>
  </section>;
}
