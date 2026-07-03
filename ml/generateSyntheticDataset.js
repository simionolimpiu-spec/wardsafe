import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MODEL_VERSION = 'simulation-risk-ml-v0-2-sim';
export const FEATURE_SET_VERSION = 'signal-features-ml-v0-2-sim';
export const FEATURE_ORDER = [
  'news2Normalized',
  'potassiumFallingFlag',
  'documentationQualityNorm',
  'handoverCompleteNorm',
  'openTaskLoadNorm',
  'escalationStateNorm',
  'dischargeBlockerNorm',
  'news2TrendDeltaNorm',
  'safetyFlagLevelNorm',
  'simulationFlagCountNorm',
  'heuristicCueCountNorm',
  'blockerCueCountNorm',
  'documentationCuePresentFlag',
  'handoverCuePresentFlag',
  'escalationCuePresentFlag',
  'dischargeCuePresentFlag',
  'deterioratingObsCuePresentFlag'
];

export const SYNTHETIC_DATASET_PATH = new URL('./data/syntheticTrainingData.json', import.meta.url);

const DEFAULT_SEED = 20260703;
const DEFAULT_DATASET_SIZE = 1500;
const DEFAULT_TRAIN_RATIO = 0.8;
const DATASET_GENERATED_AT = '2026-07-03T00:00:00.000Z';

const LABEL_WEIGHTS = {
  news2Normalized: 2.05,
  potassiumFallingFlag: 1.25,
  documentationQualityNorm: -1.55,
  handoverCompleteNorm: -1.2,
  openTaskLoadNorm: 1.15,
  escalationStateNorm: 1.4,
  dischargeBlockerNorm: 1.5,
  news2TrendDeltaNorm: 1.2,
  safetyFlagLevelNorm: 0.95,
  simulationFlagCountNorm: 0.85,
  heuristicCueCountNorm: 1,
  blockerCueCountNorm: 1.1,
  documentationCuePresentFlag: 0.7,
  handoverCuePresentFlag: 0.55,
  escalationCuePresentFlag: 0.85,
  dischargeCuePresentFlag: 0.8,
  deterioratingObsCuePresentFlag: 0.9
};

const LABEL_INTERCEPT = -1.65;
const LABEL_NOISE_RANGE = 0.42;
const LABEL_THRESHOLD = 0.18;

export function generateSyntheticDataset({
  seed = DEFAULT_SEED,
  datasetSize = DEFAULT_DATASET_SIZE,
  trainRatio = DEFAULT_TRAIN_RATIO
} = {}) {
  const rng = createSeededRandom(seed);
  const rows = [];

  for (let index = 0; index < datasetSize; index += 1) {
    const features = buildFeatureVector(rng);
    const labelRecord = buildLabelRecord(features, rng);

    rows.push({
      rowId: `synthetic-row-${String(index + 1).padStart(4, '0')}`,
      split: index < Math.floor(datasetSize * trainRatio) ? 'train' : 'test',
      features,
      proceduralLinearScore: roundTo(labelRecord.linearScore, 4),
      proceduralProbability: roundTo(labelRecord.probability, 4),
      label: labelRecord.label
    });
  }

  const splitIndex = Math.floor(rows.length * trainRatio);
  const trainRows = rows.slice(0, splitIndex);
  const testRows = rows.slice(splitIndex);

  return {
    generatedAt: DATASET_GENERATED_AT,
    seed,
    datasetSize: rows.length,
    trainSize: trainRows.length,
    testSize: testRows.length,
    modelVersion: MODEL_VERSION,
    featureSetVersion: FEATURE_SET_VERSION,
    featureOrder: [...FEATURE_ORDER],
    featureDefinitions: {
      news2Normalized: 'Synthetic NEWS2 intensity scaled from 0 to 1.',
      potassiumFallingFlag: 'Synthetic binary flag for a falling potassium trend.',
      documentationQualityNorm: 'Synthetic documentation quality score scaled from 0 to 1.',
      handoverCompleteNorm: 'Synthetic handover completeness score scaled from 0 to 1.',
      openTaskLoadNorm: 'Synthetic open task load score scaled from 0 to 1.',
      escalationStateNorm: 'Synthetic escalation state score scaled from 0 to 1.',
      dischargeBlockerNorm: 'Synthetic discharge blocker score scaled from 0 to 1.',
      news2TrendDeltaNorm: 'Synthetic positive NEWS2 movement between fictional observation snapshots, scaled from 0 to 1.',
      safetyFlagLevelNorm: 'Synthetic unresolved safety-flag intensity scaled from 0 to 1.',
      simulationFlagCountNorm: 'Synthetic count of visible simulation flags scaled from 0 to 1.',
      heuristicCueCountNorm: 'Synthetic count of heuristic review cues scaled from 0 to 1.',
      blockerCueCountNorm: 'Synthetic count of blocker-severity cues scaled from 0 to 1.',
      documentationCuePresentFlag: 'Synthetic binary flag for a documentation gap cue.',
      handoverCuePresentFlag: 'Synthetic binary flag for a handover completeness cue.',
      escalationCuePresentFlag: 'Synthetic binary flag for an escalation readiness cue.',
      dischargeCuePresentFlag: 'Synthetic binary flag for a discharge-readiness blocker cue.',
      deterioratingObsCuePresentFlag: 'Synthetic binary flag for a deteriorating observations cue.'
    },
    labelDefinition: {
      description: 'Illustrative deterioration-review flag generated from a fixed weighted sum of synthetic features plus noise, then thresholded.',
      formula: `linear = ${formatWeightedFormula(LABEL_WEIGHTS, LABEL_INTERCEPT)} + noise; label = linear >= ${LABEL_THRESHOLD} ? 1 : 0`,
      threshold: LABEL_THRESHOLD,
      noiseRange: LABEL_NOISE_RANGE,
      note: 'The generated label is fabricated for simulation only and does not represent clinical truth.'
    },
    splitDefinition: {
      trainRatio,
      trainRows: trainRows.length,
      testRows: testRows.length
    },
    trainRows,
    testRows
  };
}

