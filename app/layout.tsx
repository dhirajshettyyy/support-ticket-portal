import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: "Fabric Community | Networks for Humanity",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        {/* NFH's Adobe Typekit heading font ("tenon") — used site-wide on networksforhumanity.org */}
        <link rel="stylesheet" href="https://use.typekit.net/zrd6ncw.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
