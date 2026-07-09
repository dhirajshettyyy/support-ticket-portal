// app/SupportPage.tsx
"use client";

import { useEffect, useState } from "react";
import { TicketForm } from "./TicketForm";
import { PlainChatWidget } from "./PlainChatWidget";

const CHAT_EMBED_SELECTOR = "#plain-chat-embed";

const DOCS_URL = "https://docs.nfh.global";
const SITE_URL = "https://networksforhumanity.org";
const HELP_CENTER_URL = "https://nfh-fwd.support.site/";

export function SupportPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!isFormOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFormOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen]);

  return (
    <>
      <header className="site-nav">
        <a href={SITE_URL} className="nav-logo">
          <span className="nav-logo-mark">NFH</span>
          <span className="nav-logo-sub">
            NETWORKS
            <br />
            FOR
            <br />
            HUMANITY
          </span>
        </a>
      </header>

      <section className="hero">
        <h1>Support</h1>
        <p>Find answers, explore guides, or get in touch with our team.</p>
      </section>

      <main className="landing">
        <section className="docs-card">
          <h2>Browse the docs</h2>
          <p>Guides, API references, and how-tos for everything NFH.</p>
          <div className="docs-card-actions">
            <a className="button-primary" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Go to docs.nfh.global
            </a>
            <a className="button-secondary" href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
              Help Center
            </a>
          </div>
        </section>

        <section className="chat-card">
          <h2>Chat with our team</h2>
          <p>Ari, our support assistant, is ready to help — and can loop in a human when needed.</p>
          <div id="plain-chat-embed" className="chat-embed" />
        </section>

        <section className="help-section">
          <h2>Have a specific issue to track?</h2>
          <p>Raise a structured ticket and we&apos;ll follow up by email.</p>
          <button type="button" className="button-primary" onClick={() => setIsFormOpen(true)}>
            Raise a ticket
          </button>
        </section>

        <PlainChatWidget embedAt={CHAT_EMBED_SELECTOR} />

        <footer className="footer">
          <a href={SITE_URL}>networksforhumanity.org</a>
        </footer>

        {isFormOpen && (
          <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="modal-close" onClick={() => setIsFormOpen(false)} aria-label="Close">
                &times;
              </button>
              <div className="header">
                <h1>Submit a support ticket</h1>
                <p>Tell us what&apos;s going on and we&apos;ll get back to you as soon as possible.</p>
              </div>
              <TicketForm />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
