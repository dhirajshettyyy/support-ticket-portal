// app/ChatEntry.tsx
"use client";

import { useState, type FormEvent } from "react";
import { PlainChatWidget } from "./PlainChatWidget";

const CHAT_EMBED_SELECTOR = "#plain-chat-embed";
const DEFAULT_PLACEHOLDER = "Hey, how can I help you?";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChatEntry({ placeholder = DEFAULT_PLACEHOLDER }: { placeholder?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = emailInput.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setEmail(trimmed);
  }

  return (
    <section className="chat-entry">
      {!isExpanded && (
        <button type="button" className="chat-compact" onClick={() => setIsExpanded(true)}>
          <svg className="chat-compact-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.2A7.96 7.96 0 0 1 4 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {placeholder}
        </button>
      )}
      <div className={isExpanded ? "chat-embed-shell chat-embed-shell-expanded" : "chat-embed-shell"}>
        {isExpanded && (
          <button
            type="button"
            className="chat-minimize"
            onClick={() => setIsExpanded(false)}
            aria-label="Minimize chat"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {isExpanded && !email && (
          <form className="chat-email-gate" onSubmit={handleEmailSubmit}>
            <p>Enter your email to start chatting with Ari.</p>
            <input
              type="email"
              className="chat-email-input"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              autoFocus
              required
            />
            {emailError && <p className="chat-email-error">{emailError}</p>}
            <button type="submit" className="chat-email-submit">
              Start chat
            </button>
          </form>
        )}
        <div
          id="plain-chat-embed"
          className={
            isExpanded && email ? "chat-embed chat-embed-expanded" : "chat-embed chat-embed-collapsed"
          }
        />
      </div>
      {isExpanded && email && <PlainChatWidget embedAt={CHAT_EMBED_SELECTOR} email={email} />}
    </section>
  );
}
