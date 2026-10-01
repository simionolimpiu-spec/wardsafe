export function createAuditEvent({ label, actor = 'Leanne Mitchell', detail }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    actor,
    label,
    detail
  };
}

export function initialAuditEvents(patient) {
  const responseHistory = Array.isArray(patient?.responseHistory)
    ? patient.responseHistory
    : [];

  return responseHistory.map((item, index) => ({
    id: `${patient.id}-${index}`,
    time: item.slice(0, 5),
    actor: patient.responsibleNurse,
    label: item.slice(6),
    detail: 'Imported from fictional scenario timeline.'
  }));
}
