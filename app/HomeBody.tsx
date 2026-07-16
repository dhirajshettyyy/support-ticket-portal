// app/HomeBody.tsx
"use client";

import { useState } from "react";
import { ChatEntry } from "./ChatEntry";
import { FABRIC_COMPONENT_LINKS } from "./fabricComponents";
import { HelpCenterEmbed } from "./HelpCenterEmbed";

const DOCS_URL = "https://docs.nfh.global";

export function HomeBody() {
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);

  return (
    <>
      {!helpCenterOpen && (
        <section className="hero">
          <h1>Welcome to NFH Support</h1>
          <p>Find what you need faster. Explore our technical documentation or enter your question below to search with AI.</p>
        </section>
      )}

      {helpCenterOpen ? (
        <HelpCenterEmbed onBack={() => setHelpCenterOpen(false)} />
      ) : (
        <main className="landing">
          <ChatEntry />

          <section className="docs-section">
            <p className="docs-section-intro">
              Explore documentation for each core component of the NFH Fabric, or browse the{" "}
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                full documentation
              </a>
              .
            </p>
            <div className="fabric-links">
              {FABRIC_COMPONENT_LINKS.map((component) => (
                <a
                  key={component.name}
                  className="fabric-link"
                  href={component.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {component.name}
                </a>
              ))}
            </div>
          </section>

          <section className="help-section">
            <h2>Still have questions?</h2>
            <p>Raise a query and connect directly with our team.</p>
            <button type="button" className="button-primary" onClick={() => setHelpCenterOpen(true)}>
              Raise a Ticket
            </button>
          </section>
        </main>
      )}
    </>
  );
}
