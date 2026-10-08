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

export function ApiTokens(): React.JSX.Element {
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState<number | null>(null);
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);
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
    } catch {
      // Clipboard may be unavailable; the token is still visible to copy.
    }
  };

  return (
    <section>
      <h2>MCP / API access</h2>
      <p>
        Personal Access Tokens let AI tools (MCP clients such as Claude Code or
        Claude Desktop) list and read the files in your{" "}
        <code>dearkarl</code> Google Drive folder. Point them at{" "}
        <code>https://karl.przemekkudla.pl/mcp</code> and send the token as{" "}
        <code>Authorization: Bearer &lt;token&gt;</code>.
      </p>

      {error && (
        <p role="alert" className={style.error}>
          {error}
        </p>
      )}

      {created && (
        <div className={style.tokenReveal}>
          <p>
            <strong>Keep this token safe — it is shown only once.</strong> It is
            not stored by Dear Karl; if you lose it, revoke it and generate a new
            one.
          </p>
          <code className={style.tokenValue}>{created.token}</code>
          <button onClick={copyToken}>Copy token</button>
          <button onClick={() => setCreated(null)}>Done</button>
        </div>
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
      <button onClick={generate} disabled={busy}>
        Generate token
      </button>

      {tokens.length > 0 && (
        <>
          <h3>Active tokens</h3>
          <ul className={style.tokenList}>
            {tokens.map((t) => (
              <li key={t.id}>
                <span>
                  <strong>{t.name}</strong> (<code>{t.prefix}…</code>) — created{" "}
                  {formatDate(t.createdAt)}, last used {formatDate(t.lastUsedAt)}
                </span>
                <button onClick={() => revoke(t.id)} disabled={busy}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
