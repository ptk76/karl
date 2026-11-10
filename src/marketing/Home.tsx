import React from "react";
import Base from "./Base";
import Waitlist from "./Waitlist";
import usePageMeta from "./usePageMeta";
import { SITE, refs, plain } from "./site";

// One list feeds both the visible questions and the FAQPage schema, so the
// structured data can never claim an answer the page does not show.
const FAQ = [
  {
    q: "What is dearkarl?",
    a: `<p>${SITE.description}</p>
        <p>It is open source and you can run it yourself today, free, on your own Cloudflare
        account. A hosted version is opening soon.</p>`,
  },
  {
    q: "Isn't this just the Gmail connector?",
    a: `<p>No, and the difference is the whole point. The Gmail connector needs access to your
        <em>entire mailbox</em>, and it searches — it pulls whatever it thinks is relevant.</p>
        <p>Karl only ever sees what you deliberately forwarded. It is a curated channel, not a
        search over your private mail, and it works with any provider, not just Gmail.</p>`,
  },
  {
    q: "What can Karl actually see?",
    a: `<p>One folder in your Drive — the one he created. He cannot see the rest of your
        Drive, cannot list it, and cannot open a file he did not write. The permission is
        Google's <code>drive.file</code> scope; you can look it up.</p>
        <p>He never asks for your mailbox, and no permission we request could read one.</p>`,
  },
  {
    q: "Where does my mail actually live?",
    a: `<p>In <b>your own Google Drive</b>, as plain markdown files. Our server receives the
        message, turns it into a text file, and writes it straight into the folder it made for
        you — holding it in memory for a few seconds on the way and never writing it to a disk
        of ours.</p>
        <p>If your Drive is unreachable the message bounces back to the sender rather than
        sitting in a queue on our side. There is no queue: that is the trade for us keeping
        nothing.</p>`,
  },
  {
    q: "What happens if I leave?",
    a: `<p>You keep everything. The notes are plain text files in your own Drive — no format
        of ours, no account of ours needed to read them. Turn off forwarding and it stops;
        nothing reaches back into what was already written.</p>`,
  },
  {
    q: "Does this page track me?",
    a: `<p>No. It runs no JavaScript, sets no cookies, and loads nothing from anyone else —
        not even its fonts. You can check: view the source, or read the
        <code>Content-Security-Policy</code> header, which forbids scripts outright.</p>`,
  },
  {
    q: 'Why "Karl"?',
    a: `<p>Because it tells you how to use it: <em>just email it to Karl.</em></p>
        <p>Karl is the mailman. He always delivers — and he never reads your post, never
        keeps a copy, and never writes back.</p>
        <p>That is not a personality we gave him. It is the architecture.</p>`,
  },
];

const graph = [
  {
    "@type": "SoftwareApplication",
    "@id": `${SITE.url}/#app`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any (email); Claude Code on macOS, Linux or Windows",
    license: "https://opensource.org/licenses/MIT",
    codeRepository: SITE.repo,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Self-hosted, open source" },
    publisher: { "@id": refs.org },
  },
  {
    "@type": "FAQPage",
    "@id": `${SITE.url}/#faq`,
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
  },
];

function StepIcon({ kind }: { kind: string }): React.JSX.Element {
  switch (kind) {
    case "ochre":
      return (
        <svg className="ico f-ochre" viewBox="0 0 32 32" aria-hidden="true">
          <circle className="f" cx="11" cy="16" r="6" />
          <circle cx="11" cy="16" r="2" />
          <path d="M17 16h11M24 16v4M27 16v3" />
        </svg>
      );
    case "clay":
      return (
        <svg className="ico f-clay" viewBox="0 0 32 32" aria-hidden="true">
          <rect className="f" x="4" y="8" width="24" height="17" rx="1.5" />
          <path d="m4.5 9 11.5 9 11.5-9" />
        </svg>
      );
    case "sage":
      return (
        <svg className="ico f-sage" viewBox="0 0 32 32" aria-hidden="true">
          <rect className="f" x="4" y="6" width="24" height="20" rx="1.5" />
          <path d="M4 11h24M9 16l3 2.5L9 21M15 21h6" />
        </svg>
      );
    default:
      return (
        <svg className="ico f-slate" viewBox="0 0 32 32" aria-hidden="true">
          <path className="f" d="M4 15 28 5l-6 22-7-8z" />
          <path d="m15 19 13-14M15 19v7l3.5-4" />
        </svg>
      );
  }
}

