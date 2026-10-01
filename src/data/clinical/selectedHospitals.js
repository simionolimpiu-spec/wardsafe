// The three hospitals featured in the Hospitals & Wards surface.
// Real NHS trust and ward structures (public directories) used to keep the
// simulation realistic. All patients and staff are fictional. Human review required.

import { TRUSTS, WARDS_BY_TRUST } from '../trustNetwork/trusts.js';

// Three distinct hospital types: district general, tertiary teaching, major-trauma tertiary.
export const FEATURED_HOSPITAL_IDS = Object.freeze(['jpuh', 'nnuh', 'cuh']);

export const FEATURED_HOSPITALS = Object.freeze(
  FEATURED_HOSPITAL_IDS.map((id) => {
    const trust = TRUSTS.find((entry) => entry.id === id);
    const wards = WARDS_BY_TRUST[id] ?? [];
    return Object.freeze({ ...trust, wards });
  })
);

export function getFeaturedHospital(id) {
  return FEATURED_HOSPITALS.find((hospital) => hospital.id === id) ?? null;
}
