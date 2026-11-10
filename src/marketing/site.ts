// Facts about the site and who runs it, in one place, so the visible footer,
// the structured data and the feeds can never disagree with each other.
// Ported from dearkarl.com/src/site.ts.

export const SITE = {
  name: "dearkarl",
  url: "https://dearkarl.com",
  tagline: "Email anything to your AI",
  // The definitional sentence: what dearkarl is, said once, the same way
  // everywhere (meta description, Organization schema, llms.txt). Answer
  // engines quote sentences like this one; keep it literal and checkable.
  description:
    "dearkarl is an email-to-AI pipe: forward any email to your own secret address and it lands as a plain markdown file your next Claude Code session can read. It never asks for your mailbox.",
  lang: "en",
  repo: "https://github.com/jaal/dearkarl",
  contact: "hi@dearkarl.com",
};

export const OPERATOR = {
  legalName: "Technologie 21 Aleksander Jaworski",
  city: "Wrocław",
  country: "PL",
};

export const AUTHOR = {
  name: "Olek Jaworski",
  url: "https://olekwrites.com",
};

const ORG_ID = `${SITE.url}/#org`;
const SITE_ID = `${SITE.url}/#website`;

/** Organization + WebSite, emitted on every page so each one stands alone. */
export function siteGraph() {
  return [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      email: SITE.contact,
      legalName: OPERATOR.legalName,
      address: { "@type": "PostalAddress", addressLocality: OPERATOR.city, addressCountry: OPERATOR.country },
      sameAs: [SITE.repo],
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      name: SITE.name,
      url: SITE.url,
      inLanguage: SITE.lang,
      publisher: { "@id": ORG_ID },
    },
  ];
}

export const refs = { org: ORG_ID, site: SITE_ID };

/** Plain text from a small HTML fragment, for schema fields that must not carry markup. */
export function plain(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
