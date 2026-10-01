import { ROLE_KEYS } from '../../connect/index.js';
import {
  resolveDemoRecipient,
  staffNames
} from '../../connect/demoFixtures.js';
export const humanLabel = (value) =>
  value.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
export function RoleRecipientPicker({
  value,
  onChange,
  id = 'connect-recipient'
}) {
  const recipient = resolveDemoRecipient(value);
  return (
    <div className="sf-connect__field">
      <label htmlFor={id}>Recipient role</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-result`}
      >
        {ROLE_KEYS.map((role) => (
          <option key={role} value={role}>
            {humanLabel(role)}
          </option>
        ))}
      </select>
      <p id={`${id}-result`}>
        {recipient.kind === 'person'
          ? `Resolved fictional person: ${staffNames[recipient.id]}`
          : recipient.reason}
      </p>
    </div>
  );
}
