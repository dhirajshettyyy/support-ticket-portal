// app/SupportPage.tsx
import { HomeBody } from "./HomeBody";

const SITE_URL = "https://networksforhumanity.org";

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
      </header>

      <HomeBody />

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
