// app/TileIcons.tsx
// Solid-fill, geometric icons (currentColor) matching NFH's flat, blocky
// logo/favicon mark — replaces the earlier thin-stroke outline icons.

export function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="4" width="8" height="16" rx="1.5" />
      <rect x="12.5" y="4" width="8" height="16" rx="1.5" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="3" width="16" height="12" rx="2.5" />
      <polygon points="7,15 7,20 12,15" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5.5" cy="12" r="4" />
      <circle cx="18.5" cy="12" r="4" />
      <rect x="7" y="10" width="10" height="4" />
    </svg>
  );
}

export function HandshakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="12" r="6.5" opacity="0.4" />
      <circle cx="16" cy="12" r="6.5" />
    </svg>
  );
}
