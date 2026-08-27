import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";

document.body.style.margin = "0px";
document.body.style.fontFamily =
  "system-ui, Avenir, Helvetica, Arial, sans-serif";
document.body.style.userSelect = "none";
document.body.style.backgroundColor = "black";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
