import React from "react";
import { Link } from "react-router-dom";
import { SITE, OPERATOR } from "./site";

// Every marketing page's frame: the brand bar and the footer. Pages fill the
// middle via children. In the SPA the shell HTML is shared, so the page's
// <title>/<meta>/JSON-LD are set by usePageMeta, and the brand + footer render
// here. Nothing here may load from another origin.

interface BaseProps {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}

export default function Base(props: BaseProps): React.JSX.Element {
  return (
    <div className="dk">
      <main>
        <div className="scr">
          <header className="brandbar">
            <Link className="brand" to="/">
              📬 dearkarl
            </Link>
            <span className="brandbar-r">
              {props.badge && <span className="badge">{props.badge}</span>}
              {/* Plain links, not <Link>: /app is the account app, which
                  reads the URL once on load. Sign-up and log-in are the same
                  Google flow; the app tells new and returning users apart. */}
              <nav className="authnav" aria-label="Account">
                <a href="/app">Register</a>
                <span aria-hidden="true"> / </span>
                <a href="/app">Log in</a>
              </nav>
            </span>
          </header>
          {props.children}
        </div>
      </main>
      <footer className="sitefoot">
        <div className="in">
          <p className="who">
            <b>📬 dearkarl</b> — email anything to your AI.
            <br />
            Run by <b>{OPERATOR.legalName}</b>, Wrocław, Poland.
            <br />© 2026 · Self-hosting is free and always will be.
          </p>
          <nav aria-label="Footer">
            <Link to="/blog">Blog</Link>
            <Link to="/privacy">Privacy notice</Link>
            <Link to="/terms">Terms of use</Link>
            <a href="/privacy#1-who-runs-this-site">Imprint</a>
            <a href={SITE.repo}>Source on GitHub</a>
            <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
