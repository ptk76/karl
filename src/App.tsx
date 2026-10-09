import React, { useEffect, useState } from "react";
import style from "./App.module.css";
import { getActiveSession, getLoginUrl, logout, requestToken } from "./server";
import { ApiTokens } from "./ApiTokens";
import { isLoginReturnPath } from "../shared/api";

function navigateTo(url: string) {
  window.location.href = url;
}

// An MCP client's /authorize page sends signed-out users here with
// `?next=/authorize?…`. The path is kept across the Google round trip, which
// lands back on "/" with only `?code=`, then followed once after login.
// Storage can be unavailable (private mode); then the user just stays here.
const LOGIN_RETURN_KEY = "karl.loginReturn";

function rememberLoginReturn(path: string) {
  try {
    sessionStorage.setItem(LOGIN_RETURN_KEY, path);
  } catch {}
}

function takeLoginReturn(): string | null {
  try {
    const path = sessionStorage.getItem(LOGIN_RETURN_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_KEY);
    return isLoginReturnPath(path) ? path : null;
  } catch {
    return null;
  }
}

function App(props: {
  code: string | null;
  loginReturn?: string | null;
}): React.JSX.Element {
  const [activeSession, setActiveSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [karlEmail, setKarlEmail] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const loginGoogle = async () => {
    setError("");
    setBusy(true);

    setError("");
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
    await logout();
    navigateTo("/");
  };

  const initToken = async (code: string) => {
    setError("");
    setBusy(true);

    window.history.replaceState({}, "", "/");
    await requestToken(code);
    setBusy(false);
    navigateTo(takeLoginReturn() ?? "/");
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
  };

  useEffect(() => {
    setError("");

    if (isLoginReturnPath(props.loginReturn ?? null)) {
      rememberLoginReturn(props.loginReturn!);
      setConnecting(true);
      window.history.replaceState({}, "", "/");
    }

    if (props.code) {
      initToken(props.code);
    } else {
      init();
    }
    return () => {};
  }, []);

  return (
    <div className={style.container}>
      <h1>Dear Karl</h1>
      <p>
        Forward an email to Karl and it is saved as a file in your Google Drive,
        in a folder called <code>dearkarl</code>.
      </p>

      {error && (
        <p role="alert" className={style.error}>
          {error}
        </p>
      )}
      {activeSession && (
        <>
          <p>
            Signed in as <strong>{userEmail}</strong>
            <br />
            Your Karl email: <strong>{karlEmail}@przemekkudla.pl</strong>
          </p>
          <button onClick={logoutGoogle}>Log out</button>
          <ApiTokens />
        </>
      )}
      {!activeSession && connecting && (
        <p>Log in to finish connecting your AI app to Dear Karl.</p>
      )}
      {!activeSession && (
        <button onClick={loginGoogle}>Log in with Google</button>
      )}
      {busy && <p>Loading…</p>}

      {!activeSession && error && (
        <button onClick={loginGoogle}>Try again</button>
      )}
    </div>
  );
}

export default App;
