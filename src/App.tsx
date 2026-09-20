import React, { useEffect, useState } from "react";
import style from "./App.module.css";

import {
  RequestPayload,
  ResponsePayload,
  isRequestPayloadLogin,
  isRequestPayloadCode,
  isRequestPayloadActive,
  isResponsePayloadLogin,
  isResponsePayloadProfile,
} from "../worker/payload-types";
import { resume } from "react-dom/server";

function navigateTo(url: string) {
  window.location.href = url;
}

function App(props: { code: string | null }): React.JSX.Element {
  const [loginUrl, setLoginUrl] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState(false);

  const listFiles = async (token: string | null) => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v2/files?access_token=${token}`,
    );
    console.info("RESP", response, await response.json());
  };

  const loginGoogle = async () => {
    if (loginUrl === "") return;
    navigateTo(loginUrl);
  };
  const logoutGoogle = async () => {
    localStorage.removeItem("current_user");
    setEmail("");
    setLogin(false);
    navigateTo("/");
  };

  const getLoginUrl = async () => {
    const body: RequestPayload = {
      type: "LOGIN",
    };
    try {
      const response = await fetch("/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ResponsePayload;
      console.info("PAYLOAD", payload);
      if (isResponsePayloadLogin(payload)) setLoginUrl(payload.url);
      else setLoginUrl("");
    } catch (error) {
      console.warn(error);
      setLoginUrl("");
    }
  };

  const requestToken = async (code: string) => {
    const body: RequestPayload = {
      type: "CODE",
      code,
    };
    try {
      const response = await fetch("/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (response.status === 404) {
        navigateTo("/");
      }
      const payload = (await response.json()) as ResponsePayload;
      console.info("PAYLOAD", payload);
      if (isResponsePayloadProfile(payload)) {
        localStorage.setItem("current_user", payload.email);
        setEmail(payload.email);
        setLogin(payload.login === "true");
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const isUserLoggedIn = async (email: string) => {
    const body: RequestPayload = {
      type: "ACTIVE",
      email,
    };
    const response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as any;
    console.info("USER", email, result, result.loggedIn);
    setLogin(result.loggedIn);
    return result.loggedIn;
  };

  const refreshToken = async (email: string) => {
    const body: RequestPayload = {
      type: "REFRESH",
      email,
    };
    const response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.info("USER", email, await response.text());
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
    const currentUser = localStorage.getItem("current_user");
    if (currentUser) setEmail(currentUser);
    if (props.code) {
      console.info("GET TOKEN");
      requestToken(props.code);
      // navigateTo("/");
    } else {
      getLoginUrl();
    }
    return () => {};
  }, []);

  return (
    <div className={style.container}>
      {email !== "" && (
        <>
          <div>EMAIL: {email}</div>
          <div>LOGGED IN: {login ? "TRUE" : "FALSE"}</div>
          {/* <div>Karl EMAIL{login}@karl.przemekkudla.pl</div> */}
        </>
      )}
      {email === "" && loginUrl && (
        <button onClick={loginGoogle}>Log in Google</button>
      )}
      {email !== "" && <button onClick={logoutGoogle}>Log out {email}</button>}
      <button onClick={() => isUserLoggedIn(email)}>Is User Logged in?</button>
      <button onClick={() => refreshToken(email)}>Refresh token</button>

      <div>
        <button onClick={test}>TEST</button>
      </div>
    </div>
  );
}

export default App;
