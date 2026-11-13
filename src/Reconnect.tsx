import React from "react";
import style from "./App.module.css";

/**
 * /app/reconnect — the page behind the link in the "Please sign in to
 * DearKarl again" mail. Karl's Google access ran out or was revoked, so mail
 * cannot be saved until the user approves access again. Signing in with
 * Google once more issues a fresh token; nothing else about the account
 * changes (same address, same folder, same Claude Code connection).
 */
function Reconnect(props: {
  userEmail?: string;
  error?: string;
  busy?: boolean;
  onReconnect: () => void;
}): React.JSX.Element {
  return (
    <div className="card narrow">
      <p className="eyebrow">Drive access expired</p>
      <h1>Reconnect your Google Drive</h1>
      <p className="lede">
        Karl can no longer write to your Drive folder, so new mail is not being
        saved. Approve access again and it starts working at once.
      </p>

      <ul className="small" style={{ paddingLeft: "1.1rem" }}>
        <li>
          Your address, your folder and your Claude Code connection stay exactly
          as they are.
        </li>
        <li>
          Mail that failed while access was gone was not saved. Send it again
          after reconnecting.
        </li>
        <li>
          This usually happens when access is removed in your Google account
          settings, or when Google expires it after a long time without use.
        </li>
      </ul>

      {props.error && (
        <p role="alert" className={style.error}>
          {props.error}
        </p>
      )}

      <div className="btn-row">
        <button className="btn" onClick={props.onReconnect} disabled={props.busy}>
          {props.busy ? "Opening Google…" : "Reconnect Google Drive"}
        </button>
      </div>
      <p className="small" style={{ marginTop: 16 }}>
        {props.userEmail ? (
          <>
            Sign in as <b>{props.userEmail}</b> — the same Google account as
            before.
          </>
        ) : (
          <>Sign in with the same Google account you used before.</>
        )}{" "}
        Karl asks for the same single permission as before: <code>drive.file</code>,
        the one folder he created.
      </p>
    </div>
  );
}

export default Reconnect;
