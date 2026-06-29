export function createSimulationCsv(rows) {
  return rows
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function buildWardReportRows(patients) {
  return [
    ['Patient ID', 'Name', 'NEWS2', 'Risk', 'Nurse', 'Escalation', 'Handover', 'Discharge'],
    ...patients.map((patient) => [
      patient.id,
      patient.name,
      patient.news2,
      patient.risk,
      patient.responsibleNurse,
      patient.escalation,
      `${patient.handoverComplete}%`,
      patient.dischargeReady ? 'Ready' : 'Needs review'
    ])
  ];
}

export function downloadSimulationCsv(filename, rows) {
  const csv = createSimulationCsv(rows);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
