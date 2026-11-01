import React, { useState } from "react";
import { formatKarlAddress } from "./karlAddress";

function CopySheetsIcon() {
  return (
    <svg
      className="sheets"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CopyTickIcon() {
  return (
    <svg
      className="tick"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Address(props: {
  karlEmail: string;
  userEmail: string;
  onNext: () => void;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const karlAddress = formatKarlAddress(props.karlEmail);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(karlAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable; the address stays select-all in the box.
    }
  };

  return (
    <>
      <nav className="steps" aria-label="Progress">
        <ol>
          <li className="done">
            <span className="n">1</span>
            <span>Sign in</span>
          </li>
          <li className="sep" aria-hidden="true" />
          <li className="on">
            <span className="n">2</span>
            <span>Your address</span>
          </li>
          <li className="sep" aria-hidden="true" />
          <li>
            <span className="n">3</span>
            <span>Connect Claude Code</span>
          </li>
        </ol>
      </nav>

      <div className="card narrow">
        <p className="eyebrow">Step 2 of 3</p>
        <h1>This is your address</h1>

        <div className="copyrow">
          <code className="mono address">{karlAddress}</code>
          <button
            className="copybtn"
            type="button"
            aria-label="Copy"
            data-copied={copied ? "1" : undefined}
            onClick={copy}
          >
            <CopySheetsIcon />
            <CopyTickIcon />
          </button>
        </div>
        <p className="small">
          One click selects the whole line; the icon copies it.
        </p>

        <p>
          Forward anything here. An article, a note you dictated on the way home,
          a receipt. It shows up as a text file in your Drive folder within
          seconds.
        </p>

        <div className="warn">
          <p>
            <b>Keep it to yourself.</b> Only mail from your own addresses gets
            through — everything else bounces. That is on by default, not a
            setting.
          </p>
        </div>

        <div className="notice" style={{ marginTop: 18 }}>
          <p style={{ marginBottom: ".6em" }}>
            <b>
              Forward from <code>{props.userEmail}</code>.
            </b>
          </p>
          <p className="small" style={{ marginBottom: ".8em" }}>
            That is the address you signed in with. Mail from anywhere else
            bounces before it reaches your Drive.
          </p>
          <p className="small" style={{ marginBottom: 0 }}>
            <i>
              [ inert in this mock: an optional "I also forward from…" field, and
              the same list lives on your account page ]
            </i>
          </p>
        </div>

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn" onClick={props.onNext}>
            Next: connect Claude Code
          </button>
        </div>
      </div>
    </>
  );
}

export default Address;
