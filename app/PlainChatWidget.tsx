// app/PlainChatWidget.tsx
"use client";

import Script from "next/script";

declare global {
  interface Window {
    Plain?: {
      init: (config: {
        appId: string;
        embedAt?: Element;
        entryPoint?: { type: "default" } | { type: "chat" };
      }) => void;
    };
  }
}

// Nova (Ari) live chat, embedded via Plain's chat widget.
const PLAIN_CHAT_APP_ID = "liveChatApp_01KWH2XSVE4CPF90QTG7ZDR8CA";

export function PlainChatWidget({ embedAt }: { embedAt: string }) {
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
        });
      }}
    />
  );
}
