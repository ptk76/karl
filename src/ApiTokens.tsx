import React, { useEffect, useState } from "react";
import style from "./App.module.css";
import type { ApiTokenCreated, ApiTokenSummary } from "./server";
import { createApiToken, listApiTokens, revokeApiToken } from "./server";

const EXPIRY_OPTIONS = [
  { label: "Never", days: null },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "365 days", days: 365 },
];

function formatDate(epochMs: number | null): string {
  if (epochMs === null) return "Never";
  return new Date(epochMs).toLocaleString();
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

export function ApiTokens(): React.JSX.Element {
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState<number | null>(null);
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const list = await listApiTokens();
    if (list) setTokens(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const generate = async () => {
    setError("");
    setBusy(true);
    const result = await createApiToken(name.trim() || undefined, expiry ?? undefined);
    setBusy(false);
    if (!result) {
      setError("Could not generate a token. Please try again.");
      return;
    }
    setCreated(result);
    setCopied(false);
    setName("");
    refresh();
  };

  const revoke = async (id: number) => {
    setBusy(true);
    await revokeApiToken(id);
    setBusy(false);
    refresh();
  };

  const copyToken = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable; the token is still select-all in the box.
    }
  };

  return (
    <>
      <h2>MCP / API access</h2>
      <p>
        Personal Access Tokens let AI tools (MCP clients such as Claude Code or
        Claude Desktop) list and read the files in your <code>dearkarl</code>{" "}
        Google Drive folder. Point them at{" "}
        <code>https://karl.przemekkudla.pl/mcp</code> and send the token as{" "}
        <code>Authorization: Bearer &lt;token&gt;</code>.
      </p>

      {error && (
        <p role="alert" className={style.error}>
          {error}
        </p>
      )}

      {created && (
        <>
          <div className="warn">
            <p>
              <strong>Keep this token safe — it is shown only once.</strong> It
              is not stored by Dear Karl; if you lose it, revoke it and generate
              a new one.
            </p>
          </div>

          <div className="copyrow">
            <code className="mono">{created.token}</code>
            <button
              className="copybtn"
              type="button"
              aria-label="Copy"
              data-copied={copied ? "1" : undefined}
              onClick={copyToken}
            >
              <CopySheetsIcon />
              <CopyTickIcon />
            </button>
          </div>

          <div className="btn-row">
            <button className="btn ghost" onClick={() => setCreated(null)}>
              Done
            </button>
          </div>
        </>
      )}

      <label>
        Token name
        <input
          type="text"
          value={name}
          placeholder="e.g. Claude Code"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Expires
        <select
          value={expiry ?? ""}
          onChange={(e) =>
            setExpiry(e.target.value === "" ? null : Number(e.target.value))
          }
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.label} value={o.days ?? ""}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="btn-row">
        <button className="btn" onClick={generate} disabled={busy}>
          Generate token
        </button>
      </div>

      {tokens.length > 0 && (
        <>
          <h3>Active tokens</h3>
          <div className="rows" style={{ marginTop: 16 }}>
            {tokens.map((t) => (
              <div
                className="rowitem"
                key={t.id}
                style={{ alignItems: "center" }}
              >
                <span>
                  <span className="v">
                    <strong>{t.name}</strong> <code>({t.prefix}…)</code>
                  </span>
                  <br />
                  <span className="small">
                    Created {formatDate(t.createdAt)}, last used{" "}
                    {formatDate(t.lastUsedAt)}
                  </span>
                </span>
                <button
                  className="btn ghost"
                  onClick={() => revoke(t.id)}
                  disabled={busy}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
