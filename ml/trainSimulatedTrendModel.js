import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  FEATURE_ORDER,
  FEATURE_SET_VERSION,
  MODEL_VERSION,
  ensureSyntheticDataset,
  writeSyntheticDataset
} from './generateSyntheticDataset.js';

const MODEL_OUTPUT_PATH = new URL('../src/data/patientJourneyTrendModel.json', import.meta.url);
const RISK_TIER_THRESHOLDS = {
  watchUpper: 0.4,
  reviewUpper: 0.7
};

export async function trainSimulatedTrendModel({
  learningRate = 0.75,
  epochs = 1600,
  seed = 20260703
} = {}) {
  const dataset = await ensureSyntheticDataset({ seed });
  const trainRows = Array.isArray(dataset.trainRows) ? dataset.trainRows : [];
  const testRows = Array.isArray(dataset.testRows) ? dataset.testRows : [];

  if (trainRows.length === 0 || testRows.length === 0) {
    const regenerated = await writeSyntheticDataset({ seed });
    return trainSimulatedTrendModel({
      learningRate,
      epochs,
      seed: regenerated.seed
    });
  }

  const model = fitLogisticRegression(trainRows, FEATURE_ORDER, {
    learningRate,
    epochs
  });
  const metrics = evaluateModel(testRows, model, FEATURE_ORDER);
  const artifact = {
    modelVersion: MODEL_VERSION,
    featureSetVersion: FEATURE_SET_VERSION,
    trainingDate: typeof dataset.generatedAt === 'string' ? dataset.generatedAt : '2026-07-03T00:00:00.000Z',
    datasetSize: dataset.datasetSize ?? (trainRows.length + testRows.length),
    trainSize: trainRows.length,
    testSize: testRows.length,
    featureOrder: [...FEATURE_ORDER],
    weights: model.weights.map((weight) => roundTo(weight, 6)),
    intercept: roundTo(model.intercept, 6),
    riskTierThresholds: { ...RISK_TIER_THRESHOLDS },
    testMetrics: {
      accuracy: roundTo(metrics.accuracy, 3),
      precision: roundTo(metrics.precision, 3),
      recall: roundTo(metrics.recall, 3),
      note: 'performance on synthetic holdout data, not clinical validation'
    },
    trainingSummary: {
      algorithm: 'batch gradient descent logistic regression in plain JavaScript',
      learningRate,
      epochs,
      seed,
      generatedFrom: 'ml/data/syntheticTrainingData.json',
      labelDefinition: dataset.labelDefinition ?? null
    }
  };

  await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
  await writeFile(MODEL_OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  return artifact;
}

export function fitLogisticRegression(rows, featureOrder, { learningRate, epochs }) {
  const weights = Array(featureOrder.length).fill(0);
  let intercept = 0;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const weightGradients = Array(featureOrder.length).fill(0);
    let interceptGradient = 0;
    let loss = 0;

    for (const row of rows) {
      const features = extractFeatureVector(row, featureOrder);
      const score = intercept + dotProduct(weights, features);
      const probability = sigmoid(score);
      const label = Number(row.label ?? 0);
      const error = probability - label;

      interceptGradient += error;
      for (let index = 0; index < weights.length; index += 1) {
        weightGradients[index] += error * features[index];
      }

      loss += crossEntropyLoss(label, probability);
    }

    const normaliser = rows.length || 1;
    intercept -= learningRate * (interceptGradient / normaliser);
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= learningRate * (weightGradients[index] / normaliser);
    }

    if (!Number.isFinite(loss)) {
      throw new Error('Training loss became non-finite.');
    }
  }

  return { weights, intercept };
}

export function evaluateModel(rows, model, featureOrder) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let correct = 0;

  for (const row of rows) {
    const features = extractFeatureVector(row, featureOrder);
    const probability = sigmoid(model.intercept + dotProduct(model.weights, features));
    const predicted = probability >= 0.5 ? 1 : 0;
    const actual = Number(row.label ?? 0);

    if (predicted === actual) {
      correct += 1;
    }
    if (predicted === 1 && actual === 1) {
      truePositive += 1;
    } else if (predicted === 1 && actual === 0) {
      falsePositive += 1;
    } else if (predicted === 0 && actual === 1) {
      falseNegative += 1;
    }
  }

  const accuracy = rows.length > 0 ? correct / rows.length : 0;
  const precision = truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : 0;
  const recall = truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : 0;

  return {
    accuracy,
    precision,
    recall
  };
}

export function extractFeatureVector(row, featureOrder) {
  const source = row?.features ?? {};
  return featureOrder.map((featureName) => Number.isFinite(Number(source[featureName])) ? Number(source[featureName]) : 0);
}

export function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

export function dotProduct(left, right) {
  return left.reduce((total, value, index) => total + (value * (right[index] ?? 0)), 0);
}

export function crossEntropyLoss(label, probability) {
  const safeProbability = Math.min(Math.max(probability, 1e-9), 1 - 1e-9);
  return -(
    (label * Math.log(safeProbability)) +
    ((1 - label) * Math.log(1 - safeProbability))
  );
}

function roundTo(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

async function main() {
  await writeSyntheticDataset({ seed: 20260703 });
  const artifact = await trainSimulatedTrendModel({ seed: 20260703 });
  console.log(
    `Wrote model artifact to ${fileURLToPath(MODEL_OUTPUT_PATH)} with holdout accuracy ${artifact.testMetrics.accuracy}`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
