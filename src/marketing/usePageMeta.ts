import { useEffect } from "react";
import { siteGraph } from "./site";

// In the SPA the HTML shell (index.html) is served for every route, so the
// <title>, <meta name="description"> and JSON-LD block have to be set per page
// in the browser. This hook does that, and restores nothing on unmount — the
// next navigation overwrites it. Mirrors what Base.astro did server-side.

interface PageMeta {
  title: string;
  description: string;
  /** Extra schema.org nodes for this page, merged with Organization + WebSite. */
  graph?: object[];
}

let jsonLdEl: HTMLScriptElement | null = null;

function ensureMeta(name: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export default function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    document.title = meta.title;
    ensureMeta("description", meta.description);

    const graph = [...siteGraph(), ...(meta.graph ?? [])];
    const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");

    if (!jsonLdEl) {
      jsonLdEl = document.createElement("script");
      jsonLdEl.type = "application/ld+json";
      document.head.appendChild(jsonLdEl);
    }
    jsonLdEl.textContent = json;
  }, [meta.title, meta.description, meta.graph]);
}
