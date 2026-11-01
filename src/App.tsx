import React, { useEffect, useState } from "react";
import style from "./App.module.css";
import { getActiveSession, getLoginUrl, logout, requestToken } from "./server";
import { ApiTokens } from "./ApiTokens";
import Connect from "./Connect";
import { formatKarlAddress } from "./address";

function navigateTo(url: string) {
  window.location.href = url;
}

// Remembers, for this browser session, whether the user has already been
// through the connect step. A fresh sign-in shows it; a returning reload skips
// straight to the account page.
const STAGE_KEY = "dk_flow_stage";

function readStage(): "connect" | "account" {
  try {
    return sessionStorage.getItem(STAGE_KEY) === "account"
      ? "account"
      : "connect";
  } catch {
    return "connect";
  }
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ContinueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 12h-8" />
    </svg>
  );
}

function App(props: { code: string | null }): React.JSX.Element {
  const [activeSession, setActiveSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [karlEmail, setKarlEmail] = useState("");
  const [error, setError] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [stage, setStage] = useState<"connect" | "account">(readStage);

  const goToAccount = () => {
    setStage("account");
    try {
      sessionStorage.setItem(STAGE_KEY, "account");
    } catch {
      // Storage unavailable; the stage still switches for this session.
    }
  };

  const loginGoogle = async () => {
    setError("");
    setBusy(true);

    const loginUrl = await getLoginUrl();
    if (!loginUrl) {
      setError("Could not reach Dear Karl. Check your connection and retry.");
      setBusy(false);
      return;
    }
    navigateTo(loginUrl.url);
    setBusy(false);
  };

  const logoutGoogle = async () => {
    setBusy(true);
    try {
      sessionStorage.removeItem(STAGE_KEY);
    } catch {
      // Storage unavailable; nothing to clear.
    }
    await logout();
    navigateTo("/");
  };

  const initToken = async (code: string) => {
    setError("");
    setBusy(true);

    window.history.replaceState({}, "", "/");
    await requestToken(code);
    setBusy(false);
    navigateTo("/");
  };

  const init = async () => {
    setBusy(true);
    const session = await getActiveSession();
    if (session) {
      setActiveSession(true);
      setUserEmail(session.userEmail);
      setKarlEmail(session.karlEmail);
    } else {
      setActiveSession(false);
      setUserEmail("");
      setKarlEmail("");
    }
    setBusy(false);
    setLoading(false);
  };

  useEffect(() => {
    setError("");

    if (props.code) {
      initToken(props.code);
    } else {
      init();
    }
    return () => {};
  }, []);

  return (
    <>
      <header className="site-head">
        <a className="brand" href="/">
          <span className="mark">📬</span> dearkarl
        </a>
        <span className="badge">
          {activeSession ? "Signed in" : "Hosted · free while it's new"}
        </span>
      </header>

      <main>
        {loading ? (
          <p className="small">Loading…</p>
        ) : !activeSession ? (
          <>
            <nav className="steps" aria-label="Progress">
              <ol>
                <li className="on">
                  <span className="n">1</span>
                  <span>Sign in</span>
                </li>
                <li className="sep" aria-hidden="true" />
                <li>
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
              <p className="eyebrow">Step 1 of 3</p>
              <h1>Sign in with Google</h1>
              <p className="lede">
                One approval covers everything. Karl uses it to write mail into a
                folder he makes in your Drive, and to read that folder back to
                Claude. There is no second login.
              </p>

              <ul className="fence">
                <li>
                  <span className="ic yes">
                    <CheckIcon />
                  </span>
                  <span>
                    Karl can see: <b>one folder, the one he creates.</b>
                  </span>
                </li>
                <li>
                  <span className="ic no">
                    <XIcon />
                  </span>
                  <span>
                    Karl cannot see: <b>the rest of your Drive.</b>
                  </span>
                </li>
                <li>
                  <span className="ic">
                    <LockIcon />
                  </span>
                  <span>
                    Karl never asks for: <b>your mailbox.</b>
                  </span>
                </li>
              </ul>

              <label className="optin">
                <input
                  type="checkbox"
                  name="newsletter"
                  value="1"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span className="optin-t">
                  Send me build notes, now and then.
                  <span className="optin-d">
                    Occasional email about what changed. Nothing to do with
                    running the product, and one click gets you off the list.
                    Leave it unticked and we never write your address down.
                  </span>
                </span>
              </label>

              {error && (
                <p role="alert" className={style.error}>
                  {error}
                </p>
              )}

              <div className="btn-row">
                <button className="btn" onClick={loginGoogle} disabled={busy}>
                  <ContinueIcon />
                  Continue with Google
                </button>
              </div>
              <p className="small" style={{ marginTop: 16 }}>
                Scope <code>drive.file</code> — the one that lets an app touch
                only the files it created. You can cut this off from your Google
                account, or from your account page, at any time.
              </p>

              <div className="later-note">
                <b>More ways to sign in, later.</b> Apple, and email with a
                password. Google is the only one at launch because the Drive
                folder needs a Google account anyway — a second sign-in method
                would be a second account to reconcile with the same Drive.
              </div>
            </div>
          </>
        ) : stage === "connect" ? (
          <Connect
            karlEmail={karlEmail}
            userEmail={userEmail}
            onDone={goToAccount}
          />
        ) : (
          <div className="card narrow">
            <h1>Your account</h1>
            <p className="status">
              <span className="led" aria-hidden="true" />
              Connected — mail is landing in your Drive folder.
            </p>

            <div className="rows" style={{ marginTop: 24 }}>
              <div className="rowitem">
                <span className="k">Signed in as</span>
                <span className="v">{userEmail}</span>
              </div>
              <div className="rowitem">
                <span className="k">Your Karl address</span>
                <span className="v mono-inline">
                  {formatKarlAddress(karlEmail)}
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className={style.error}>
                {error}
              </p>
            )}

            <div className="btn-row">
              <button className="btn ghost" onClick={logoutGoogle} disabled={busy}>
                Log out
              </button>
            </div>

            <ApiTokens />
          </div>
        )}
      </main>

      <footer className="site-foot">
        <span>Your mail lands in your Drive, not ours.</span>
        <span>
          <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a>
        </span>
      </footer>
    </>
  );
}

export default App;
