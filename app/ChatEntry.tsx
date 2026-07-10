// app/ChatEntry.tsx
"use client";

import { useState } from "react";
import { PlainChatWidget } from "./PlainChatWidget";

const CHAT_EMBED_SELECTOR = "#plain-chat-embed";

export function ChatEntry() {
  const [isExpanded, setIsExpanded] = useState(false);

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
          Hey, How can I help you?
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
        <div
          id="plain-chat-embed"
          className={isExpanded ? "chat-embed chat-embed-expanded" : "chat-embed chat-embed-collapsed"}
        />
      </div>
      <PlainChatWidget embedAt={CHAT_EMBED_SELECTOR} />
    </section>
  );
}
