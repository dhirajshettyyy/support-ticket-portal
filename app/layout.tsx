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
        {/* Sets data-theme before first paint so there's no flash of the
            wrong theme — reads the user's saved choice, falling back to
            OS preference. Mirrors globals.css's :root[data-theme] rules. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
