// RAG (red / amber / green) helpers for the patient donut chart.
// NHS colour palette. Traffic-light system. Simulation-only.

import { CARE_DOMAINS } from '../data/clinical/clinicalPools.js';

// NHS identity + accessible traffic-light colours.
export const NHS = Object.freeze({
  blue: '#005EB8',
  darkBlue: '#003087',
  brightBlue: '#0072CE',
  green: '#007F3B',
  warmYellow: '#FFB81C',
  red: '#DA291C',
  paleGrey: '#F0F4F5',
  midGrey: '#4C6272',
  black: '#231F20',
  white: '#FFFFFF'
});

export const RAG_COLOURS = Object.freeze({
  red: NHS.red,
  amber: NHS.warmYellow,
  green: NHS.green,
  unknown: NHS.midGrey
});

export const RAG_LABELS = Object.freeze({
  red: 'Red — needs urgent attention',
  amber: 'Amber — review needed',
  green: 'Green — on track',
  unknown: 'Unknown — not assessed'
});

export function ragWord(rag) {
  return ['red', 'amber', 'green'].includes(rag) ? rag.charAt(0).toUpperCase() + rag.slice(1) : 'Not assessed';
}

// Build weighted donut segments for one patient. Slices are unequal (clinical
// weight) so the donut reads like a real infographic, coloured by RAG status.
export function computeDonutSegments(patient) {
  if (!patient) return [];
  const total = CARE_DOMAINS.reduce((sum, domain) => sum + domain.weight, 0);
  return CARE_DOMAINS.map((domain) => {
    const value = patient.careDomains?.[domain.key];
    const rag = ['red', 'amber', 'green'].includes(value) ? value : 'unknown';
    return {
      key: domain.key,
      label: patient.observationScale && patient.observationScale !== 'NEWS2' && domain.key === 'observations' ? patient.observationScale : domain.label,
      note: patient.observationScale && patient.observationScale !== 'NEWS2' ? 'Specialty-specific documentation review; adult scoring is not applied.' : domain.note,
      weight: domain.weight,
      pct: (domain.weight / total) * 100,
      rag,
      colour: RAG_COLOURS[rag]
    };
  });
}
