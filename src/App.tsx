import React, { useEffect, useState } from "react";
import style from "./App.module.css";

import {
  RequestPayload,
  ResponsePayload,
  isResponsePayloadLogin,
  isResponsePayloadProfile,
} from "../worker/payload-types";

function navigateTo(url: string) {
  window.location.href = url;
}

/** localStorage throws in private modes and with site data blocked. */
const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore — the session still works, it just will not be remembered */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

async function postToLogin(body: RequestPayload): Promise<ResponsePayload> {
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as ResponsePayload;
}

function App(props: { code: string | null }): React.JSX.Element {
  const [loginUrl, setLoginUrl] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loginGoogle = async () => {
    if (loginUrl === "") return;
    navigateTo(loginUrl);
  };
  const logoutGoogle = async () => {
    storage.remove("current_user");
    setEmail("");
    setLogin(false);
    navigateTo("/");
  };

  const getLoginUrl = async () => {
    setError("");

    try {
      const payload = await postToLogin({ type: "LOGIN" });
      if (isResponsePayloadLogin(payload)) setLoginUrl(payload.url);
      else throw new Error("Unexpected response from the server");
    } catch (error) {
      setLoginUrl("");
      setError("Could not reach Dear Karl. Check your connection and retry.");
    }
  };

  const requestToken = async (code: string) => {
    setError("");
    setBusy(true);

    try {
      const payload = await postToLogin({ type: "CODE", code });
      if (isResponsePayloadProfile(payload)) {
        storage.set("current_user", payload.email);
        setEmail(payload.email);
        setLogin(await isUserLoggedIn(payload.email));
      } else {
        throw new Error("Unexpected response from the server");
      }
    } catch {
      setError("Signing in failed. Please try again.");
      await getLoginUrl();
    } finally {
      setBusy(false);
      // Keep the authorization code out of the address bar and history.
      window.history.replaceState({}, "", "/");
    }
  };

  const isUserLoggedIn = async (address: string): Promise<boolean> => {
    if (!address) return false;
    try {
      const result = (await postToLogin({
        type: "ACTIVE",
        email: address,
      })) as ResponsePayload & { loggedIn?: boolean };
      const loggedIn = Boolean(result.loggedIn);
      setLogin(loggedIn);
      return loggedIn;
    } catch {
      setError("Could not check your session status.");
      return false;
    }
  };

  const refreshToken = async (address: string) => {
    if (!address) return;
    setError("");
    setBusy(true);
    try {
      const result = (await postToLogin({
        type: "REFRESH",
        email: address,
      })) as ResponsePayload & { loggedIn?: boolean };
      setLogin(Boolean(result.loggedIn));
      if (!result.loggedIn) setError("Could not refresh your session.");
    } catch {
      setError("Could not refresh your session.");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    const body: RequestPayload = {
      type: "TEST",
      email,
    };
    const response = await fetch("/test", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.info("USER", email, await response.text());
  };

  useEffect(() => {
    const currentUser = storage.get("current_user");
    if (currentUser) {
      setEmail(currentUser);
      isUserLoggedIn(currentUser);
    }
    if (props.code) {
      requestToken(props.code);
    } else {
      getLoginUrl();
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
      {email !== "" && (
        <>
          <p>
            Signed in as <strong>{email}</strong> —{" "}
            {login ? "session active" : "session expired"}
          </p>
          <button onClick={logoutGoogle}>Log out</button>
          <button onClick={() => refreshToken(email)} disabled={busy}>
            {busy ? "Working…" : "Refresh session"}
          </button>
        </>
      )}
      {email === "" && loginUrl && (
        <button onClick={loginGoogle}>Log in with Google</button>
      )}
      {email === "" && !loginUrl && !error && <p>Loading…</p>}

      {email === "" && error && (
        <button onClick={getLoginUrl}>Try again</button>
      )}

      <div>
        <button onClick={test}>TEST</button>
      </div>
    </div>
  );
}

export default App;
