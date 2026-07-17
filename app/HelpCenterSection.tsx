// app/HelpCenterSection.tsx
import { HELP_CENTER_URL } from "./communityLinks";

export function HelpCenterSection() {
  return (
    <section className="help-center-section" aria-labelledby="help-center-heading">
      <h2 id="help-center-heading">Need a hand?</h2>
      <p className="help-center-subtitle">Raise a ticket to get help with anything Fabric related</p>

      <a className="help-center-browse-all" href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
        Raise a Ticket
      </a>
    </section>
  );
}
