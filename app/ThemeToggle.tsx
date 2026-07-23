// app/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <rect x="11" y="1.5" width="2" height="3.5" rx="1" />
      <rect x="11" y="19" width="2" height="3.5" rx="1" />
      <rect x="11" y="1.5" width="2" height="3.5" rx="1" transform="rotate(45 12 12)" />
      <rect x="11" y="19" width="2" height="3.5" rx="1" transform="rotate(45 12 12)" />
      <rect x="11" y="1.5" width="2" height="3.5" rx="1" transform="rotate(90 12 12)" />
      <rect x="11" y="19" width="2" height="3.5" rx="1" transform="rotate(90 12 12)" />
      <rect x="11" y="1.5" width="2" height="3.5" rx="1" transform="rotate(135 12 12)" />
      <rect x="11" y="19" width="2" height="3.5" rx="1" transform="rotate(135 12 12)" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme((document.documentElement.getAttribute("data-theme") as Theme | null) ?? "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
