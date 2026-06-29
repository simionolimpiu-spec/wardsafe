import { simulationRiskSupportEvaluationScenarios } from './simulationRiskSupportEvaluationScenarios.js';
import { analyzeSimulationScenarioCoverage } from '../domain/simulationScenarioCoverage.js';

export const simulationScenarioCoverageExample = analyzeSimulationScenarioCoverage({
  scenarios: simulationRiskSupportEvaluationScenarios
});
