export const PROGRESSION_POINTS = Object.freeze({
  observed: 1,
  assisted: 2,
  performed_supervised: 3,
  performed_independent: 4
});

export const NMC_PROFICIENCY_TAGS = Object.freeze([
  { id: 'person-centred-care', label: 'Person-centred care' },
  { id: 'communication', label: 'Communication' },
  { id: 'assessment-and-observation', label: 'Assessment and observation' },
  { id: 'medicines-safety', label: 'Medicines safety' },
  { id: 'escalation-and-collaboration', label: 'Escalation and collaboration' },
  { id: 'documentation-and-recording', label: 'Documentation and recording' }
]);

export function normalisePassportEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry, index) => normalisePassportEntry(entry, index))
    .filter(Boolean);
}

export function normalisePassportEntry(entry = {}, index = 0) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const safeEntry = entry;
  const participationLevel = normaliseParticipationLevel(safeEntry.participationLevel);
  const verifier = normaliseVerifier(safeEntry.verifier);
  const date = normaliseDate(safeEntry.date);
  const nmcProficiencies = normaliseProficiencyTags(safeEntry.nmcProficiencies);
  const points = resolveEntryPoints(safeEntry, participationLevel);
  const verified = safeEntry.verified === true;

  return {
    id: safeText(safeEntry.id, `passport-entry-${index + 1}`),
    studentId: safeText(safeEntry.studentId, 'unknown-student'),
    placementId: safeText(safeEntry.placementId, 'unknown-placement'),
    placementLabel: safeText(safeEntry.placementLabel, safeText(safeEntry.placementId, 'Placement')),
    placementWard: safeText(safeEntry.placementWard, ''),
    placementTrust: safeText(safeEntry.placementTrust, ''),
    procedure: safeText(safeEntry.procedure, 'Unlabelled procedure'),
    participationLevel,
    date,
    verifier,
    verified,
    points,
    nmcProficiencies,
    order: Number.isFinite(Number(safeEntry.order)) ? Number(safeEntry.order) : index
  };
}

export function totalPassportPoints(entries = []) {
  return normalisePassportEntries(entries).reduce((total, entry) => total + (entry.verified ? entry.points : 0), 0);
}

export function countVerifiedEntries(entries = []) {
  return normalisePassportEntries(entries).filter((entry) => entry.verified).length;
}

export function buildPlacementGroups(entries = []) {
  const grouped = new Map();

  for (const entry of normalisePassportEntries(entries)) {
    const key = entry.placementId;
    const current = grouped.get(key) ?? {
      placementId: key,
      placementLabel: entry.placementLabel,
      placementWard: entry.placementWard,
      placementTrust: entry.placementTrust,
      entries: [],
      firstSeenIndex: entry.order
    };

    current.entries.push(entry);
    current.placementLabel = current.placementLabel || entry.placementLabel;
    current.placementWard = current.placementWard || entry.placementWard;
    current.placementTrust = current.placementTrust || entry.placementTrust;
    current.firstSeenIndex = Math.min(current.firstSeenIndex, entry.order);
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .sort((left, right) => left.firstSeenIndex - right.firstSeenIndex || left.placementLabel.localeCompare(right.placementLabel))
    .map((group) => {
      const sortedEntries = [...group.entries].sort(comparePassportEntries);
      const verifiedEntries = sortedEntries.filter((entry) => entry.verified);
      const procedures = uniqueStrings(verifiedEntries.map((entry) => entry.procedure));
      const latestDate = sortedEntries.reduce((latest, entry) => {
        const score = dateScore(entry.date);
        return score > dateScore(latest) ? entry.date : latest;
      }, '');

      return {
        placementId: group.placementId,
        placementLabel: group.placementLabel,
        placementWard: group.placementWard,
        placementTrust: group.placementTrust,
        entries: sortedEntries,
        totalEntryCount: sortedEntries.length,
        verifiedEntryCount: verifiedEntries.length,
        verifiedPoints: verifiedEntries.reduce((total, entry) => total + entry.points, 0),
        procedureCount: procedures.length,
        procedures,
        latestDate
      };
    });
}

export function buildNmcCoverageSummary(entries = []) {
  const verifiedEntries = normalisePassportEntries(entries).filter((entry) => entry.verified);
  const tagRows = NMC_PROFICIENCY_TAGS.map((tag) => {
    const verifiedEntryCount = verifiedEntries.filter((entry) => entry.nmcProficiencies.includes(tag.id)).length;

    return {
      ...tag,
      verifiedEntryCount,
      covered: verifiedEntryCount > 0
    };
  });

  const achievedTags = tagRows.filter((tag) => tag.covered).map((tag) => tag.id);
  const coveredCount = achievedTags.length;
  const totalCount = tagRows.length;

  return {
    tagRows,
    achievedTags,
    coveredCount,
    totalCount,
    totalTags: totalCount,
    coveragePercent: totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100)
  };
}

