/** Identity stays together; the accessible action name is a board contract. */
export function WardBoardPatientCell({ patient, selected = false, onSelectPatient }) {
  return (
    <td className="sf-ward-patient-cell">
      <button
        aria-label={`Open ${patient.name} (${patient.id})`}
        aria-current={selected ? 'true' : undefined}
        className="sf-ward-patient-cell__button"
        onClick={() => onSelectPatient(patient.id)}
        type="button"
      >
        <span className="sf-numeric">{patient.id || 'Not recorded'}</span>
        <span className="sf-ward-patient-cell__name">{patient.name || 'Not recorded'}</span>
      </button>
    </td>
  );
}
