import { useMemo } from 'react';
import { getDemoScenarioById } from '../data/demoScenarios.js';

function wardLabel(name) {
  return String(name ?? 'Ward').replace(/\s+(Ward|Unit|Team)(?:\s+Alpha)?$/i, '').trim() || 'Ward';
}

function wardId(name) {
  return wardLabel(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getWardContextOptions(options = []) {
  const groups = new Map();
  options.forEach((option) => {
    const scenario = getDemoScenarioById(option.id);
    const name = scenario?.currentWardName ?? option.label;
    const id = wardId(name);
    if (!groups.has(id)) {
      groups.set(id, { id, label: wardLabel(name), scenarioIds: [] });
    }
    groups.get(id).scenarioIds.push(option.id);
  });
  return [...groups.values()];
}

export function WardContextSelector({ options = [], value, onChange = () => {} }) {
  const wards = useMemo(() => getWardContextOptions(options), [options]);
  const selectedWard = wards.find((ward) => ward.scenarioIds.includes(value)) ?? wards[0];

  return (
    <label className="ward-context-selector" htmlFor="ward-context-select">
      <span>Ward</span>
      <select
        aria-describedby="simulation-safety-note"
        id="ward-context-select"
        onChange={(event) => {
          const ward = wards.find((candidate) => candidate.id === event.target.value);
          if (ward?.scenarioIds[0]) onChange(ward.scenarioIds[0]);
        }}
        value={selectedWard?.id ?? ''}
      >
        {wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.label}</option>)}
      </select>
    </label>
  );
}
