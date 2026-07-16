// app/help-embed/popup-auth/route.ts
//
// The identity provider used by the help center (WorkOS AuthKit) refuses to
// render inside an iframe (frame-ancestors 'self' / X-Frame-Options:
// SAMEORIGIN — a security policy on their end, not ours to override). This
// page is what the iframe shows instead of navigating there directly: a
// click opens the real sign-in in a genuine top-level popup window (a
// direct user gesture, so it isn't blocked by popup blockers), waits for it
// to close, then resumes the ticket flow inside the iframe. Once signed in,
// the session cookie WorkOS/support.site set during the popup is already
// valid for fabric.support.site, since both are on the same site.
import { NextRequest, NextResponse } from "next/server";
import { PROXY_PREFIX } from "../proxyShared";

export function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target");
  if (!target) {
    return NextResponse.redirect(new URL(`${PROXY_PREFIX}/inbox/new`, req.url));
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sign in</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #ffffff; color: #000000;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0a0a0a; color: #ffffff; }
    .card { border-color: #2a2a2a !important; }
    button { background: #ffffff !important; color: #0a0a0a !important; }
  }
  .card {
    max-width: 320px; text-align: center; padding: 2.25rem 2rem;
    border: 1px solid #e2e2e2; border-radius: 6px;
  }
  h1 { font-size: 1.0625rem; font-weight: 700; margin: 0 0 0.5rem; }
  p { font-size: 0.9375rem; color: inherit; opacity: 0.7; margin: 0 0 1.5rem; line-height: 1.5; }
  button {
    appearance: none; border: none; border-radius: 4px;
    background: #000000; color: #ffffff;
    font: inherit; font-size: 0.8125rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.03em;
    padding: 0.8125rem 1.75rem; cursor: pointer;
  }
  .waiting { display: none; font-size: 0.875rem; opacity: 0.7; }
</style>
</head>
<body>
  <div class="card">
    <h1>Sign in required</h1>
    <p>Raising a ticket needs a quick sign-in. It opens in a small window — come back here once you're done.</p>
    <button id="open-btn" type="button">Continue to sign in</button>
    <p class="waiting" id="waiting-text">Waiting for you to finish in the sign-in window&hellip;</p>
  </div>
  <script>
    (function () {
      var target = ${JSON.stringify(target)};
      var btn = document.getElementById("open-btn");
      var waitingText = document.getElementById("waiting-text");

      btn.addEventListener("click", function () {
        var popup = window.open(target, "nfh_login_popup", "width=480,height=640");
        if (!popup) {
          // Popup blocked despite the click — fall back to same-tab
          // navigation for this step only.
          window.location.href = target;
          return;
        }
        btn.style.display = "none";
        waitingText.style.display = "block";
        var poll = setInterval(function () {
          if (popup.closed) {
            clearInterval(poll);
            window.location.href = "${PROXY_PREFIX}/inbox/new";
          }
        }, 500);
      });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "frame-ancestors 'self'",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
