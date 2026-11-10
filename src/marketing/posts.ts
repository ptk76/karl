// The blog collection, ported from dearkarl.com's src/content/blog/*.md.
// In the SPA we keep the posts as typed data (title, slug, question, answer,
// body and frontmatter fields) rather than pulling in Astro's content
// pipeline. The body is raw markdown, rendered by react-markdown.

export interface BlogPost {
  title: string;
  slug: string;
  description: string;
  question: string;
  answer: string;
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  tags: string[];
  faq: { q: string; a: string }[];
  draft: boolean;
  body: string;
}

export const POSTS: BlogPost[] = [
  {
    title: "What can an AI learn about you from your email?",
    slug: "what-ai-knows-from-your-email",
    description:
      "An AI assistant with access to one Gmail account needed eight searches to map a life. What it found, why it matters, and how to share less.",
    question: "What can an AI assistant learn about you from your email?",
    answer:
      "Almost everything. In an October 2026 test, an AI assistant connected to one person's Gmail and Google Drive needed eight searches, and no attachments, to summarise their identity, family, work, home, money and health. The larger risk is access, not knowledge: sign-in links, unlock codes and a connector that can send mail. If an AI only needs some emails, forward those instead.",
    published: "2026-10-01",
    updated: "2026-10-25",
    tags: ["email", "privacy", "claude-code"],
    faq: [
      {
        q: "Is it safe to connect my Gmail to an AI assistant?",
        a: "It is as safe as giving a capable stranger read access to your whole inbox. Connect it when you want the AI to search your mail; if you only want it to see specific emails, forward those somewhere narrower.",
      },
      {
        q: "Can an email take control of my AI assistant?",
        a: "It can try. Text in an email can be written to steer an AI that reads it, which is called prompt injection. A tool that reads mail should treat every message as data, never as instructions.",
      },
      {
        q: "Does dearkarl read my inbox?",
        a: "No. dearkarl never asks for mailbox access. It only receives the emails you forward to your own secret address.",
      },
    ],
    draft: false,
    body: `Many people connect an AI assistant to their mailbox for one practical reason: to find an invoice, a booking or a message without searching by hand. Few ask what else the assistant can see once it is connected.

In October 2026 we ran a simple test on one real personal account, with its owner's consent. An AI assistant was connected to Gmail and Google Drive and given one task: find out as much about the account owner as you can. The result is not published. Below is what it covered, a fictional example built the same way, and what it means for anyone who wants an AI to read their email.

## What did the AI find?

**A summary of a whole life, mostly from routine mail.** Identity, family, work, home, money and health. Most of it came from shipping notifications, booking confirmations, newsletters and forms from offices.

The test, in numbers:

- **8** searches
- **0** attachments opened
- **6** areas of life covered: identity, family, work, home, money, health
- **2** sources only: the mail and Drive connectors, no memory of earlier chats

## Why is an inbox so revealing?

**Because one email is harmless and many emails are a biography.** Each message on its own said little. Read together, they formed a timeline the owner had never written down anywhere: two routine messages from different months, side by side, revealed a change in their life they had not told anyone in writing.

## What does that look like for a real person?

Here is a **fictional** person, built from the kinds of finding the test produced. Marta, 34, a freelance designer:

| What the AI saw | Where it came from | What it inferred |
|---|---|---|
| Home address with flat number | Four delivery notifications | Where she lives |
| ID number in plain text | An invoice template on Drive | Date of birth, which opens her bank PDFs |
| Two interviews, a CV edited last week | Calendar invites, Drive | She is leaving her clients, and they don't know |
| Three flat viewings 300 km away | Booking confirmations | She is moving, and nobody was told |

Marta is invented. Her clients, her mother and her partner write to her too, and none of them agreed to an AI reading their messages.

## What is the bigger risk: what the AI knows, or what it can do?

**What it can do.** The most serious findings were not facts but access:

1. **Sign-in links** still sitting in the inbox. An assistant that can read and follow them can act as the account owner.
2. **Unlock codes in plain sight.** A password-protected PDF is not protected when the password is in the same mailbox.
3. **Other people's data,** from clients to family, which the account owner has no right to hand over.
4. **A connector that can write.** As of October 2026, the [Gmail connector](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors) can draft and send mail, asking for approval first. Once an AI can act, anyone who can email you can try to steer it with a message. This is called [prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).

## How often does an AI actually need the whole inbox?

**Rarely.** Most everyday requests are about a single message: a flight confirmation, a note from a client, a document someone sent. Full mailbox access is the right tool when you want the AI to search across everything. For one email at a time, it gives the assistant far more than the task requires.

## How do you share one email without sharing the inbox?

**Forward only the email you mean to share.** That is what dearkarl does. dearkarl is an email-to-AI pipe: forward any email to your own secret address and it lands as a plain markdown file your next Claude Code session can read.

- **It never asks for your mailbox.** It only sees what you forwarded.
- **The address is a secret,** and a sender allowlist in the Worker bounces everyone else. The allowlist checks the address a message claims; a [DMARC check](https://github.com/jaal/dearkarl#the-allowlist-alone-proves-nothing) verifies it came from that domain, and logs its verdict until you set it to block.
- **Mail is stored as data, never as instructions,** inside a fence the AI is told not to obey.
- **You host it yourself:** your domain on Cloudflare (a subdomain works), your private GitHub repo. MIT licensed, about 15 minutes to install with Claude Code.

The code is on [GitHub](https://github.com/jaal/dearkarl). A hosted version, with no domain needed, is not open yet; the waitlist is on [dearkarl.com](https://dearkarl.com).

## How can you check your own setup?

**Run the same test, and keep the result to yourself.** If an AI assistant is already connected to your mail:

1. **Ask it what it knows about you.** Read the answer in the chat. Don't save it to a file, and don't run the test on anyone else's account.
2. **Check what the connector can do,** not only what it can see. Can it draft or send mail as you?
3. **Ask how often you need all of it.** If the answer is "one email at a time", share one email at a time.`,
  },
  {
    title: "Can you forward emails to Claude?",
    slug: "forward-emails-to-claude",
    description:
      "Claude has no inbound email address. Here are the four ways to get an email in front of it, what each one can see, and when to use which.",
    question: "Is there a way to forward emails to Claude?",
    answer:
      "Not directly: as of October 2026, Claude has no email address you can forward to. You can connect your whole Gmail or Microsoft 365 mailbox, build a pipeline with Zapier or your own code, or use dearkarl, an open-source pipe that gives you a secret address and turns each forwarded email into a markdown file your next Claude Code session reads.",
    published: "2026-10-11",
    updated: "2026-10-11",
    tags: ["claude-code", "email", "how-to"],
    faq: [
      {
        q: "Does Claude have an email address?",
        a: "No. As of October 2026 Anthropic does not offer an inbound address for Claude. To get an email to Claude you either connect a mailbox, paste it in, or route it through a tool that turns mail into something Claude can read.",
      },
      {
        q: "Can Claude read my Gmail?",
        a: "Yes, through the Gmail connector, which is available on every Claude plan. Once connected it can search and read your whole mailbox, and draft, send, reply to and forward mail, asking your approval first by default. If Claude only needs a few specific emails, forwarding them gives it those and nothing else.",
      },
      {
        q: "Is it safe to forward emails to an AI?",
        a: "Treat forwarded mail as data, not instructions: an email can contain text written to steer an AI. Forward only what you chose, keep a sender allowlist on the receiving address, and review anything the AI wants to send or change.",
      },
    ],
    draft: true,
    body: `When I want Claude to know about an email, I do not want to give it my inbox. I want to hand it one message, the way you would hand someone a letter. It turns out that is the one thing Claude does not offer, so here is what does exist.

## Why is there no "forward to Claude" address?

Claude reads email through **connectors**: you link an account, and Claude searches it when you ask. That is a different model from forwarding. A connector sees the [whole mailbox](/blog/what-ai-knows-from-your-email), and the Gmail one can also send from it. Forwarding means you choose each message.

As of October 2026 there is no address at Anthropic you can send mail to. Every "forward to Claude" setup you will find builds that address somewhere else.

## Four ways to get an email in front of Claude

| Option | What Claude can see | Setup | Best when |
|---|---|---|---|
| [Gmail connector](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors) | Your whole Gmail mailbox: it searches and reads it, and can draft, send and forward (asking first, by default) | A few clicks, on any plan | You want Claude to search and work in your mail |
| [Microsoft 365 connector](https://support.claude.com/en/articles/15183774-connect-to-microsoft-365) | A work Outlook mailbox; personal Outlook.com accounts are not supported | An admin sets it up first; sending only if the admin turns it on | You are on a company Microsoft account |
| An automation ([Zapier Email Parser](https://help.zapier.com/hc/en-us/articles/8496306000269-Set-up-your-Email-Parser-account-in-Zapier), Make, your own script) | Whatever you route into it | An hour or more; free up to 100 tasks a month, then a [paid plan](https://zapier.com/pricing) | You want Claude to reply or act on each email automatically |
| [dearkarl](https://github.com/jaal/dearkarl) | Only the emails you forward | About 15 minutes with Claude Code | You want to hand Claude single emails as context, from any device |

Copy and paste still works, and for one email it is the fastest. It stops working when the email is on your phone and Claude Code is open on your laptop.

## How does forwarding with dearkarl work?

dearkarl is an email-to-AI pipe: forward any email to your own secret address and it lands as a plain markdown file your next Claude Code session can read. It never asks for your mailbox.

The self-hosted version runs on your own domain on Cloudflare, where [Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/) is free and a subdomain works, and writes to a private GitHub repo you own. There is no server of ours in between. Setup takes about fifteen minutes: paste the [repo](https://github.com/jaal/dearkarl) URL into Claude Code and say *"install this"*. Only addresses on your allowlist get through. A [DMARC check](https://github.com/jaal/dearkarl#the-allowlist-alone-proves-nothing) that the mail really came from that domain logs its verdict by default, and one setting makes it block.

The pipe step by step, next to a connector, is in [Gmail connector or forwarding](/blog/email-connectors-vs-dearkarl). A hosted version, where you sign in instead of deploying, is not open yet. There is a waiting list below.

## Which one should you use?

- **To search everything:** the Gmail or Microsoft 365 connector.
- **To act on each email automatically:** Zapier or your own code, with a human check before anything is sent.
- **To hand Claude one email at a time, without opening your mailbox:** forward it with dearkarl.`,
  },
  {
    title: "Gmail connector or forwarding: how should Claude Code read email?",
    slug: "email-connectors-vs-dearkarl",
    description:
      "A Gmail connector opens your mailbox to the AI; forwarding hands it one email. A side-by-side comparison, and when each one is the better choice.",
    question: "Should I connect my Gmail to Claude Code or forward emails instead?",
    answer:
      "They solve different problems. A mail connector, such as Claude's Gmail connector, lets the AI search your whole mailbox and, with your approval, send mail. dearkarl is an email-to-AI pipe: you forward only the emails you choose to a secret address, and they land as markdown files your next Claude Code session reads. Use a connector to search; forward to hand over one email.",
    published: "2026-10-24",
    updated: "2026-10-24",
    tags: ["email", "claude-code", "comparison"],
    faq: [
      {
        q: "Does the Gmail connector work in Claude Code?",
        a: "Yes, if you sign in to Claude Code with a claude.ai account. Connectors you added in claude.ai show up in Claude Code automatically, and you can turn one off per project with /mcp.",
      },
      {
        q: "Can the Gmail connector read attachments?",
        a: "Not their content. As of October 2026 it sees attachment metadata only, such as the file name. dearkarl does not store attachments either; it keeps the text of the email.",
      },
      {
        q: "Can dearkarl send email?",
        a: "No. dearkarl only receives mail and writes it as files: to your private GitHub repo when self-hosted, or to a folder in your Google Drive in the hosted version. It has no way to send, reply or delete anything in your mailbox.",
      },
      {
        q: "Can I use dearkarl without hosting it myself?",
        a: "Not yet. A hosted version, where you sign in with Google instead of deploying, is planned; it is not open and its price is not announced. The waiting list is on dearkarl.com.",
      },
    ],
    draft: false,
    body: `Two kinds of tool can put an email in front of Claude Code. A **connector** gives the AI access to your mailbox, and it goes looking. **Forwarding** works the other way round: you pick an email and send it to the AI. Both are useful. They are not interchangeable, and choosing the wrong one gives the AI either too little or far too much.

This post compares Claude's [Gmail connector](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors) with dearkarl, a forwarding pipe we build: open source if you host it yourself, and a hosted version that is not open yet. The facts about the connector are from Anthropic's own documentation, as of October 2026.

## What is the difference, in one sentence?

**A connector lets the AI into your mailbox; forwarding brings one email out of it.** With a connector, the AI can search everything you have ever received. With forwarding, it sees only the messages you chose to send it.

## How do they compare, side by side?

dearkarl comes in two versions: **self-hosted**, which runs on your own accounts and works today, and **hosted**, which we run for you and which is not open yet. Both are in the table.

| | Gmail connector | dearkarl, self-hosted | dearkarl, hosted |
|---|---|---|---|
| **Available** | Now | Now | Not open yet; waiting list |
| **What the AI can see** | Your mailbox: it searches and reads mail, plus attachment metadata | Only the emails you forward | Only the emails you forward |
| **What the AI can do** | Draft, send, reply, forward and label mail; it asks before each send by default | Nothing in your mailbox: it only receives | Nothing in your mailbox: it only receives |
| **Which accounts** | Gmail and Google Workspace | Any account that can forward mail | Any account that can forward mail, plus a Google account to sign in |
| **Where it works** | Claude apps, and Claude Code when you sign in with a claude.ai account | Claude Code | Claude Code |
| **Setup** | A few clicks; on Team and Enterprise an owner enables it first | About 15 minutes: a domain on Cloudflare (about $10 a year) and a private GitHub repo | Sign in with Google, paste one line into Claude Code |
| **Where the copy lives** | Retrieved mail is stored with the chat on Anthropic's servers | One markdown file per email in your private GitHub repo | Markdown files in one folder in your own Google Drive |
| **Attachments** | Metadata only, no content | Not stored; the text of the email only | Not announced yet |
| **Cost** | Included for all Claude users | Free and MIT licensed | Not announced yet |

Sources: the [Gmail connector article](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors), [Claude Code's MCP documentation](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claude-ai), the [dearkarl README](https://github.com/jaal/dearkarl) and, for the hosted version, [dearkarl.com](https://dearkarl.com).

## When is a connector the better choice?

**When you don't know which email you need.** A connector is a search tool, and search is what it does well:

- "Find the invoice from the hotel in March."
- "Which emails from this client are still waiting for my reply?"
- "Draft a reply to the last message from the accountant."

Forwarding cannot help with any of these, because you would first have to find the email yourself. If you want the AI to search, sort or answer your mail, use the connector. That is what it is for.

## When is forwarding the better choice?

**When you already know which email matters.** Most everyday requests are about a single message: a booking confirmation, a brief from a client, an article you want to read later. For those, mailbox access gives the AI far more than the task needs. Forwarding is the better fit when:

1. **You want the AI to see one message, not years of mail.** An inbox also holds other people's messages: clients, family, colleagues. None of them agreed to an AI reading them. We wrote about what one mailbox reveals in [What can an AI learn about you from your email?](/blog/what-ai-knows-from-your-email)
2. **You don't want the AI to be able to send.** A connector with write access can act on your behalf. Every email in the mailbox is text the AI may read while searching, and some of it can be written to steer the AI. This is [prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
3. **The email arrives on your phone and the work happens on your laptop.** Forwarding works from any mail app, and the message waits for your next Claude Code session.
4. **Your account has no connector.** The [Microsoft 365 connector](https://support.claude.com/en/articles/15183774-connect-to-microsoft-365) needs an admin to set it up and does not support personal Outlook.com, Hotmail or Live accounts. Any account that can forward an email works with dearkarl.

## Can you use both?

**Yes, and for many people that is the sensible setup.** Keep the connector for the days you need to search, and forward single emails the rest of the time. Claude Code lets you [turn a claude.ai connector off for one project](https://code.claude.com/docs/en/mcp#disable-claude-ai-connectors) with \`/mcp\`, so a repo where you work with client code does not need your mailbox connected at all.

## How does dearkarl work?

**You forward an email; your next session reads it as a file.** dearkarl is an email-to-AI pipe: forward any email to your own secret address and it lands as a plain markdown file your next Claude Code session can read.

The **self-hosted** version runs entirely on your accounts:

1. [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/) receives the mail at a secret address on your domain.
2. A small Worker checks the sender against your allowlist and turns the message into markdown, in memory.
3. The file is committed to a **private GitHub repo** you own.
4. Your next Claude Code session opens with a short note: *"2 new things arrived."*

Mail is stored as untrusted data, never as instructions, and the code behind each of these claims is [public](https://github.com/jaal/dearkarl). To install, paste the repo URL into Claude Code and say *"install this"*.

## Is there a version without self-hosting?

**Yes, but it is not open yet.** The hosted version removes the domain, the GitHub repo and the deploy. As described on [dearkarl.com](https://dearkarl.com), it will work like this:

1. **Sign in with Google.** dearkarl creates one folder in your Google Drive and can see that folder only, through Google's [\`drive.file\`](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) permission. It never asks for your mailbox.
2. **You get your own secret address,** such as [\`claude-x7k2m9@in.dearkarl.com\`](https://dearkarl.com). Only senders you have named get through.
3. **Paste one line into Claude Code.** It tells Claude Code where to find the folder.

Each forwarded email is written to that folder as a markdown file. Our server holds the message in memory for a few seconds on the way and never writes it to a disk of ours. The price is not announced yet. The waiting list is on [dearkarl.com](https://dearkarl.com).`,
  },
];

export const publishedPosts = () => POSTS.filter((p) => !p.draft);
export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
export const postUrl = (p: BlogPost) => `/blog/${p.slug}`;
export const isoDate = (d: string) => d;
export const longDate = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
