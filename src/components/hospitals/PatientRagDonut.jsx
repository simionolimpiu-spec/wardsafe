import { computeDonutSegments, NHS, RAG_COLOURS, ragWord } from '../../domain/patientRag.js';

// Interactive RAG donut for a single patient. Inline SVG, NHS colours,
// traffic-light system, NEWS2 in the centre. Simulation-only.
export function PatientRagDonut({ patient, size = 168, thickness = 22 }) {
  const segments = computeDonutSegments(patient);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 2; // small visual gap between slices (length units)

  let offset = 0;
  const arcs = segments.map((segment) => {
    const dash = Math.max((segment.pct / 100) * circumference - gap, 0);
    const arc = {
      ...segment,
      dash,
      rest: circumference - dash,
      dashoffset: -offset
    };
    offset += (segment.pct / 100) * circumference;
    return arc;
  });

  const news2 = patient?.news2 ?? 'Not recorded';
  const overall = patient?.rag ?? 'unknown';
  const ariaLabel = `Care status donut for ${patient?.name ?? 'patient'}. NEWS2 ${news2}. Overall ${ragWord(overall)}. ` +
    segments.map((s) => `${s.label} ${ragWord(s.rag)}`).join(', ') + '.';

  return (
    <div className="rag-donut">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={NHS.paleGrey} strokeWidth={thickness} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.colour}
              strokeWidth={thickness}
              strokeDasharray={`${arc.dash} ${arc.rest}`}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="butt"
            >
              <title>{`${arc.label}: ${ragWord(arc.rag)}\n${arc.note}`}</title>
            </circle>
          ))}
        </g>
        <text x={cx} y={cy - 6} textAnchor="middle" className="rag-donut-score" fill={NHS.black}>{news2}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="rag-donut-caption" fill={NHS.midGrey}>NEWS2</text>
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          className="rag-donut-overall"
          fill={overall === 'amber' ? '#805500' : RAG_COLOURS[overall] ?? NHS.midGrey}
        >{ragWord(overall)}</text>
      </svg>
    </div>
  );
}

// Compact legend mapping each clinical domain to its RAG status.
export function PatientRagLegend({ patient }) {
  const segments = computeDonutSegments(patient);
  return (
    <ul className="rag-legend">
      {segments.map((segment) => (
        <li key={segment.key}>
          <span className="rag-dot" style={{ backgroundColor: segment.colour }} aria-hidden="true" />
          <span className="rag-legend-label">{segment.label}</span>
          <span className="rag-legend-status">{ragWord(segment.rag)}</span>
        </li>
      ))}
    </ul>
  );
}
