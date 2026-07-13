// Pure rendering of the two-trust simulation network into flat, exportable tables
// (CSV-shaped). No Node-only imports here, so tests/UI can import it safely.

import { buildTrustNetworkExport, trustNetwork } from './index.js';

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','));
  }
  return lines.join('\n');
}

export const EXPORT_TABLES = [
  {
    name: 'trusts',
    headers: ['id', 'name', 'shortName', 'role', 'wardSource', 'simulationOnly'],
    rows: (model) => model.trusts.map((t) => ({
      id: t.id, name: t.name, shortName: t.shortName, role: t.role, wardSource: t.wardSource, simulationOnly: t.simulationOnly
    }))
  },
  {
    name: 'wards',
    headers: ['id', 'trustId', 'name', 'specialty', 'kind', 'wardGroup', 'simulatedBedCount', 'simulationOnly'],
    rows: (model) => model.wards.map((w) => ({
      id: w.id, trustId: w.trustId, name: w.name, specialty: w.specialty, kind: w.kind,
      wardGroup: w.wardGroup, simulatedBedCount: w.simulatedBedCount, simulationOnly: w.simulationOnly
    }))
  },
  {
    name: 'patients',
    headers: ['id', 'trustId', 'wardId', 'displayLabel', 'pronouns', 'ageBand', 'reviewTheme', 'simulationOnly'],
    rows: (model) => model.patients.map((p) => ({
      id: p.id, trustId: p.trustId, wardId: p.wardId, displayLabel: p.displayLabel,
      pronouns: p.pronouns, ageBand: p.ageBand, reviewTheme: p.reviewTheme, simulationOnly: p.simulationOnly
    }))
  },
  {
    name: 'journeys',
    headers: ['id', 'title', 'outcome', 'trustsInvolved', 'interTrust', 'segmentCount', 'simulationOnly'],
    rows: (model) => model.journeys.map((j) => ({
      id: j.id, title: j.title, outcome: j.outcome, trustsInvolved: j.trustsInvolved.join('|'),
      interTrust: j.interTrust, segmentCount: j.segments.length, simulationOnly: j.simulationOnly
    }))
  },
  {
    name: 'journey_segments',
    headers: ['journeyId', 'order', 'trustId', 'wardId', 'wardName', 'stage', 'handoverNote', 'simulationOnly'],
    rows: (model) => model.journeySegments.map((s) => ({
      journeyId: s.journeyId, order: s.order, trustId: s.trustId, wardId: s.wardId,
      wardName: s.wardName, stage: s.stage, handoverNote: s.handoverNote, simulationOnly: s.simulationOnly
    }))
  }
];

export function renderTrustNetworkArtifacts(exportModel = buildTrustNetworkExport(trustNetwork)) {
  const csv = {};
  for (const table of EXPORT_TABLES) {
    csv[table.name] = toCsv(table.headers, table.rows(exportModel));
  }
  return {
    generatedLabel: exportModel.generatedLabel,
    boundaryNote: exportModel.boundaryNote,
    counts: exportModel.counts,
    integrity: exportModel.integrity,
    csv
  };
}