export async function writeSyntheticDataset(options = {}) {
  const dataset = generateSyntheticDataset(options);
  await mkdir(new URL('./data/', import.meta.url), { recursive: true });
  await writeFile(SYNTHETIC_DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  return dataset;
}

export async function readSyntheticDataset() {
  const raw = await readFile(SYNTHETIC_DATASET_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function ensureSyntheticDataset(options = {}) {
  try {
    return await readSyntheticDataset();
  } catch {
    return writeSyntheticDataset(options);
  }
}

export function createSeededRandom(seed) {
  let state = seed >>> 0;

  return function nextRandom() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildFeatureVector(rng) {
  const documentationQualityNorm = clamp01(0.35 + 0.65 * (1 - Math.pow(rng(), 1.7)));
  const handoverCompleteNorm = clamp01(0.3 + 0.7 * (1 - Math.pow(rng(), 1.45)));
  const news2Normalized = clamp01(Math.pow(rng(), 1.15));
  const news2TrendDeltaNorm = clamp01(
    (rng() < clamp01(0.12 + (0.55 * news2Normalized) + (0.16 * (1 - documentationQualityNorm))))
      ? (0.08 + (0.55 * news2Normalized * rng()) + (0.22 * rng()))
      : (0.05 * rng())
  );
  const openTaskLoadNorm = clamp01(
    0.15 +
    (0.5 * (1 - handoverCompleteNorm)) +
    (0.2 * (1 - documentationQualityNorm)) +
    (0.15 * rng())
  );
  const escalationStateNorm = clamp01(
    (0.45 * news2Normalized) +
    (0.25 * openTaskLoadNorm) +
    (0.2 * (1 - documentationQualityNorm)) +
    (0.1 * rng())
  );
  const dischargeBlockerNorm = clamp01(
    (0.4 * (1 - handoverCompleteNorm)) +
    (0.3 * openTaskLoadNorm) +
    (0.2 * (1 - documentationQualityNorm)) +
    (0.1 * rng())
  );
  const potassiumFallingFlag = rng() < clamp01(
    0.08 +
    (0.46 * news2Normalized) +
    (0.22 * openTaskLoadNorm) +
    (0.12 * (1 - documentationQualityNorm))
  ) ? 1 : 0;
  const documentationCuePresentFlag = binaryFeature(
    rng,
    0.1 + (0.72 * (1 - documentationQualityNorm)) + (0.14 * potassiumFallingFlag)
  );
  const handoverCuePresentFlag = binaryFeature(
    rng,
    0.1 + (0.62 * (1 - handoverCompleteNorm)) + (0.22 * openTaskLoadNorm)
  );
  const deterioratingObsCuePresentFlag = binaryFeature(
    rng,
    0.08 + (0.48 * news2Normalized) + (0.5 * news2TrendDeltaNorm)
  );
  const escalationCuePresentFlag = binaryFeature(
    rng,
    0.08 + (0.58 * escalationStateNorm) + (0.18 * deterioratingObsCuePresentFlag)
  );
  const dischargeCuePresentFlag = binaryFeature(
    rng,
    0.08 + (0.68 * dischargeBlockerNorm) + (0.18 * handoverCuePresentFlag)
  );
  const multipleGapCueFlag = documentationCuePresentFlag + handoverCuePresentFlag + escalationCuePresentFlag + dischargeCuePresentFlag >= 3 ? 1 : 0;
  const safetyFlagLevelNorm = clamp01(
    potassiumFallingFlag
      ? (0.48 + (0.32 * rng()) + (0.2 * news2Normalized))
      : (0.14 * documentationCuePresentFlag) + (0.18 * deterioratingObsCuePresentFlag) + (0.12 * rng())
  );
  const simulationFlagCountNorm = clamp01((
    potassiumFallingFlag +
    documentationCuePresentFlag +
    handoverCuePresentFlag +
    escalationCuePresentFlag +
    dischargeCuePresentFlag +
    deterioratingObsCuePresentFlag
  ) / 6);
  const heuristicCueCountNorm = clamp01((
    documentationCuePresentFlag +
    handoverCuePresentFlag +
    escalationCuePresentFlag +
    dischargeCuePresentFlag +
    multipleGapCueFlag
  ) / 5);
  const blockerCueCountNorm = clamp01((
    escalationCuePresentFlag +
    dischargeCuePresentFlag +
    deterioratingObsCuePresentFlag +
    multipleGapCueFlag
  ) / 5);

  return {
    news2Normalized: roundTo(news2Normalized, 4),
    potassiumFallingFlag,
    documentationQualityNorm: roundTo(documentationQualityNorm, 4),
    handoverCompleteNorm: roundTo(handoverCompleteNorm, 4),
    openTaskLoadNorm: roundTo(openTaskLoadNorm, 4),
    escalationStateNorm: roundTo(escalationStateNorm, 4),
    dischargeBlockerNorm: roundTo(dischargeBlockerNorm, 4),
    news2TrendDeltaNorm: roundTo(news2TrendDeltaNorm, 4),
    safetyFlagLevelNorm: roundTo(safetyFlagLevelNorm, 4),
    simulationFlagCountNorm: roundTo(simulationFlagCountNorm, 4),
    heuristicCueCountNorm: roundTo(heuristicCueCountNorm, 4),
    blockerCueCountNorm: roundTo(blockerCueCountNorm, 4),
    documentationCuePresentFlag,
    handoverCuePresentFlag,
    escalationCuePresentFlag,
    dischargeCuePresentFlag,
    deterioratingObsCuePresentFlag
  };
}

function buildLabelRecord(features, rng) {
  // Fabricated label rule: a weighted sum of the synthetic features, plus a small
  // deterministic noise term, is thresholded to create a binary "review flag".
  const linearScore = FEATURE_ORDER.reduce(
    (total, featureName) => total + (LABEL_WEIGHTS[featureName] * Number(features[featureName] ?? 0)),
    LABEL_INTERCEPT
  ) + uniformNoise(rng, LABEL_NOISE_RANGE);
  const probability = sigmoid(linearScore);
  const label = linearScore >= LABEL_THRESHOLD ? 1 : 0;

  return {
    linearScore,
    probability,
    label
  };
}

function uniformNoise(rng, range) {
  return (rng() * 2 - 1) * range;
}

function binaryFeature(rng, probability) {
  return rng() < clamp01(probability) ? 1 : 0;
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function roundTo(value, digits = 4) {
  return Number(Number(value).toFixed(digits));
}

function formatWeightedFormula(weights, intercept) {
  const terms = FEATURE_ORDER.map((featureName) => {
    const weight = weights[featureName];
    const sign = weight >= 0 ? '+' : '-';
    return `${sign} ${Math.abs(weight)}*${featureName}`;
  });

  const head = `${intercept}`;
  return [head, ...terms].join(' ');
}

async function main() {
  const dataset = await writeSyntheticDataset();
  console.log(
    `Wrote synthetic dataset with ${dataset.datasetSize} rows to ${fileURLToPath(SYNTHETIC_DATASET_PATH)}`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
