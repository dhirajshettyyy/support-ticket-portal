import type { ReactNode } from "react";
import "./globals.css";
import { PlainChatWidget } from "./PlainChatWidget";

export const metadata = {
  title: "Support Ticket Portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PlainChatWidget />
      </body>
    </html>
  );
}
