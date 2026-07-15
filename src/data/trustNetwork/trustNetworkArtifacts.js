// Pure rendering of the England trust network into flat, exportable tables (CSV-shaped).
// No Node-only imports, so tests/UI can import it safely.

import { buildTrustNetworkExport, trustNetwork } from './index.js';

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(','));
  return lines.join('\n');
}

export const EXPORT_TABLES = [
  {
    name: 'trusts',
    headers: ['id', 'name', 'shortName', 'region', 'role', 'wardSource', 'simulationOnly'],
    rows: (m) => m.trusts.map((t) => ({ id: t.id, name: t.name, shortName: t.shortName, region: t.region, role: t.role, wardSource: t.wardSource, simulationOnly: t.simulationOnly }))
  },
  {
    name: 'wards',
    headers: ['id', 'trustId', 'name', 'specialty', 'kind', 'wardGroup', 'simulatedBedCount', 'simulationOnly'],
    rows: (m) => m.wards.map((w) => ({ id: w.id, trustId: w.trustId, name: w.name, specialty: w.specialty, kind: w.kind, wardGroup: w.wardGroup, simulatedBedCount: w.simulatedBedCount, simulationOnly: w.simulationOnly }))
  },
  {
    name: 'patients',
    headers: ['id', 'trustId', 'homeTrustId', 'wardId', 'displayLabel', 'pronouns', 'ageBand', 'reviewTheme', 'simulationOnly'],
    rows: (m) => m.patients.map((p) => ({ id: p.id, trustId: p.trustId, homeTrustId: p.homeTrustId, wardId: p.wardId, displayLabel: p.displayLabel, pronouns: p.pronouns, ageBand: p.ageBand, reviewTheme: p.reviewTheme, simulationOnly: p.simulationOnly }))
  },
  {
    name: 'journeys',
    headers: ['id', 'journeyType', 'homeTrustId', 'title', 'outcome', 'trustsInvolved', 'interTrust', 'segmentCount', 'learningReturnedTo', 'simulationOnly'],
    rows: (m) => m.journeys.map((j) => ({ id: j.id, journeyType: j.journeyType, homeTrustId: j.homeTrustId, title: j.title, outcome: j.outcome, trustsInvolved: j.trustsInvolved.join('|'), interTrust: j.interTrust, segmentCount: j.segments.length, learningReturnedTo: j.learningRecord.returnedToTrustId, simulationOnly: j.simulationOnly }))
  },
  {
    name: 'journey_segments',
    headers: ['journeyId', 'order', 'trustId', 'wardId', 'wardName', 'stage', 'handoverNote', 'simulationOnly'],
    rows: (m) => m.journeySegments.map((s) => ({ journeyId: s.journeyId, order: s.order, trustId: s.trustId, wardId: s.wardId, wardName: s.wardName, stage: s.stage, handoverNote: s.handoverNote, simulationOnly: s.simulationOnly }))
  },
  {
    name: 'learning_records',
    headers: ['journeyId', 'returnedToTrustId', 'purpose', 'summary', 'teachingPoints'],
    rows: (m) => m.learningRecords.map((r) => ({ journeyId: r.journeyId, returnedToTrustId: r.returnedToTrustId, purpose: r.purpose, summary: r.summary, teachingPoints: r.teachingPoints.join('|') }))
  },
  {
    name: 'observations',
    headers: ['patientId', 'trustId', 'wardId', 'order', 'offsetHours', 'respRate', 'spo2', 'heartRate', 'systolicBp', 'tempC', 'consciousness', 'trend', 'simulationOnly'],
    rows: (m) => m.observations.map((o) => ({ patientId: o.patientId, trustId: o.trustId, wardId: o.wardId, order: o.order, offsetHours: o.offsetHours, respRate: o.respRate, spo2: o.spo2, heartRate: o.heartRate, systolicBp: o.systolicBp, tempC: o.tempC, consciousness: o.consciousness, trend: o.trend, simulationOnly: o.simulationOnly }))
  }
];

export function renderTrustNetworkArtifacts(exportModel = buildTrustNetworkExport(trustNetwork)) {
  const csv = {};
  for (const table of EXPORT_TABLES) csv[table.name] = toCsv(table.headers, table.rows(exportModel));
  return {
    generatedLabel: exportModel.generatedLabel,
    boundaryNote: exportModel.boundaryNote,
    counts: exportModel.counts,
    integrity: exportModel.integrity,
    csv
  };
}
