// app/HelpCenterEmbed.tsx
"use client";

const HELP_CENTER_EMBED_SRC = "/help-embed/inbox/new";

export function HelpCenterEmbed({ onBack }: { onBack: () => void }) {
  return (
    <section className="help-embed-row" aria-label="Raise a ticket">
      <div className="help-embed-bar">
        <button type="button" className="help-embed-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
        <span className="help-embed-bar-title">Raise a Ticket</span>
      </div>
      <iframe
        className="help-embed-frame"
        src={HELP_CENTER_EMBED_SRC}
        title="Raise a support ticket"
      />
    </section>
  );
}
