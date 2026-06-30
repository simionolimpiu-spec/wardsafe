export function DemoScenarioSelector({
  description = '',
  id = 'demo-scenario-select',
  onChange = () => {},
  options = [],
  value = ''
}) {
  return (
    <label className="demo-scenario-control" htmlFor={id}>
      <span>Demo scenario</span>
      <select id={id} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <small>{description || 'Simulation data only. Fictional patient and ward context.'}</small>
    </label>
  );
}
