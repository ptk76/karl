import React from "react";
import style from "./App.module.css";
import { formatKarlAddress } from "./karlAddress";
import { ApiTokens } from "./ApiTokens";

function Account(props: {
  karlEmail: string;
  userEmail: string;
  error?: string;
  busy?: boolean;
  onShowConnect: () => void;
  onLogout: () => void;
}): React.JSX.Element {
  const karlAddress = formatKarlAddress(props.karlEmail);

  return (
    <div className="card">
      <h1>Your account</h1>
      <p className="status">
        <span className="led" aria-hidden="true" />
        Connected — mail is landing in your Drive folder.
      </p>

      {props.error && (
        <p role="alert" className={style.error}>
          {props.error}
        </p>
      )}

      <div className="rows" style={{ marginTop: 24 }}>
        <div className="rowitem">
          <span className="k">Your address</span>
          <span className="v mono-inline">{karlAddress}</span>
        </div>
        <div className="rowitem">
          <span className="k">Your Drive folder</span>
          <span className="v">
            <a
              href="https://drive.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open in Drive ↗
            </a>
          </span>
        </div>
        <div className="rowitem">
          <span className="k">Claude Code line</span>
          <span className="v">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                props.onShowConnect();
              }}
            >
              Show it again
            </a>
          </span>
        </div>
        <div className="rowitem">
          <span className="k">Senders allowed to write to you</span>
          <span className="v">{props.userEmail}</span>
        </div>
      </div>

      <ApiTokens />

      <h2>Leaving</h2>
      <div className="danger-zone">
        <div className="rowitem">
          <span>
            <span className="v">Log out</span>
            <br />
            <span className="small">
              Stops this browser session. Your folder and every file in it stay
              exactly where they are, and stay yours.
            </span>
          </span>
          <button
            className="btn ghost"
            onClick={props.onLogout}
            disabled={props.busy}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="later-note">
        <b>There is no inbox on this page, and there never will be.</b> Reading
        happens in Claude. A web inbox would mean holding your mail to render it
        — the one thing this whole design exists to avoid.
      </div>
    </div>
  );
}

export default Account;
