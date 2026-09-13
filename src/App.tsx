import React, { useEffect, useState } from "react";
import style from "./App.module.css";

import { PayloadType } from "../worker";

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
    setEmail("");
    setLogin("");
    navigateTo("/");
  };

  const getLoginUrl = async () => {
    const body: PayloadType = {
      type: "LOGIN",
    };
    try {
      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as PayloadType;
      console.info("PAYLOAD", payload);
      if (payload.type === "LOGIN") setLoginUrl(payload.url ?? "");
      else setLoginUrl("");
    } catch (error) {
      console.warn(error);
      setLoginUrl("");
    }
  };

  const requestToken = async (code: string) => {
    const body: PayloadType = {
      type: "CODE",
      code: code,
    };
    try {
      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (response.status === 404) {
        navigateTo("/");
      }
      const payload = (await response.json()) as PayloadType;
      console.info("PAYLOAD", payload);
      setEmail(payload.email ?? "");
      setLogin(payload.login ?? "");
    } catch (error) {
      console.warn(error);
    }
  };

  useEffect(() => {
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
    </div>
  );
}

export default App;
