import { useEffect, useMemo, useState } from 'react';
import { getDemoScenarioSelectionOptions } from '../data/demoScenarios.js';
import { resolveScenarioId } from '../data/wardLibrary/index.js';

const DEFAULT_OPTIONS = getDemoScenarioSelectionOptions();

export function DemoScenarioSelector({
  description = '',
  id = 'demo-scenario-select',
  onChange = () => {},
  options = DEFAULT_OPTIONS,
  value = ''
}) {
  const selection = useMemo(() => buildSelection(options), [options]);
  const selectedOption = selection.byScenarioId.get(value) ?? selection.options[0] ?? null;
  const [wardId, setWardId] = useState(selectedOption?.wardId ?? selection.wardOptions[0]?.id ?? '');
  const [focusId, setFocusId] = useState(selectedOption?.focusId ?? selection.focusOptionsByWard[wardId]?.[0]?.id ?? '');
  const descriptionId = `${id}-description`;
  const wardSelectId = `${id}-ward`;
  const focusSelectId = `${id}-focus`;
  const reviewFocusOptions = selection.focusOptionsByWard[wardId] ?? [];

  useEffect(() => {
    const nextOption = selection.byScenarioId.get(value) ?? selection.options[0] ?? null;
    const nextWardId = nextOption?.wardId ?? selection.wardOptions[0]?.id ?? '';
    const nextFocusId = nextOption?.focusId ?? selection.focusOptionsByWard[nextWardId]?.[0]?.id ?? '';
    setWardId(nextWardId);
    setFocusId(nextFocusId);
  }, [selection, value]);

  function handleWardChange(event) {
    const nextWardId = event.target.value;
    const nextFocus = selection.focusOptionsByWard[nextWardId]?.[0] ?? null;
    setWardId(nextWardId);
    setFocusId(nextFocus?.id ?? '');
    if (nextFocus) {
      onChange(resolveScenarioId(nextWardId, nextFocus.id) ?? nextFocus.scenarioId);
    }
  }

  function handleFocusChange(event) {
    const nextFocusId = event.target.value;
    const nextFocus = reviewFocusOptions.find((focus) => focus.id === nextFocusId);
    setFocusId(nextFocusId);
    if (nextFocus) {
      onChange(resolveScenarioId(wardId, nextFocus.id) ?? nextFocus.scenarioId);
    }
  }

  return (
    <div className="demo-scenario-control">
      <label htmlFor={wardSelectId}>
        <span>Ward</span>
      </label>
      <select aria-describedby={descriptionId} id={wardSelectId} onChange={handleWardChange} value={wardId}>
        {selection.wardOptions.map((ward) => (
          <option key={ward.id} value={ward.id}>
            {ward.label}
          </option>
        ))}
      </select>

      <label htmlFor={focusSelectId}>
        <span>Review focus</span>
      </label>
      <select aria-describedby={descriptionId} id={focusSelectId} onChange={handleFocusChange} value={focusId}>
        {reviewFocusOptions.map((focus) => (
          <option key={focus.id} value={focus.id}>
            {focus.label}
          </option>
        ))}
      </select>
      <small id={descriptionId}>{description || 'Simulation data only. Fictional patient and ward context.'}</small>
    </div>
  );
}

function buildSelection(options) {
  const byScenarioId = new Map();
  const wardOptions = [];
  const focusOptionsByWard = {};

  for (const option of options) {
    const scenarioId = option?.scenarioId ?? option?.id;
    if (!option?.wardId || !option?.focusId || !scenarioId) continue;
    const wardFocusOptions = focusOptionsByWard[option.wardId] ?? (focusOptionsByWard[option.wardId] = []);
    if (wardFocusOptions.length === 0) {
      wardOptions.push({ id: option.wardId, label: option.wardLabel });
    }

    const focus = {
      id: option.focusId,
      label: option.focusLabel,
      scenarioId
    };
    wardFocusOptions.push(focus);
    byScenarioId.set(focus.scenarioId, {
      ...option,
      scenarioId: focus.scenarioId
    });
  }

  return {
    byScenarioId,
    focusOptionsByWard,
    options: [...byScenarioId.values()],
    wardOptions
  };
}
