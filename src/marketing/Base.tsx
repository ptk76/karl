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
            {props.badge && <span className="badge">{props.badge}</span>}
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
