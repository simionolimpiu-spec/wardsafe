import { createPrivacySafeNotification } from '../../connect/index.js';
export function NotificationPreview({ category }) {
  const notification = createPrivacySafeNotification({ category });
  return (
    <section
      className="sf-connect__preview"
      aria-label="Lock-screen preview (simulation)"
    >
      <h3>Lock-screen preview (simulation)</h3>
      <p>{notification.text}</p>
    </section>
  );
}
