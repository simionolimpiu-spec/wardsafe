import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { simulationRiskSupportContractExample } from '../data/simulationRiskSupportContractExample.js';
import { simulationScenarioCoverageExample } from '../data/simulationScenarioCoverageExample.js';
import { simulationRiskSupportEvaluationExample } from '../data/simulationRiskSupportEvaluationExample.js';
import { createApiHandler } from '../../server/api.js';
import { createSimulationRiskSupportReadOnlyReport } from '../../server/simulationRiskSupportReport.js';
import { createSimulationWorkspaceSnapshot } from '../../server/simulationWorkspaceSnapshot.js';
import {
  SAFETY_BOUNDARY_REQUIRED_CONCEPTS,
  scanBoundaryAwareSafetyLanguage,
  scanStrictSafetyLanguage
} from './safetyLanguage.js';

const DOCUMENTATION_FILES = [
  'README.md',
  'AGENTS.md',
  'docs/risk-support-technical-explainer.md',
  '.github/pull_request_template.md'
];

function createJsonRequest({ method = 'GET', path }) {
  return {
    method,
    url: path,
    async json() {
      return {};
    }
  };
}

function createJsonResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload = '') {
      this.body = payload;
    }
  };
}

async function requestJson(handler, request) {
  const response = createJsonResponse();

  await handler(createJsonRequest(request), response);

  return {
    statusCode: response.statusCode,
    payload: response.body ? JSON.parse(response.body) : {}
  };
}

describe('safety language regression scan', () => {
  it('fails strict scans for unsafe generated wording', () => {
    const unsafeExamples = [
      ['diagnosis', 'The generated report provides a diagnosis.'],
      ['diagnosis', 'The generated report is a diagnostic system.'],
      ['prescribing', 'The generated report is a prescribing tool.'],
      ['treatment-recommendation', 'The generated report gives a treatment recommendation.'],
      ['ai-decision', 'The generated report is an AI decision.'],
      ['clinical-decision-engine', 'The generated report is a clinical decision engine.'],
      ['autonomous-care', 'The generated report makes an autonomous clinical decision.'],
      ['live-nhs-deployment', 'The generated report supports live NHS deployment.'],
      ['live-clinical-deployment', 'The generated report is ready for live clinical deployment.'],
      ['clinical-validation', 'The generated report is clinically validated.'],
      ['potassium-recommendation', 'The generated report includes a potassium recommendation.'],
      ['patient-needs-potassium', 'The generated report says patient needs potassium.'],
      ['give-potassium', 'The generated report says give potassium.']
    ];

    for (const [ruleId, text] of unsafeExamples) {
      const result = scanStrictSafetyLanguage(text, { checkedLabel: ruleId });

      expect(result.passed).toBe(false);
      expect(result.violations).toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId })
      ]));
      expect(result.checkedTerms).toContain('diagnosis');
      expect(result.checkedTerms).toContain('patient needs potassium');
    }
  });

  it('allows explicit generated-output safety boundary wording', () => {
    const result = scanStrictSafetyLanguage({
      clinicalUse: 'not for live clinical deployment',
      note: 'not clinically validated'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('passes strict scans for current generated examples and reports', () => {
    const generatedOutputs = [
      ['simulation risk-support contract example', simulationRiskSupportContractExample],
      ['simulation scenario coverage example', simulationScenarioCoverageExample],
      ['simulation risk-support evaluation example', simulationRiskSupportEvaluationExample],
      ['simulation risk-support read-only report', createSimulationRiskSupportReadOnlyReport()],
      ['simulation workspace snapshot', createSimulationWorkspaceSnapshot()]
    ];

    for (const [checkedLabel, output] of generatedOutputs) {
      const result = scanStrictSafetyLanguage(output, { checkedLabel });

      expect(result).toMatchObject({
        checkedLabel,
        passed: true,
        violations: []
      });
    }
  });

  it('passes strict scans for the read-only risk-support API output', async () => {
    const handler = createApiHandler();
    const { statusCode, payload } = await requestJson(handler, {
      path: '/api/simulation/risk-support-report'
    });
    const result = scanStrictSafetyLanguage(payload, {
      checkedLabel: 'GET /api/simulation/risk-support-report'
    });

    expect(statusCode).toBe(200);
    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('passes boundary-aware scans for public documentation', () => {
    const documents = DOCUMENTATION_FILES.map((path) => {
      const absolutePath = resolve(process.cwd(), path);

      expect(existsSync(absolutePath)).toBe(true);

      return {
        path,
        text: readFileSync(absolutePath, 'utf8')
      };
    });

    for (const document of documents) {
      const result = scanBoundaryAwareSafetyLanguage(document.text, {
        checkedLabel: document.path
      });

      expect(result).toMatchObject({
        checkedLabel: document.path,
        passed: true,
        violations: []
      });
    }

    const combinedDocs = documents.map((document) => document.text).join('\n\n');
    const combinedResult = scanBoundaryAwareSafetyLanguage(combinedDocs, {
      checkedLabel: 'public safety boundary docs',
      requiredConcepts: SAFETY_BOUNDARY_REQUIRED_CONCEPTS
    });

    expect(combinedResult).toMatchObject({
      passed: true,
      violations: [],
      missingBoundaryConcepts: []
    });
  });

  it('allows documentation boundary statements that name prohibited concepts', () => {
    const result = scanBoundaryAwareSafetyLanguage(
      'SafeFlow is not a diagnostic system. Do not use diagnosis wording.',
      { checkedLabel: 'boundary statement' }
    );

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('still fails documentation scans when unsafe terms are used as claims', () => {
    const result = scanBoundaryAwareSafetyLanguage(
      'SafeFlow provides a diagnosis and supports autonomous decision-making.',
      { checkedLabel: 'unsafe docs claim' }
    );

    expect(result.passed).toBe(false);
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'diagnosis' }),
      expect.objectContaining({ ruleId: 'autonomous-care' })
    ]));
  });
});
