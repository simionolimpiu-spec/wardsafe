export function MessageComposer({
  text,
  onChange,
  onSend,
  disabledReason,
  inputRef
}) {
  return (
    <form
      className="sf-connect__form"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <label htmlFor="connect-message">Message</label>
      <textarea
        ref={inputRef}
        id="connect-message"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        required
        aria-describedby="connect-message-boundary connect-send-reason"
      />
      <p id="connect-message-boundary">
        Messages do not create tasks, review cues or escalations. Use your local
        escalation process for urgent concerns.
      </p>
      <p id="connect-send-reason">{disabledReason}</p>
      <button
        className="sf-connect__primary"
        type="submit"
        disabled={Boolean(disabledReason) || !text.trim()}
      >
        Send message
      </button>
    </form>
  );
}
