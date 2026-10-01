export const BADGE_TONES = Object.freeze([
  'neutral',
  'information',
  'success',
  'warning',
  'review',
  'critical',
  'simulation'
]);

/**
 * Small text label. Tone sets colour only; the text carries the meaning.
 * For clinical states use ClinicalStatusBadge, which adds the state icon.
 */
export function Badge({ tone = 'neutral', variant = 'subtle', icon: Icon, className = '', children, ...rest }) {
  const toneClass = BADGE_TONES.includes(tone) ? tone : 'neutral';
  const classes = ['sf-badge', `sf-badge--${toneClass}`, `sf-badge--${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {Icon && <Icon aria-hidden="true" className="sf-badge__icon" focusable="false" />}
      <span className="sf-badge__label">{children}</span>
    </span>
  );
}
