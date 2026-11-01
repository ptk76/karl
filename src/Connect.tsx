import React, { useState } from "react";
import style from "./App.module.css";
import { formatKarlAddress } from "./karlAddress";
import { createApiToken } from "./server";

/** Karl's MCP endpoint. A client connects to it with a Personal Access Token in
    the Authorization header — see worker/mcp/README.md and .claude/skills/
    dearkarl-mcp. */
const MCP_URL = "https://karl.przemekkudla.pl/mcp";
const MCP_SERVER_NAME = "dearkarl";

/** Session key for the token the user generates here, so "Show it again" (back
    on the account page) reuses the same command instead of minting a new token
    on every visit. */
const TOKEN_KEY = "dk_mcp_token";

/** The `claude mcp add` line that wires a Claude Code session to Karl, carrying
    the user's Personal Access Token in the Authorization header. */
function connectCommand(token: string): string {
  return `claude mcp add --transport http ${MCP_SERVER_NAME} ${MCP_URL} --header "Authorization: Bearer ${token}"`;
}

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
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const karlAddress = formatKarlAddress(props.karlEmail);
  const command = token ? connectCommand(token) : "";

  const generate = async () => {
    setError("");
    setBusy(true);
    const result = await createApiToken(MCP_SERVER_NAME);
    setBusy(false);
    if (!result) {
      setError("Could not generate a token. Please try again.");
      return;
    }
    setToken(result.token);
    try {
      sessionStorage.setItem(TOKEN_KEY, result.token);
    } catch {
      // Session storage may be unavailable; the token still shows this visit.
    }
  };

  const copy = async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
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
          <code className="mono">
            {token
              ? command
              : "# Generate a token to fill your connection line."}
          </code>
          <button
            className="copybtn"
            type="button"
            aria-label="Copy"
            data-copied={copied ? "1" : undefined}
            onClick={copy}
            disabled={!token}
          >
            <CopySheetsIcon />
            <CopyTickIcon />
          </button>
        </div>

        {error && (
          <p role="alert" className={style.error}>
            {error}
          </p>
        )}

        <p>
          That is the whole install. It tells Claude Code where Karl lives, and
          the token inside it proves which account is yours. Nothing gets
          downloaded.
        </p>

        {token && (
          <p className="small" style={{ marginTop: 10 }}>
            Keep this line safe — the token in it is shown once. If you need a
            fresh one, generate a new token on your account page.
          </p>
        )}

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
          {token ? (
            <button className="btn" onClick={props.onDone}>
              Done
            </button>
          ) : (
            <button className="btn" onClick={generate} disabled={busy}>
              {busy ? "Generating…" : "Generate my token"}
            </button>
          )}
          {token && (
            <button
              className="btn ghost"
              type="button"
              onClick={generate}
              disabled={busy}
            >
              New token
            </button>
          )}
        </div>

        <div className="later-note">
          <b>Keep that line safe.</b> The token in it is proof of which account
          is yours, and it is shown once. If you lose it, revoke it on your
          account page and paste a fresh one — the command is the same, only the
          token changes.
        </div>
      </div>
    </>
  );
}

export default Connect;
