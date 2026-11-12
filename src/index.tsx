import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";
import "./mvp2.css";
import "@fontsource/jost/latin-400.css";
import "@fontsource/jost/latin-500.css";
import "./marketing/paper.css";
import Home from "./marketing/Home.tsx";
import BlogIndex from "./marketing/BlogIndex.tsx";
import BlogPost from "./marketing/BlogPost.tsx";
import Privacy from "./marketing/Privacy.tsx";
import Terms from "./marketing/Terms.tsx";
import NotFound from "./marketing/NotFound.tsx";

// The hosted signup/account flow (the current app) lives at /app. The marketing
// site (ported from dearkarl.com) is the root. The OAuth callback returns to
// the configured redirect_uri with ?code=... — which today is the origin root.
// If a callback lands here (on a non-/app path), hand it to the app shell so
// the code is consumed and the user continues the signup flow.
const url = new URL(window.location.href);
if ((url.searchParams.get("code") || url.searchParams.get("error") === "access_denied") && url.pathname !== "/app") {
  const target = `/app?${url.search.slice(1)}`;
  window.location.replace(target);
}

function AppShell(props: { reconnect?: boolean }) {
  const u = new URL(window.location.href);
  return (
    <App
      code={u.searchParams.get("code")}
      refused={u.searchParams.get("error") === "access_denied"}
      reconnect={props.reconnect}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/app" element={<AppShell />} />
          {/* Linked from the "Please sign in to DearKarl again" mail. */}
          <Route path="/app/reconnect" element={<AppShell reconnect />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
);
