// app/PlainChatWidget.tsx
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Plain?: {
      init: (config: {
        appId: string;
        embedAt?: Element;
        entryPoint?: { type: "default" } | { type: "chat" };
        requireAuthentication?: boolean;
        customerDetails?: {
          email: string;
          emailHash: string;
        };
      }) => void;
    };
  }
}

// Nova (Ari) live chat, embedded via Plain's chat widget.
const PLAIN_CHAT_APP_ID = "liveChatApp_01KWH2XSVE4CPF90QTG7ZDR8CA";

// chat.cdn-plain.com is a common target for ad-blocker "chat"/"widget" CDN
// rules, and even when the script itself loads, its own calls to
// chat.uk.plain.com can be blocked separately. Either way the embed div is
// left permanently empty with no signal - this timeout is what turns that
// into a visible error instead of a silent blank box.
const LOAD_TIMEOUT_MS = 8000;

const BLOCKED_MESSAGE =
  "Live chat couldn't load - this is often caused by an ad blocker or privacy extension blocking chat.cdn-plain.com. Try disabling it for this site, or email us instead.";

export function PlainChatWidget({
  embedAt,
  email,
  onError,
}: {
  embedAt: string;
  email: string;
  onError?: (message: string) => void;
}) {
  const [emailHash, setEmailHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        if (res.ok) return res.json();
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Couldn't start chat. Please try again.");
      })
      .then((data: { emailHash: string }) => {
        if (!cancelled) setEmailHash(data.emailHash);
      })
      .catch((err: Error) => {
        if (!cancelled) onError?.(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [email, onError]);

  if (!emailHash) return null;

  return (
    <Script
      src="https://chat.cdn-plain.com/index.js"
      strategy="afterInteractive"
      onLoad={() => {
        const container = document.querySelector(embedAt);
        window.Plain?.init({
          appId: PLAIN_CHAT_APP_ID,
          embedAt: container ?? undefined,
          entryPoint: { type: "chat" },
          customerDetails: { email, emailHash },
        });
        setTimeout(() => {
          // Plain renders into an open shadow root on the container, not as
          // direct light-DOM children - childElementCount alone is always 0.
          const hasContent = container?.shadowRoot
            ? container.shadowRoot.childElementCount > 0
            : (container?.childElementCount ?? 0) > 0;
          if (!hasContent) {
            onError?.(BLOCKED_MESSAGE);
          }
        }, LOAD_TIMEOUT_MS);
      }}
      onError={() => onError?.(BLOCKED_MESSAGE)}
    />
  );
}
