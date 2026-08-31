import React from "react";
import style from "./App.module.css";
import { useAppContext } from "./context/AppContext";
import { loginToGoogle, loginAndListDriveFiles } from "./auth";

function App(): React.JSX.Element {
  const { code } = useAppContext();

  const handleListDriveFiles = () => {
    loginAndListDriveFiles()
      .then((files) => console.log("Files:", files))
      .catch((err) => console.error("Error fetching Drive files:", err));
  };

  return (
    <div className={style.container}>
      Dear Karl
      <div>CODE: {code ? code : "NULL"}</div>
      <button onClick={loginToGoogle}>GOOGLE</button>
      <button onClick={handleListDriveFiles}>GOOGLE DRV read</button>
    </div>
  );
}

export default App;
