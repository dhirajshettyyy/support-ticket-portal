// app/SupportPage.tsx
"use client";

import { useEffect, useState } from "react";
import { TicketForm } from "./TicketForm";

const DOCS_URL = "https://docs.nfh.global";
const SITE_URL = "https://networksforhumanity.org";

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
          <a className="button-primary" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            Go to docs.nfh.global
          </a>
        </section>

        <section className="help-section">
          <h2>Can&apos;t find what you&apos;re looking for?</h2>
          <p>Our team is happy to help directly — or chat with us using the bubble in the corner.</p>
          <button type="button" className="button-primary" onClick={() => setIsFormOpen(true)}>
            Raise a ticket
          </button>
        </section>

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
