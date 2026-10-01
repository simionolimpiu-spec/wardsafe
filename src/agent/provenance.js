import { frozenCopy, isIsoTimestamp, isNonEmptyString } from './domainValues.js';

export class ProvenanceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProvenanceError';
  }
}

export function createProvenance({ source, sourceRecordId, observedAt, importedAt, observedAtLabel } = {}) {
  if (!isNonEmptyString(source) || !isNonEmptyString(sourceRecordId)) {
    throw new ProvenanceError('Source and source record id are required.');
  }
  if (!isIsoTimestamp(observedAt) || !isIsoTimestamp(importedAt)) {
    throw new ProvenanceError('Observed and imported timestamps must be valid ISO strings.');
  }
  return frozenCopy({ source, sourceRecordId, observedAt, observedAtLabel, importedAt, simulationOnly: true });
}
