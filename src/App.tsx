import React, { useEffect, useState } from "react";
import style from "./App.module.css";
import { getActiveSession, getLoginUrl, logout, requestToken } from "./server";

function navigateTo(url: string) {
  window.location.href = url;
}

function App(props: { code: string | null }): React.JSX.Element {
  const [activeSession, setActiveSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [karlEmail, setKarlEmail] = useState("");
  const [error, setError] = useState("");

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
          </p>
          <p>
            Your Karl email: <strong>{karlEmail}</strong>
          </p>
          <button onClick={logoutGoogle}>Log out</button>
        </>
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
