export function DemoScenarioSelector({
  description = '',
  id = 'demo-scenario-select',
  onChange = () => {},
  options = [],
  value = ''
}) {
  const descriptionId = `${id}-description`;

  return (
    <label className="demo-scenario-control" htmlFor={id}>
      <span>Demo scenario</span>
      <select aria-describedby={descriptionId} id={id} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <small id={descriptionId}>{description || 'Simulation data only. Fictional patient and ward context.'}</small>
    </label>
  );
}
