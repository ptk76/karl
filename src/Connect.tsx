import React, { useState } from "react";
import { formatKarlAddress } from "./karlAddress";

/** The command that wires Claude Code to Karl's MCP endpoint. The mock shows a
    placeholder because the connector that emits a real, working line is not
    built yet — see the later-note below, and docs/mcp in the repo. */
const CONNECT_COMMAND = "[ placeholder — the connector is not built yet ]";

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

function Connect(props: {
  karlEmail: string;
  userEmail: string;
  onDone: () => void;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const karlAddress = formatKarlAddress(props.karlEmail);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONNECT_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable; the text stays select-all in the box.
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
          <li className="done">
            <span className="n">2</span>
            <span>Your address</span>
          </li>
          <li className="sep" aria-hidden="true" />
          <li className="on">
            <span className="n">3</span>
            <span>Connect Claude Code</span>
          </li>
        </ol>
      </nav>

      <div className="card narrow">
        <p className="eyebrow">Step 3 of 3</p>
        <h1>Paste this into Claude Code</h1>

        <div className="copyrow">
          <code className="mono">{CONNECT_COMMAND}</code>
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

        <p>
          That is the whole install. It tells Claude Code where Karl lives and
          which account is yours. Nothing gets downloaded, and no token is ever
          shown to you or pasted by you.
        </p>
        <p className="small">
          Then open a new Claude Code session — it will tell you how many are
          waiting.
        </p>

        <div className="notice" style={{ marginTop: 22 }}>
          <p style={{ marginBottom: ".6em" }}>
            <b>What you just set up</b>
          </p>
          <ul
            className="small"
            style={{ margin: 0, paddingLeft: "1.1rem" }}
          >
            <li>
              <b>Your address:</b> <code>{karlAddress}</code>
            </li>
            <li>
              <b>Mail lands in:</b> your Drive folder <code>dearkarl</code>
            </li>
            <li>
              <b>Mail is accepted from:</b> <code>{props.userEmail}</code> — and
              nothing else. Anything from another address bounces back to
              whoever sent it.
            </li>
          </ul>
        </div>

        <div className="btn-row">
          <button className="btn" onClick={props.onDone}>
            Done
          </button>
        </div>

        <div className="later-note">
          <b>Why this box is empty.</b> The connector is work item 8 in{" "}
          <code>docs/mvp2.md</code> and does not exist yet. Printing a
          real-looking line that points at nothing would be an NN 9.1 break, so
          the mock says so instead.
        </div>
      </div>
    </>
  );
}

export default Connect;
