// app/SupportPage.tsx
"use client";

import { ChatEntry } from "./ChatEntry";
import { CommunityTiles } from "./CommunityTiles";
import { HelpCenterSection } from "./HelpCenterSection";
import { DiscordIcon, GitHubIcon, LinkedInIcon } from "./SocialIcons";
import { FABRIC_COMPONENT_LINKS } from "./fabricComponents";
import { DOCS_URL, HELP_CENTER_URL, SITE_URL, SOCIAL_LINKS } from "./communityLinks";

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
          <a className="nav-support-cta" href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
            Go to Support
          </a>
        </div>
      </header>

      <main className="landing">
        <div className="world-map-region">
          <section className="hero">
            <h1>Welcome to the Fabric Community</h1>
            <p>Learn, build, and collaborate with the global Fabric ecosystem.</p>
          </section>

          <section className="ai-chat-hero">
            <div className="ai-chat-hero-inner">
              <ChatEntry placeholder="Ask Node about DeDi, CATALG, ONIX, or anything Fabric…" />
            </div>
          </section>
        </div>

        <CommunityTiles />

        <section className="docs-section">
          <p className="docs-section-intro">
            Or jump straight to documentation for a specific core component of the NFH Fabric, or browse the{" "}
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              full documentation
            </a>
            .
          </p>
          <div className="fabric-links">
            {FABRIC_COMPONENT_LINKS.map((component) => (
              <a
                key={component.name}
                className="fabric-link"
                href={component.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {component.name}
              </a>
            ))}
          </div>
        </section>

        <HelpCenterSection />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-col">
            <h3>Address</h3>
            <div className="footer-address">
              <h4>USA</h4>
              <p>8 The Green #14729, Dover, Delaware, DE 19901, USA</p>
            </div>
            <div className="footer-address">
              <h4>Singapore</h4>
              <p>1 Harbourfront Avenue, #14-07, Keppel Bay Tower, Singapore - 098632</p>
            </div>
            <div className="footer-address">
              <h4>India</h4>
              <p>ICP Brunton Central, 7/4 Brunton Road, Bangalore 560025, India</p>
            </div>
            <div className="footer-address">
              <h4>Switzerland</h4>
              <p>In progress</p>
            </div>
          </div>

          <div className="footer-col">
            <h3>Quick Links</h3>
            <nav className="footer-links">
              <a href="https://networksforhumanity.org/about-us/" target="_blank" rel="noopener noreferrer">
                About NFH
              </a>
              <a href="https://finternetlab.io/" target="_blank" rel="noopener noreferrer">
                Finternet
              </a>
              <a href="https://becknprotocol.io/" target="_blank" rel="noopener noreferrer">
                Beckn
              </a>
              <a href="https://dedi.global/" target="_blank" rel="noopener noreferrer">
                DeDi Global
              </a>
              <a href="https://www.cdir.global/" target="_blank" rel="noopener noreferrer">
                C:\&gt;DIR
              </a>
              <a href="https://youtu.be/_yeqoEUA85w" target="_blank" rel="noopener noreferrer">
                NFH Vision
              </a>
              <a href="https://networksforhumanity.org/privacy-policy/" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              <a href="https://networksforhumanity.org/newsletter-archive/" target="_blank" rel="noopener noreferrer">
                Newsletter Archive
              </a>
            </nav>
          </div>

          <div className="footer-col footer-contact">
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
