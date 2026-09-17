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

function navigateTo(url: string) {
  window.location.href = url;
}

function App(props: { code: string | null }): React.JSX.Element {
  const [loginUrl, setLoginUrl] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");

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
    setLogin("");
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
        setLogin(payload.login);
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
    console.info("USER", email, await response.text());
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
        <div>
          Hello {email}, your Karl is {login}@karl.przemekkudla.pl
        </div>
      )}
      {email === "" && loginUrl && (
        <button onClick={loginGoogle}>Log in Google</button>
      )}
      {email !== "" && <button onClick={logoutGoogle}>Log out {email}</button>}
      <button onClick={() => isUserLoggedIn(email)}>Is User Logged in?</button>
      <button onClick={() => refreshToken(email)}>Refresh token</button>
    </div>
  );
}

export default App;
