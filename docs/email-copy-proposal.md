# Email copy — proposal for review

Status: **draft, nothing in the code has changed yet.** Comment inline
(`> Olek: …` under any block), and once the wording is agreed the copy goes
into `worker/api/messages.ts` and `worker/api/email.ts`.

## What changes, and why

The current mails were written one at a time, and it shows:

| Problem now | Proposal |
|---|---|
| Greetings and sign-offs vary ("Hello!", "Regards, Karl") and the bodies are raw HTML with `<br>` | One template for all mails: `Hi,` → what happened → what to do → `— Karl`. Plain short paragraphs. |
| A link's text says `dearkarl.com` but the link goes to `karl.przemekkudla.pl`; the same for `support@dearkarl.com` → `support@przemekkudla.pl` | The text and the link always show the same address. Which domain to use → **Q1**. |
| Subjects use three different styles ("Unknown User", "Access Denied", "Saved to Drive: …") | Every subject is a short plain sentence saying what happened. |
| A failure mail never says whether anything was saved or whether to send again | Every failure mail says "nothing was saved" and what to do next. |
| The mails do not say which message they are about | The subject of the original email is quoted (`{subject}`), so the user knows which one failed. |
| "Access Denied" covers two different situations (token refresh failed / Drive rejected the token) | One mail for both — to the user it is the same thing: "sign in again". |

Placeholders: `{subject}` = subject of the incoming email, `{filename}` = name
of the file on Drive, `{from}` = sender address, `{to}` = the Karl address it
was sent to, `{karl_address}` = the user's own Karl address. Every placeholder
is HTML-escaped, because all of them come from mail anyone can send.

Constants used below: `{app_url}` and `{support}` — see **Q1**.

---

## User mails

### 1. Saved — the happy path
**Trigger:** the file was saved to Drive. **To:** `user.email`.

**Subject:** `Saved: {filename}`

```
Hi,

I saved your email "{subject}" to the dearkarl folder on your Google Drive
as "{filename}".

— Karl
```

### 2. Sender not recognised
**Trigger:** there is no account for `message.from`. **To:** the sender.

**Subject:** `I don't know this address yet`

```
Hi,

I got your email "{subject}", but {from} isn't linked to a Dear Karl account,
so I didn't save anything.

If you already have an account, send from the Google address you signed up
with. If not, you can create one at {app_url}.

— Karl
```

### 3. Wrong Karl address
**Trigger:** the sender is known, but they wrote to someone else's Karl
address. **To:** the sender.

**Subject:** `That Karl address isn't yours`

```
Hi,

You sent "{subject}" to {to}, which isn't your Karl address, so I didn't save
anything.

Your address is {karl_address}. Send the email there and I'll save it.

— Karl
```

> Code change: today the mail does not say what the right address is. The
> handler already has `user.login`, so `{karl_address}` costs one line.

### 4. Sign in again
**Trigger:** the Google token could not be refreshed, **or** Drive rejected it
(`DriveAuthError`). **To:** `user.email`.

**Subject:** `Please sign in to Dear Karl again`

```
Hi,

I couldn't save "{subject}" because my access to your Google Drive has
expired. Nothing was saved.

Sign in again at {app_url}, then send the email once more.

— Karl
```

### 5. Could not save
**Trigger:** saving to Drive failed for any other reason. **To:** `user.email`.

**Subject:** `I couldn't save your email`

```
Hi,

I couldn't save "{subject}" to your Google Drive. Nothing was saved.

This usually means the drive is full. Free up some space and send the email
again. If it keeps happening, write to {support}.

— Karl
```

---

## Operator mails (diagnostics)

They go to `DIAGNOSTIC_EMAIL` (fallback: `przemekkudla@hotmail.com`). Only
the subjects change, so they are easier to filter:

| Trigger | Now | Proposal |
|---|---|---|
| SPF/DMARC failed, mail dropped | `Rejected: sender authentication failed` | `[Karl] Rejected: sender authentication failed` |
| Unhandled exception in `emailHandler` | `ERROR` | `[Karl] Error: {first line of the message}` |

The body stays as it is (technical details, escaped).

---

## Open questions

**Q1. Which domain goes in the mails?** Either the address that works today
(`karl.przemekkudla.pl`, `support@przemekkudla.pl`), or `dearkarl.com` — but
only once that domain points at the app and the support mailbox exists.
Proposal: the working address now, as constants in `messages.ts`, so the
switch is one line.

> Olek:

**Q2. Should mails 2 and 3 be sent at all?** They go to anyone who passes
SPF/DMARC, so every stranger's mail costs an Elastic Email send, and replying
to unknown addresses can hurt the sender reputation. Option: send mail 2 at
most once per address per day, or not at all.

> Olek:

**Q3. Mail 1 on every save — needed?** If someone saves 20 emails a day, they
get 20 confirmations. Option: keep it (it confirms that it works) or make it
an account setting later.

> Olek:

**Q4. Language.** Everything stays in English, the same as the app. Polish
versions only if the app gets them too.

> Olek:
