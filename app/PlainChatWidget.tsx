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

export function PlainChatWidget({ embedAt, email }: { embedAt: string; email: string }) {
  const [emailHash, setEmailHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { emailHash: string }) => {
        if (!cancelled) setEmailHash(data.emailHash);
      })
      .catch(() => {
        // Leave emailHash null - widget stays unmounted rather than opening unauthenticated.
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (!emailHash) return null;

  return (
    <Script
      src="https://chat.cdn-plain.com/index.js"
      strategy="afterInteractive"
      onLoad={() => {
        const container = document.querySelector(embedAt) ?? undefined;
        window.Plain?.init({
          appId: PLAIN_CHAT_APP_ID,
          embedAt: container,
          entryPoint: { type: "chat" },
          customerDetails: { email, emailHash },
        });
      }}
    />
  );
}