export function buildProactivityScore(entries = []) {
  const verifiedEntries = normalisePassportEntries(entries).filter((entry) => entry.verified);
  const breadthCount = uniqueStrings(verifiedEntries.map((entry) => entry.procedure)).length;
  const verifiedEntryCount = verifiedEntries.length;
  const selfInitiatedCount = verifiedEntries.filter((entry) =>
    entry.participationLevel === 'performed-independent' || entry.verifier.role === 'student'
  ).length;
  const breadthScore = Math.min(breadthCount * 12, 40);
  const verifiedScore = Math.min(verifiedEntryCount * 8, 36);
  const selfInitiatedScore = Math.min(selfInitiatedCount * 12, 24);
  const score = clamp(
    breadthScore + verifiedScore + selfInitiatedScore,
    0,
    100
  );

  return {
    score,
    band: score >= 75 ? 'strong' : score >= 45 ? 'steady' : 'building',
    breadthCount,
    verifiedEntryCount,
    selfInitiatedCount,
    componentScores: {
      breadthScore,
      verifiedScore,
      selfInitiatedScore
    }
  };
}

export function buildCompetencyPassportSummary(entries = []) {
  const safeEntries = normalisePassportEntries(entries);
  const placementGroups = buildPlacementGroups(safeEntries);
  const nmcCoverage = buildNmcCoverageSummary(safeEntries);
  const proactivity = buildProactivityScore(safeEntries);

  return {
    totalPoints: totalPassportPoints(safeEntries),
    verifiedEntryCount: countVerifiedEntries(safeEntries),
    placementCount: placementGroups.length,
    procedureCount: uniqueStrings(safeEntries.filter((entry) => entry.verified).map((entry) => entry.procedure)).length,
    placementGroups,
    nmcCoverage,
    proactivity
  };
}

function resolveEntryPoints(entry, participationLevel) {
  const explicitPoints = Number(entry.points);
  if (Number.isFinite(explicitPoints) && explicitPoints >= 0) {
    return explicitPoints;
  }

  return PROGRESSION_POINTS[participationLevel] ?? 0;
}

function normaliseParticipationLevel(value) {
  const text = safeText(value, 'observed')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (text in PROGRESSION_POINTS) {
    return text;
  }

  return 'observed';
}

function normaliseVerifier(verifier = {}) {
  if (!verifier || typeof verifier !== 'object' || Array.isArray(verifier)) {
    return { name: 'Unverified reviewer', role: 'nurse' };
  }

  return {
    name: safeText(verifier.name, 'Unverified reviewer'),
    role: normaliseVerifierRole(verifier.role)
  };
}

function normaliseVerifierRole(value) {
  const text = safeText(value, 'nurse').toLowerCase();
  const allowed = ['student', 'hca', 'nurse', 'supervisor', 'doctor'];
  return allowed.includes(text) ? text : text;
}

function normaliseProficiencyTags(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const knownIds = new Set(NMC_PROFICIENCY_TAGS.map((tag) => tag.id));
  return uniqueStrings(values.map(normaliseTagId)).filter((tag) => knownIds.has(tag));
}

function normaliseTagId(value) {
  return safeText(value, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function comparePassportEntries(left, right) {
  const leftDate = dateScore(left.date);
  const rightDate = dateScore(right.date);

  if (leftDate !== rightDate) {
    return rightDate - leftDate;
  }

  const orderDiff = left.order - right.order;
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return left.procedure.localeCompare(right.procedure);
}

function dateScore(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function normaliseDate(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const text = value.trim();
  if (!text) {
    return '';
  }

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : text;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => safeText(value, '')).filter(Boolean))];
}

function safeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const text = value.trim();
  return text || fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
