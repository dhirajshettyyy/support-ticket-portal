// app/SupportPage.tsx
"use client";

import { ChatEntry } from "./ChatEntry";
import { CommunityTiles } from "./CommunityTiles";
import { DiscordIcon, GitHubIcon, LinkedInIcon } from "./SocialIcons";
import { ThemeToggle } from "./ThemeToggle";
import { HELP_CENTER_URL, SITE_URL, SOCIAL_LINKS } from "./communityLinks";

export function SupportPage() {
  return (
    <>
      <header className="site-nav">
        <a href={SITE_URL} className="nav-logo">
          <span className="nav-logo-mark">NFH</span>
          <span className="nav-logo-sub">
            NETWORKS
            <br />
            FOR
            <br />
            HUMANITY
          </span>
        </a>

        <div className="site-nav-right">
          <nav className="site-nav-socials" aria-label="Social links">
            <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <DiscordIcon />
            </a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GitHubIcon />
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="landing">
        <div className="map-sticky-layer" aria-hidden="true" />

        <section className="hero">
          <h1>Welcome to the NFH Community</h1>
          <p>Learn, build, and collaborate with the global NFH ecosystem.</p>
        </section>

        <section className="ai-chat-hero">
          <div className="ai-chat-hero-inner">
            <ChatEntry placeholder="Ask Node anything about NFH Fabric" />
            <div className="chat-help-inline">
              <p>Still can&apos;t find an answer?</p>
              <a className="chat-help-cta" href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
                Get Help →
              </a>
            </div>
          </div>
        </section>

        <CommunityTiles />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-contact">
            <p>Want to explore supporting NFH&apos;s missions?</p>
            <p className="footer-contact-cta">Write to Us.</p>
            <a href="mailto:connect@networksforhumanity.org">connect@networksforhumanity.org</a>
          </div>
        </div>

        <div className="site-footer-bottom">
          <div className="footer-logo">
            <span className="footer-logo-mark">NFH</span>
            <span className="footer-logo-sub">
              NETWORKS
              <br />
              FOR
              <br />
              HUMANITY
            </span>
          </div>
          <p>&copy; 2026 Networks for Humanity. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
