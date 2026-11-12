import React, { useEffect, useState } from "react";
import style from "./App.module.css";
import { getActiveSession, getLoginUrl, logout, requestToken } from "./server";
import Account from "./Account";
import Address from "./Address";
import Connect from "./Connect";
import Destination from "./Destination";
import SignInRefused from "./SignInRefused";
import Reconnect from "./Reconnect";

function navigateTo(url: string) {
  window.location.href = url;
}

// Where a signed-in user lands. Onboarding (destination → address → connect)
// runs only right after the sign-in that created the account; everyone else —
// a returning user, a new tab, a reconnect — goes straight to the account page.
const STAGE_KEY = "dk_flow_stage";
// Set when the user starts a reconnect from /app/reconnect, so the account page
// can confirm that Drive access is back once Google sends them home.
const RECONNECT_KEY = "dk_reconnecting";

type Stage = "destination" | "address" | "connect" | "account";

function readStage(): Stage {
  try {
    return sessionStorage.getItem(STAGE_KEY) === "destination" ? "destination" : "account";
  } catch {
    return "account";
  }
}

function writeSession(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable; the app still works for this page view.
  }
}

/** Reads and clears the one-shot "just reconnected" flag. */
function takeReconnected(): boolean {
  try {
    const v = sessionStorage.getItem(RECONNECT_KEY) === "1";
    sessionStorage.removeItem(RECONNECT_KEY);
    return v;
  } catch {
    return false;
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

function App(props: {
  code: string | null;
  /** True when Google redirected back with an OAuth error, i.e. the user
      declined the consent (access_denied) rather than granting it. */
  refused?: boolean;
  /** /app/reconnect: Karl lost access to the user's Drive and they came from
      the "sign in again" mail to renew it. */
  reconnect?: boolean;
}): React.JSX.Element {
  const [activeSession, setActiveSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [karlEmail, setKarlEmail] = useState("");
  const [error, setError] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [stage, setStage] = useState<Stage>(readStage);
  const [reconnected, setReconnected] = useState(false);

  const goToAccount = () => {
    setStage("account");
    writeSession(STAGE_KEY, "account");
  };

  const loginGoogle = async () => {
    setError("");
    setBusy(true);
    if (props.reconnect) writeSession(RECONNECT_KEY, "1");

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
    writeSession(STAGE_KEY, null);
    await logout();
    navigateTo("/app");
  };

  const initToken = async (code: string) => {
    setError("");
    setBusy(true);

    window.history.replaceState({}, "", "/app");
    const profile = await requestToken(code);
    // A brand-new account runs onboarding; an existing one (including a
    // reconnect) goes to the account page.
    writeSession(STAGE_KEY, profile?.isNewUser ? "destination" : "account");
    setBusy(false);
    navigateTo("/app");
  };

  const init = async () => {
    setBusy(true);
    const session = await getActiveSession();
    if (session) {
      setActiveSession(true);
      setUserEmail(session.userEmail);
      setKarlEmail(session.karlEmail);
      setReconnected(takeReconnected());
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
        {props.reconnect ? (
          <Reconnect
            userEmail={userEmail}
            error={error}
            busy={busy}
            onReconnect={loginGoogle}
          />
        ) : loading ? (
          <p className="small">Loading…</p>
        ) : !activeSession ? (
          props.refused ? (
            <SignInRefused onRetry={() => navigateTo("/app")} />
          ) : (
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
          )
        ) : stage === "destination" ? (
          <Destination onNext={() => setStage("address")} />
        ) : stage === "address" ? (
          <Address
            karlEmail={karlEmail}
            userEmail={userEmail}
            onNext={() => setStage("connect")}
          />
        ) : stage === "connect" ? (
          <Connect
            karlEmail={karlEmail}
            userEmail={userEmail}
            onDone={goToAccount}
          />
        ) : (
          <Account
            karlEmail={karlEmail}
            userEmail={userEmail}
            reconnected={reconnected}
            error={error}
            busy={busy}
            onShowConnect={() => setStage("connect")}
            onLogout={logoutGoogle}
          />
        )}
      </main>

      <footer className="site-foot">
        <span>Your mail lands in your Drive, not ours.</span>
        <span>
          <a href="/app">Sign in</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </span>
      </footer>
    </>
  );
}

export default App;
