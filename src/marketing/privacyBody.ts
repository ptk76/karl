export const privacyBody = `## 1. Who runs this site

**Technologie 21 Aleksander Jaworski**
Pionerska 7/2, 53-213 Wrocław, Poland
NIP: 6912215667
E-mail: hi@dearkarl.com

The same entity is the data controller for everything described below. There is
no company behind it beyond the person named.

## 2. Our principle

This site collects nothing. No analytics, no cookies, no JavaScript, no
third-party requests when the page loads. You can check that by viewing the
source — it is the whole file.

The only personal data we hold today is an email address, and only if you typed
it into the waiting-list form yourself.

If you **self-host** dearkarl, we hold nothing at all, ever (§9).

## 3. Legal basis

This notice is written under Regulation (EU) 2016/679 (GDPR), the Polish
*ustawa o ochronie danych osobowych*, and the *ustawa o świadczeniu usług drogą
elektroniczną*.

- **The waiting list:** art. 6(1)(a) — your consent, given by typing your address
  in and pressing a button. Withdrawable at any time (§12).
- **Build notes, if you ticked the box:** art. 6(1)(a) — a separate consent to a
  separate question, unticked by default.
- **Serving and defending the site:** art. 6(1)(f) — legitimate interest in the
  ordinary request data every web server sees.

## 4. What we collect

| Data | How | Why |
|---|---|---|
| Your email address | Only if you submit the waiting-list form, hosted by Tally | To tell you once, when the hosted version exists |
| One optional yes/no: whether you also want occasional build notes | The same form, unticked by default | So that "tell me when it launches" and "write to me while you build it" stay two different questions with two different answers |
| Ordinary web-server request data — IP address, time, page requested, referrer, user agent | Recorded by our host, Cloudflare, as it serves the page. We add nothing to it and see only aggregate counts | Serving the site and defending it from abuse |

No account is ever required or created. We ask for an email address in exactly
one place, and only because there is no other way to tell you the thing you asked
for exists.

## 5. What we do not collect

- **Any identifier of ours that follows you.** No cookie, no \`localStorage\`, no
  per-visitor pseudonym. We deliberately do not use the standard
  privacy-analytics workaround of hashed IP addresses, because it would still
  create a per-visitor identifier.
- **Analytics of any kind.** No script, first- or third-party. See §7.
- **Session recordings.** Nothing about how you move around this page is
  recorded.
- **A profile.** No behavioural analytics, no enrichment, no inferring your
  interests, employer or location.
- **Payment data.** Nothing here is for sale yet.
- **Anything at all from a self-hosted install.** See §9.

**We never sell, rent, share or trade your data** — in any form, at any price,
including if dearkarl is ever sold or shut down. We do not mail
addresses we learned any other way: an address that passes *through* dearkarl is
not a mailing list.

## 6. Visiting the site

Cloudflare, our host, records the request data listed in §4 and shows us
aggregate counts. **We add nothing to this**, set no cookie, and run no analytics
script. We see totals, not visitors: no identifier of ours follows you between
pages or between visits.

Where: Cloudflare, Inc., established in the United States. Because that is
outside the EEA, the transfer needs a legal basis, and there are two: the
European Commission's Standard Contractual Clauses, incorporated into
Cloudflare's standard Data Processing Addendum, and Cloudflare's certification
under the EU–US Data Privacy Framework.

## 7. Cookies, JavaScript, and why there is no banner

**This page sets no cookies and runs no JavaScript.** Its Content-Security-Policy
is \`default-src 'none'\` with no \`script-src\` at all — the browser is instructed
to refuse a script even if one were somehow added. The single outbound allowance
is the waiting-list form's submission to Tally.

So there is no cookie banner. We are not being clever about consent — there is
nothing to consent to.

This is a decision, not an accident. We considered PostHog for this site, in
both its client-side and server-side forms, and rejected it; before that we
rejected client-side analytics as a class. If that ever changes, this notice
changes first.

*(Our other sites, gribgrab.com and bormio15.com, do run PostHog behind a consent
banner. Same operator, different products, different notices. Nothing is shared
between them.)*

## 8. Third parties

| Who | When they are involved | What they get |
|---|---|---|
| **Tally** (Tally BV, Belgium) | Only if you open and submit the waiting-list form | Your email address and the build-notes yes/no. They process it on our instructions and for no purpose of their own. Form data is stored in Europe, encrypted in transit and at rest |
| **Cloudflare** (Cloudflare, Inc., United States) | Every page load — they serve the site | Ordinary request data (§4), as aggregate counts to us. Covered by the Standard Contractual Clauses in their Data Processing Addendum and by their EU–US Data Privacy Framework certification |

That is the whole list. Loading this page contacts nobody else: no webfonts, no
CDN, no embedded media, no tracking pixel.

One caveat we would rather state than have you discover: **Tally is a Belgian
company that stores form data in Europe, but it uses subprocessors in the United
States for parts of its own operation** — among them email notifications, error
monitoring and abuse detection. So although your address is stored in the EEA, it
can be processed outside it by those services. We are telling you the part we
can check — who they are and where the data sits — rather than asserting a legal
mechanism for those onward transfers that we have not read the contract for.

If you would rather not be on a list at all, do not submit the form. There is
nothing else on this site to opt out of.

## 9. If you self-host dearkarl

A self-hosted install never contacts any server of ours — no telemetry, no update
check, no licence check, not even a count of installs. We cannot tell you are
running it, and that is deliberate. We hold no data about you because
there is no path by which any could reach us.

Your terms for the self-hosted template are in the
[Terms of Service](/terms) and the MIT licence shipped with the code.

## 10. Mail you send to dearkarl

Not applicable to this site, and worth saying plainly anyway:

- We never ask for access to your mailbox and would decline it if offered. The
  product reads what you deliberately forwarded, nothing else.
- Mail passes through in memory and lands only in storage you control — your own
  repository or folder. We do not write it to any disk, database, bucket, cache
  or queue of ours. If your destination is unreachable, the mail bounces
  back to the sender rather than sitting in a queue on our side.
- Logs record that a mail happened, never what it said: timestamp, size, outcome,
  error class. Never the subject, never the sender in full, never the body.
- What you capture stays plain markdown in your own storage. Leaving means
  turning forwarding off; nothing you captured needs our software to read.
- Everything that arrives by mail is treated as data, never as an instruction to
  your AI. Anyone who learns your address could otherwise write straight into
  your AI's context, so content from a message sits inside an untrusted-content
  fence. The terms say more about where that fence sits.
- Karl delivers; Karl does not write. Nothing leaves our system addressed to
  anyone but you, and an address that passes through the pipe is never added to
  a mailing list.
- The code behind every one of these claims is public, because a promise you
  cannot check is only a promise.

## 11. The hosted version, and the account it creates

This section takes effect when the hosted version does. It is published ahead of
it so the numbers are on the record before there is any commercial reason to
soften them. The [Terms of Service](/terms) §11 covers the account side — what
signing in grants, what it costs, and how either of us can end it.

### It will be two separate things, and only one of them touches your mail

**The mail path.** Cloudflare Email Routing hands your forwarded message to a
small program that turns it into markdown and writes it into your storage. Your
mail crosses Cloudflare's infrastructure on the way, and passes through that
program in memory. It is not written to any disk of ours (§10), and if your
destination is unreachable it bounces rather than queueing.

**The same program reads your folder back.** When your AI asks what has arrived,
it asks that program, and the program reads the folder — your AI never touches
your Drive itself. So the access we hold is read as well as
write, and it is worth saying which is which: we write when mail arrives, and we
read when you ask. Nothing is copied out of the folder in the process, and the
files stay where they are, in your Drive.

**The web app.** Signing in, creating your account, and connecting your storage.
This is the part that knows who you are — and it is deliberately not the part
that handles your mail. If the web app is down, mail still arrives, because
receiving a message does not depend on the account page being up.

The separation is worth stating because it decides what an incident can reach.
A problem in the web app is a problem with accounts, not with the contents of
anyone's mail.

### What the account holds

Signing in creates the first identity dearkarl has ever held — self-hosting has
none at all, and this site has one address in one form. So the list is short on
purpose, and each line has a written record naming the feature that stops working
without it:

| What | Why it exists |
|---|---|
| An identifier from your Google sign-in | To know which account is yours when you return. It is the opaque identifier Google issues, not your email address. We keep no readable copy of your email address, no name and no picture — the account page shows your address by asking Google each time you sign in |
| A token letting us write to, and read back, one Drive folder | To deliver your mail, and to hand it to your AI when it asks. Scoped to files we create — it cannot see the rest of your Drive, cannot list it, and cannot open a file it did not write. It is not, and will never be, access to your mailbox |
| The link between you and your dearkarl address | So mail sent to your address reaches your storage and nobody else's |
| The addresses you forward from | So that only you can write to your dearkarl address — mail from anywhere else bounces before it reaches your storage. The list starts with the address you signed in with, which the screen tells you plainly when it hands you your address, and you can add up to five. They are held as digests: enough to recognise a sender, not enough to read back a list of people |

You can revoke the Drive connection at any time, from your Google account or
ours. Revoking it stops delivery; it does not reach back into what was already
written, because those files are yours and sit in your Drive.

### What we hold, and for how long

| What | Why it exists | How long |
|---|---|---|
| A token saying your subscription is live | Billing. Your billing identity stays with the payment processor, not with us | While the subscription lasts |
| Free-tier mail counter | Enforcing the free-tier limit | The current billing period, plus 30 days to settle a dispute |
| Abuse counters | Stopping abuse of the relay | 7 days |
| Mail metadata in logs — time, size bucket, outcome | Operating and debugging the relay | We keep none (see §12) |
| VAT country evidence | Legally required of us, not chosen by us | 10 years from the end of the year of the sale — the period is set by EU VAT law, not by us |
| Promotion-code redemption counts | Paying a referral partner. Held by Stripe, who record it because a discount cannot be applied otherwise | Stripe's billing retention |

**Where your mail is held will be a question you answer, not a default you
inherit.** At signup you choose the destination: storage you own (a Google Drive
folder, a GitHub repository) or storage we operate. User-owned storage is the
default, stays free, and is the version we lead with. If you choose ours, the
content is encrypted at rest, carries a published maximum age stated on the page
where you choose it, and you can move off it later without losing what was
already written.

Being straight about what that choice costs, because it is the whole point of
saying it here: on **your own storage**, "we cannot read your mail" is true
because of where the mail goes, and anyone can check that in public code. On
**our storage** it becomes "we do not read your mail" — a policy rather than an
architecture. The line that is true on every tier, and the one we will keep
using, is the narrower one: *we never ask for your mailbox — only what you chose
to forward.*

Two things will still be true then, because they are the point of the product: we
will not build a profile of you, and self-hosting will stay free and
complete, so nothing in a paid tier is a capability withheld from the free path.

## 12. Retention

- **Waiting-list address and the build-notes flag:** until you ask us to remove
  it, and within **7 days** of your asking. The law gives us a month; a month is
  not a policy, it is a deadline. The list is deleted outright — not archived —
  when the hosted version launches or is cancelled, because at that point the
  reason you gave us the address has ended.
- **Our own request logs: we keep none.** This is not a short retention period,
  it is an absence. Cloudflare's own logs are subject to Cloudflare's retention
  for the plan we are on; we neither extend it, nor copy anything out of it, nor
  add a store of our own alongside it.
- **Mail metadata from the relay: none today**, and bounded when the hosted
  version exists — see the table in §11. What the relay may log is fixed by the
  code, not by policy: outcome, size, error class, timestamp, and nothing that
  identifies a sender or a subject. There is a test that fails if that changes.
- **Everything in §11:** as stated in that table, once it is in force.
- **Everything else:** there is nothing else.

## 13. Your rights

You can ask us to show you what we hold, correct it, delete it, restrict what we
do with it, object to it, or receive it in a structured, machine-readable form.
Where we rely on consent, you can withdraw it at any time, and doing so does not
undo what was lawful beforehand.

Because we hold so little, most of these have little to work on: for most
visitors the honest answer to "what do you have about me" is *nothing*.

To leave the waiting list, or to untick build notes: reply to any mail from us,
or write to hi@dearkarl.com. We answer within a month, usually far sooner —
the amount of data involved is one line in one form.

You can also complain to the Polish supervisory authority: Prezes Urzędu Ochrony
Danych Osobowych, ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.

## 14. Children

dearkarl is not directed at children under 13 and we do not knowingly collect
anything from them.

## 15. Security

The site is served over TLS. The waiting-list address is held by Tally under
their access controls and by nobody else. Access on our side is limited to the
person named in §1.

Two commitments specific to this product, which matter more than the sentence
above: your dearkarl address is a secret and never appears in a commit, log,
screenshot or doc, and every deployment ships with a sender allowlist on
by default, so a pipe into your AI context is not writable by anyone who learns
the address.

## 16. Changes

If this notice changes in a way that affects you, we say so on this page with a
date, and we do not apply a new use retroactively to data already collected. If a
rule of ours is ever broken, we say that publicly too — what happened, what was
exposed, what changed.

## 17. Contact

Questions or requests about personal data: hi@dearkarl.com
Postal: Technologie 21 Aleksander Jaworski, Pionerska 7/2, 53-213 Wrocław, Poland

**Last updated:** 1 October 2026`;
