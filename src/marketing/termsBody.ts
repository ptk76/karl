export const termsBody = `## 1. Operator

**Technologie 21 Aleksander Jaworski**
Pionerska 7/2, 53-213 Wrocław, Poland
NIP: 6912215667
E-mail: hi@dearkarl.com

These terms govern your use of the dearkarl website, the waiting-list form, the
hosted dearkarl service and the account it creates, and the open-source dearkarl
template. By using any of them you accept these terms.

## 2. What dearkarl is

dearkarl gets email into your AI. You forward a message to an address that is
yours; it becomes a markdown file in storage you control, and your next AI
session can read it. Like Send-to-Kindle, but for AI context.

There are two ways to have it, and these terms cover both.

**We run it for you.** You create an account, connect a place to keep your mail,
and you get an address on \`in.dearkarl.com\`. Mail you forward there lands in
that place. This is the version with an account — §11 sets out what the account
is, what it costs, and how either of us can end it. Which ways of signing in and
which storage providers are on offer is shown at signup and grows over time;
signing in with Google, into a folder in your Google Drive, is the first of
them.

**You run it yourself.** dearkarl is also an open-source template you deploy to
your own infrastructure, on your own domain, with no account and no server of
ours anywhere in the path. §5 covers it, and it stays free and complete.

Everything else here applies to both unless the section says otherwise.

## 3. Acceptable use

You may use this site and deploy the template for any purpose, personal or
commercial, subject to the licence in §4. You agree not to:

- attempt to overload, scrape, or systematically harvest this site;
- **enter an email address that is not yours**, on the waiting-list form or at
  signup. Both send mail to the address given, and signup also treats it as an
  address you forward from. Someone else's address in either one is a signup
  they did not ask for.
- **install it on a domain you are not authorised to configure.** Pointing a
  domain at dearkarl needs control of that domain's DNS, so this is not
  something a stranger can do to you. It is about having the access without the
  right — a work domain, a client's, a shared account. Redirecting MX records
  redirects *all* of that domain's mail, not only dearkarl's (§9).
- **put content in front of someone else's AI without them knowing.** Their
  sender allowlist is what normally stops this, so what this forbids is going
  around it: spoofing an address they allowed, or using access you have to their
  account or their machine to add your own.
- use any of it for an unlawful purpose.

Both versions ship with a **sender allowlist on by default**, and the self-host
install refuses to take over mail for a domain that already receives it. **Do
not disable either one for a deployment that is not yours to make.** A pipe into
someone's AI context that anyone can write to is a vulnerability with a UI, and
the defaults are there because of it.

## 4. The template, the licence, and attribution

**The self-host template** — everything you need to run dearkarl yourself, capture
to destination — is published at \`github.com/jaal/dearkarl\` under the **MIT
licence**. You may use, modify, and redistribute it, commercially included, on
the terms that licence states — which include keeping the copyright notice and
the licence text with the code, and which disclaim all warranty.

**What is published, and what is not.** The template is. The code we run for the
hosted service is not, at least for now — so what a reader can check for
themselves is the self-host path, and what the hosted service does with your mail
rests on what this page and the [Privacy Notice](/privacy) say it does. We say
which is which rather than letting an open-source badge cover both. If we publish
the hosted service's source later, this paragraph is where it will be said.

If you fork the template and change what it does with mail, the claims on this
site describe our version, not yours.

## 5. Self-hosting

A self-hosted deployment requires no account with us and contacts no server of
ours — no telemetry, no update check, no licence check, not even a count of
installs. It stays free and complete: the whole pipe, capture to destination,
runs on your own infrastructure, and we do not withhold capability from it to
sell you something later.

That also means **your deployment is yours to run.** We cannot see it, cannot fix
it, cannot recover anything from it, and are not responsible for what it does.
The DNS records, the Cloudflare account, the storage, the secret address and the
mail that flows through them are all under your control and nobody else's.

## 6. The waiting list

Submitting the form asks us to write to you once, when the hosted version exists.
Ticking the optional box also asks for occasional build notes; leaving it
unticked means we do not send them. You can leave at any time by replying to any
mail from us or writing to hi@dearkarl.com.

We will not use your address for anything else, and we will not sell, rent,
share, or trade it — including if dearkarl is ever sold or shut down. What we
hold and for how long is in the [Privacy Notice](/privacy).

Being on the list is not a promise that a hosted version will exist, or that it
will be free, or that it will launch on any particular date.

## 7. Mail is data, never instructions

Everything that arrives by mail is treated as data. Nothing in a message is
executed as an instruction to your AI.

This is the sharpest edge on the whole product, so it is worth saying plainly:
anyone who learns your address could otherwise write directly into your AI's
context. That is a more valuable target than your mailbox. So content that came
from outside sits inside an untrusted-content fence, and every hook, skill and
prompt we ship says so where the AI will read it.

The one exception is narrow and structural: text that **your own** first line
explicitly marks as your instruction. That region is bounded by rules that hold
for forwarded mail, and widening it is a deliberate change on our side, never a
side effect.

If you fork the template and widen that fence yourself, the consequence is
yours. See §5.

## 8. What dearkarl will not do

Three commitments that outlast any version of this page, recorded here because
the moment to write them down is before there is a commercial reason not to:

- **Karl delivers; Karl does not write.** Nothing leaves our system addressed to
  anyone but you. If we ever build a feature where Karl replies, it sends only
  to you, only about your own mail, and only after you turn it on.
- **Your address is not a mailing list.** An address that passes *through*
  dearkarl is never added to one — not for launch mail, not for a newsletter,
  not for "we thought you'd want to know."
- **Nothing enters your AI context because someone paid us.** No advertising, no
  sponsored content, no affiliate placement in the pipe, ever. And we charge for
  work we do — operating a relay, an address, an installer — never for access to
  data of yours that we are holding.

## 9. No warranty

The site, the template, and the hosted service are provided **as is**, without
warranty of any kind,
express or implied, including as to accuracy, availability, or fitness for a
particular purpose. This is the MIT licence's disclaimer, restated where you can
see it before you deploy.

Two limits worth stating plainly rather than burying:

- **Email is not a guaranteed-delivery medium**, and a self-hosted pipe is only
  as reliable as the infrastructure you deployed it to. Do not use dearkarl as
  the only copy of anything you cannot lose.
- **Changing the MX records for a domain redirects its mail.** The install refuses
  a zone that already receives mail and makes you confirm what is about to
  change, but the confirmation is yours. Losing real mail this way is
  unrecoverable.

## 10. Limitation of liability

To the fullest extent permitted by law, the operator is not liable for any
direct, indirect, or consequential loss arising from use of this site, the
template, or a deployment you run — including lost, delayed, undelivered, or
misdirected mail, and anything that follows from content placed into an AI
context.

Nothing in these terms excludes liability that cannot lawfully be excluded. If
you are a consumer in the EU, your statutory rights are unaffected.

## 11. Your account

**What the account is.** Signing in — by whichever method is on offer at the
time — creates an account with us. It is the first version of
dearkarl that has one: self-hosting has none and never will, and nothing in this
section reaches back into a template you run yourself (§5).

**What connecting storage grants.** Access to one folder — the one we create in
the storage you chose. We write your mail into it, and we read it back when your
AI asks for it. It is not, and will never be, access to your mailbox, and it is
not access to anything else in that account. Google Drive is the first provider
we support; if we add others, this same limit applies to each of them, and where
your mail is stored stays a question you answer at signup rather than a default
you inherit. What the account stores is four fields, listed in the
[Privacy Notice](/privacy), which is the document that keeps that list current.

**What it costs.** Nothing, for now. The hosted version is free while it is new:
no payment method, no published usage limit. Free today is not a promise of free
forever — if that changes we will tell you at least 30 days before it applies to
you, nothing will be charged unless you choose a paid plan, and nothing you
already captured is held hostage to it (§8).

**Ending it.** Disconnect your storage, or delete the account, from your account
page, at any time. Disconnecting stops delivery and leaves your folder and every
file in it exactly where they are — they were always yours. Deleting the account
is the end of the whole arrangement: it disconnects your storage, gives up your
address, stops mail arriving, and removes what we hold. Your folder and its
files stay where they are, because they were never ours. The retention table in
the Privacy Notice says what survives deletion and why.

**When we can suspend or end it.** We may suspend or close an account being used
against §3, one generating volumes that threaten the service for other people,
or where the law requires it. Where it is lawful and safe to do so we say why
first and give you a chance to fix it. Using the product as intended is never
grounds.

**Availability.** The hosted version is provided as it is, with no uptime
commitment (§9). Mail that cannot be delivered bounces back to whoever sent it
rather than queueing on our side, so a failure is visible to the sender instead
of being silently swallowed. The account side and the mail side are separate
services, so an outage on the account side does not stop mail arriving.

Three commitments on the record before there is a commercial reason to soften
them: self-hosting stays free and complete, where your mail is stored is a
question you answer at signup rather than a default you inherit, and connecting
your storage grants access to the folder we write into — never to your mailbox.

One thing about paying that is worth saying here rather than only in a privacy
policy, because it outlasts everything else on this page: **if you ever pay us,
EU VAT law requires us to keep evidence of which country you bought from for ten
years from the end of that year.** That is the one piece of data about you with a
retention we did not choose and cannot shorten, and it applies whatever else you
delete. Everything we *did* choose is measured in days. The full list, and what
each item is for, is in the [Privacy Notice](/privacy) — which is the document
that keeps the numbers current, so if these two ever disagree, that one is
right.

## 12. No affiliation

dearkarl is an independent project. It is not affiliated with, endorsed by, or
sponsored by Anthropic or any other AI, email, or infrastructure vendor.
Product and model names belong to their owners and are used only to say what
dearkarl works with.

## 13. Third-party services

This site's waiting-list form is operated by **Tally**, and the site is served by
**Cloudflare**; their terms apply to those services. A deployment you run uses
your own Cloudflare account and your own storage provider, under whatever
agreement you have with them. We are not a party to it.

When the hosted version exists (§11), its mail path will run on **Cloudflare**
under our account rather than yours, and your storage provider's terms will
still be between you and them.

## 14. Governing law

These terms are governed by Polish law. Nothing here deprives a consumer of the
protection of mandatory provisions of the law of their country of residence.

## 15. Changes

We may update these terms. Continued use after a change means acceptance of the
updated terms; the last-updated date below says when the current version took
effect. A change that materially affects people already on the waiting list will
be said plainly on the page rather than applied quietly.

## 16. Contact

Questions: hi@dearkarl.com

**Last updated:** 1 October 2026`;
