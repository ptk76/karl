import React from "react";
import style from "./App.module.css";
import { useAppContext } from "./context/AppContext";
import {
  loginToGoogle,
  loginAndListDriveFiles,
  getAccessToken,
} from "../worker/auth";

function App(): React.JSX.Element {
  const { code, initToken } = useAppContext();

  const handleListDriveFiles = () => {
    loginAndListDriveFiles()
      .then((files) => console.log("Files:", files))
      .catch((err) => console.error("Error fetching Drive files:", err));
  };

  const handleGetToken = async () => {
    await initToken();
    // console.info(
    //   "TOKEN:",
    //   await getAccessToken().catch((e) => console.info("ERR:", e)),
    // );
  };

  return (
    <div className={style.container}>
      Dear Karl
      <div>CODE: {code ? code : "NULL"}</div>
      <button onClick={loginToGoogle}>GOOGLE</button>
      <button onClick={handleListDriveFiles}>GOOGLE DRV read</button>
      <button onClick={handleGetToken}>GOOGLE TOKEN</button>
    </div>
  );
}

export default App;
