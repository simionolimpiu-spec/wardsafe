import { evidenceNeedsReview, NETWORK_PATHWAYS } from '../../data/clinical/serviceDefinitions.js';

const labels = { assignment: 'Specialty assignment', capacity: 'Capacity', sameDayOnly: 'Same-day only',
  serviceType: 'Workflow', careLevels: 'Adult care levels supported in the demo', careLevelShare: 'Fictional patient mix by level',
  stayDays: 'Stay range (days)', occupancyPercent: 'Occupancy range (%)', attendances: 'Session attendance range', staffNurses: 'Illustrative staff nurse range' };
function valueLabel(value) {
  if (value == null || (Array.isArray(value) && !value.length)) return 'Not modelled / not confirmed';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([level, share]) => `Level ${level}: ${Math.round(share * 100)}%`).join(', ') || 'Not modelled';
  return String(value);
}
function EvidenceItem({ label, evidence }) {
  return <li><strong>{label}</strong>: {['conflicting', 'source-pending'].includes(evidence.status) ? 'Value withheld pending source review' : valueLabel(evidence.value)}
    {' — '}{evidence.status.replaceAll('-', ' ')}{evidenceNeedsReview(evidence) ? '; human review required' : ''}.
    {evidence.note && <p>{evidence.note}</p>}
    {evidence.source && <a href={evidence.source} target="_blank" rel="noreferrer">Source for {label.toLowerCase()}</a>}
    {evidence.checkedOn && <span> · Checked {evidence.checkedOn}</span>}
  </li>;
}
export function ServiceEvidence({ profile }) {
  if (!profile?.fieldEvidence) return null;
  return <details className="service-evidence"><summary>Service evidence and simulation assumptions</summary>
    <p>Each source supports only the field shown. Fictional workload and patient records are not measured hospital activity. Human review required.</p>
    <ul>{Object.entries(profile.fieldEvidence).map(([field, evidence]) => <EvidenceItem key={field} label={labels[field] ?? field} evidence={evidence} />)}</ul>
  </details>;
}
export function HospitalCapabilities({ hospital }) {
  const routes = NETWORK_PATHWAYS.filter((route) => route.from === hospital.id);
  if (!hospital.capabilities) return null;
  return <details className="service-evidence"><summary>Modelled services and network pathways</summary>
    <p>{hospital.capabilities.label}. Simulation examples only; no automatic referral selection or live availability. Clinical judgement remains central.</p>
    <ul>{Object.entries(hospital.capabilities.services).map(([id, service]) => <EvidenceItem key={id}
      label={service.wardIds.map((wardId) => hospital.wards.find((ward) => ward.id === wardId)?.name ?? wardId).join(', ')} evidence={service.evidence} />)}
      {routes.map((route) => <EvidenceItem key={`${route.to}:${route.direction}`} label={route.purpose} evidence={route.evidence} />)}</ul>
  </details>;
}