export default function Home(): React.JSX.Element {
  usePageMeta({
    title: "dearkarl — email anything to your AI",
    description:
      "Forward an email to your own secret address, and your next Claude session opens knowing it arrived. Your AI never sees your mailbox.",
    graph,
  });

  return (
    <Base
      title="dearkarl — email anything to your AI"
      description="Forward an email to your own secret address, and your next Claude session opens knowing it arrived. Your AI never sees your mailbox."
    >
      <div className="hero">
        <h1>Your AI never sees your mailbox. Only what you send it.</h1>
        <p className="lede">
          Email anything to your AI. Forward an article, a note you dictated, a
          receipt — and your next Claude session opens knowing it arrived.
        </p>
      </div>

      <div className="lead-card">
        <span className="flag-pill">Opening soon</span>
        <h2>We'll run it for you.</h2>
        <ul className="prereq">
          <li>
            <b>Sign in with Google.</b> One approval, one folder — never your mailbox.
          </li>
          <li>
            <b>You get your own address.</b> Forward anything to it, from any device.
          </li>
          <li>
            <b>Paste one line into Claude Code.</b> That is the whole install.
          </li>
        </ul>
        <Waitlist id="email-top" />
        <p className="cta-note">
          Two more questions on the next page — they decide what gets built
          first. Karl writes once, when it opens. No other mail.
        </p>
      </div>

      <div className="alt-card">
        <h3>Prefer to run it yourself? It works today.</h3>
        <p className="small">
          The whole pipe runs on your own accounts — free, unlimited, forever. No
          server of ours sits in the path, so there is nothing of ours to trust. You need a domain on
          Cloudflare (about $10 a year), a GitHub account, and about fifteen minutes with Claude Code.
        </p>
        <a className="btn ghost sm" href="https://github.com/jaal/dearkarl">
          Self-host it free →
        </a>
      </div>

      <section className="lp-sec" id="how">
        <h2>
          <span className="g" aria-hidden="true">✺</span>How it works
        </h2>
        <p className="lede">Four steps. You do the first three once, then it runs.</p>
        <ol className="walk">
          <li>
            <StepIcon kind="ochre" />
            <h4>Sign in with Google</h4>
            <p>
              One approval. Karl makes a folder in your Drive and can see that folder and nothing
              else — not the rest of your Drive, and never your mailbox.
            </p>
          </li>
          <li>
            <StepIcon kind="clay" />
            <h4>Karl hands you an address</h4>
            <p>
              Something like <code>claude-x7k2m9@in.dearkarl.com</code>. It is yours and it is
              secret. Only mail from addresses you have named gets through; everything else bounces.
            </p>
          </li>
          <li>
            <StepIcon kind="sage" />
            <h4>Paste one line into Claude Code</h4>
            <p>
              It tells Claude Code where to find your folder. Nothing is downloaded, and no token
              is ever shown to you or pasted by you.
            </p>
          </li>
          <li>
            <StepIcon kind="slate" />
            <h4>Forward anything, from anywhere</h4>
            <p>
              An article on your phone, a note you dictated walking home, a receipt. It becomes a
              text file in your Drive folder within seconds, and your next Claude session opens
              knowing it arrived.
            </p>
          </li>
        </ol>
      </section>

      <section className="lp-sec">
        <h2>
          <span className="g" aria-hidden="true">◆</span>Questions
        </h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <div className="a" dangerouslySetInnerHTML={{ __html: f.a }} />
            </details>
          ))}
        </div>
      </section>

      <section className="lp-sec" id="waitlist">
        <h2>
          <span className="g" aria-hidden="true">✉</span>Join the waiting list
        </h2>
        <p className="lede">
          Get told when the hosted version opens. No other mail, and the list is not
          shared with anyone.
        </p>
        <Waitlist id="email-bottom" label="Join" />
      </section>
    </Base>
  );
}
