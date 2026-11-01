import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";
import "./mvp2.css";

const url = new URL(location.href);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App code={url.searchParams.get("code")} />
    </AppProvider>
  </StrictMode>,
);
