import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Fabric Community | Networks for Humanity",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
