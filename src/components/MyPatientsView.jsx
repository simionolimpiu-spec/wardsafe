export function MyPatientsView({ patients, simulationUser, onSelectPatient }) {
  const assignedPatients = patients.filter(
    (patient) => patient.responsibleNurse === simulationUser
  );

  return (
    <section className="operational-view" aria-labelledby="my-patients-title">
      <header className="view-heading">
        <div>
          <p className="eyebrow">Assigned workload</p>
          <h2 id="my-patients-title">My Patients</h2>
        </div>
        <strong>{assignedPatients.length} assigned</strong>
      </header>
      <p>Fictional patients assigned to {simulationUser}.</p>
      <div className="record-list">
        {assignedPatients.map((patient) => (
          <article key={patient.id}>
            <button
              className="link-button"
              onClick={() => onSelectPatient(patient.id)}
              type="button"
            >
              {patient.id}
            </button>
            <strong>{patient.name}</strong>
            <span>NEWS2 {patient.news2}</span>
            <span>{patient.nextAction}</span>
          </article>
        ))}
      </div>
      {assignedPatients.length === 0 && (
        <p className="empty-state">No fictional patients match this simulation identity.</p>
      )}
    </section>
  );
}
