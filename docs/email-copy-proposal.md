# Email copy — proposal for review

Status: **draft, nothing in the code has changed yet.** Comment inline
(`> Olek: …` under any block), and once the wording is agreed the copy goes
into `worker/api/messages.ts` and `worker/api/email.ts`.

## What changes, and why

The current mails were written one at a time, and it shows:

| Problem now | Proposal |
|---|---|
| Greetings and sign-offs vary ("Hello!", "Regards, Karl") and the bodies are raw HTML with `<br>` | One template for all mails: greeting → what happened → what to do → `Karl` → footer. Plain short paragraphs. |
| The brand is written "Dear Karl" | Always **DearKarl**. |
| A link's text says `dearkarl.com` but the link goes to `karl.przemekkudla.pl`; the same for `support@dearkarl.com` → `support@przemekkudla.pl` | Everything uses `dearkarl.com`, contact goes to `hi@dearkarl.com`, and the link text always matches the link (see "Before this ships"). |
| No footer: no contact address, no sender details | One footer on every mail: link to dearkarl.com, contact address, the details EU law requires (see "Footer"). |
| Subjects use three different styles ("Unknown User", "Access Denied", "Saved to Drive: …") | Every subject is a short plain sentence saying what happened. |
| A failure mail never says whether anything was saved or whether to send again | Every failure mail says nothing was saved and what to do next. |
| The mails do not say which message they are about | The subject of the original email is quoted (`{subject}`), so the user knows which one failed. |
| "Access Denied" covers two different situations (token refresh failed / Drive rejected the token) | One mail for both. To the user it is the same thing: "sign in again". |
| English only | English and Polish (see "Language"). |

Placeholders: `{subject}` = subject of the incoming email, `{filename}` = name
of the file on Drive, `{from}` = sender address, `{to}` = the DearKarl address
it was sent to, `{karl_address}` = the user's own DearKarl address. Every
placeholder is HTML-escaped, because all of them come from mail anyone can
send.

## Language

- **Known users** (mails 1, 3, 4, 5) get the mail in their account language.
  New setting, values `en` / `pl`. Default at sign-up: `pl` if the Google
  profile locale starts with `pl`, otherwise `en`.
- **Unknown senders** (mail 2) have no account, so we don't know their
  language. Proposal: one mail with both versions, Polish first, then English.
- Diagnostics (operator mails) stay in English.

> Olek:

## Footer

The same footer goes under every user mail. It covers what Polish/EU law
requires from a business sending mail as part of an online service (the
"ustawa o świadczeniu usług drogą elektroniczną", art. 5, and GDPR art. 13):
who is sending, how to contact them, the company's registration data, and
where the privacy policy and the terms are. These are service mails, not marketing, so no
unsubscribe link is required, but mail 1 links to the setting that turns it
off.

DearKarl is run by Technologie 21 Aleksander Jaworski, a sole trader, so the
register is CEIDG (no separate number is needed, the NIP identifies the
entry).

EN:

```text
--
DearKarl · https://dearkarl.com
Contact: hi@dearkarl.com
Technologie 21 Aleksander Jaworski
Pionerska 7/2, 53-213 Wrocław, Poland
VAT ID (NIP): 6912215667 · registered in CEIDG
Privacy policy: https://dearkarl.com/privacy
Terms: https://dearkarl.com/terms
{why_line}
```

PL:

```text
--
DearKarl · https://dearkarl.com
Kontakt: hi@dearkarl.com
Technologie 21 Aleksander Jaworski
ul. Pionerska 7/2, 53-213 Wrocław
NIP: 6912215667 · wpis do CEIDG
Polityka prywatności: https://dearkarl.com/privacy
Regulamin: https://dearkarl.com/terms
{why_line}
```

`{why_line}` explains why the person got the mail:

| Mail | EN | PL |
|---|---|---|
| 1 | `You get this after every saved email. Turn it off in your settings: https://dearkarl.com/settings` | `Dostajesz to po każdym zapisanym mailu. Możesz to wyłączyć w ustawieniach: https://dearkarl.com/settings` |
| 2 | `You got this because an email from {from} was sent to a DearKarl address.` | `Dostajesz to, bo z adresu {from} przyszedł mail na adres DearKarl.` |
| 3, 4, 5 | `You got this because you have a DearKarl account.` | `Dostajesz to, bo masz konto w DearKarl.` |

---

## User mails

### 1. Saved (the happy path)
**Trigger:** the file was saved to Drive, and the user has the setting
"Confirm every saved email" turned on (default: on). **To:** `user.email`.

**EN subject:** `Saved: {filename}`

```text
Hi,

I saved your email "{subject}" to the dearkarl folder on your Google Drive
as "{filename}".

Karl
```

**PL temat:** `Zapisane: {filename}`

```text
Cześć,

zapisałem Twojego maila „{subject}” na Twoim Dysku Google, w folderze
dearkarl, jako „{filename}”.

Karl
```

> New setting: one column in `users` + a switch on the settings page + one
> `if` in the handler before this mail is sent.

### 2. Sender not recognised
**Trigger:** there is no account for `message.from`. **To:** the sender.
Sent in both languages, Polish first. At most once per sender address per day
(see Q2).

**Subject:** `Nie znam jeszcze tego adresu / I don't know this address yet`

```text
Cześć,

dostałem Twojego maila „{subject}”, ale adres {from} nie jest połączony
z żadnym kontem DearKarl. Nic nie zapisałem.

Jeśli masz już konto, wyślij maila z adresu Google przypisanego do konta.
Jeśli nie, załóż je na https://dearkarl.com.

Karl

---

Hi,

I got your email "{subject}", but {from} isn't linked to a DearKarl account,
so I didn't save anything.

If you already have an account, send from the Google address you signed up
with. If not, you can create one at https://dearkarl.com.

Karl
```

### 3. Wrong DearKarl address
**Trigger:** the sender is known, but they wrote to someone else's DearKarl
address. **To:** the sender.

**EN subject:** `That isn't your DearKarl address`

```text
Hi,

You sent "{subject}" to {to}, which isn't your DearKarl address, so I didn't
save anything.

Your address is {karl_address}. Send the email there and I'll save it.

Karl
```

**PL temat:** `To nie jest Twój adres DearKarl`

```text
Cześć,

mail „{subject}” poszedł na {to}, a to nie jest Twój adres DearKarl.
Nic nie zapisałem.

Twój adres to {karl_address}. Wyślij maila tam, a go zapiszę.

Karl
```

> Code change: today the mail does not say what the right address is. The
> handler already has `user.login`, so `{karl_address}` costs one line.

### 4. Sign in again
**Trigger:** the Google token could not be refreshed, **or** Drive rejected it
(`DriveAuthError`). **To:** `user.email`.

**EN subject:** `Please sign in to DearKarl again`

```text
Hi,

I couldn't save "{subject}" because my access to your Google Drive has
expired. Nothing was saved.

Sign in again at https://dearkarl.com, then send the email once more.

Karl
```

**PL temat:** `Zaloguj się ponownie do DearKarl`

```text
Cześć,

nie zapisałem „{subject}”, bo wygasł mój dostęp do Twojego Dysku Google.

Zaloguj się ponownie na https://dearkarl.com i wyślij maila jeszcze raz.

Karl
```

### 5. Could not save
**Trigger:** saving to Drive failed for any other reason. **To:** `user.email`.

**EN subject:** `I couldn't save your email`

```text
Hi,

I couldn't save "{subject}" to your Google Drive. Nothing was saved.

This usually means the drive is full. Free up some space and send the email
again. If it keeps happening, write to hi@dearkarl.com.

Karl
```

**PL temat:** `Nie udało mi się zapisać Twojego maila`

```text
Cześć,

nie mogłem zapisać „{subject}” na Twoim Dysku Google.

Najczęściej to znaczy, że dysk jest pełny. Zwolnij trochę miejsca i wyślij
maila jeszcze raz. Jeśli to się powtarza, napisz do nas:
hi@dearkarl.com.

Karl
```

---

## Operator mails (diagnostics)

They go to `DIAGNOSTIC_EMAIL` (fallback: `przemekkudla@hotmail.com`). English
only, no footer. Only the subjects change, so they are easier to filter:

| Trigger | Now | Proposal |
|---|---|---|
| SPF/DMARC failed, mail dropped | `Rejected: sender authentication failed` | `[DearKarl] Rejected: sender authentication failed` |
| Unhandled exception in `emailHandler` | `ERROR` | `[DearKarl] Error: {first line of the message}` |

The body stays as it is (technical details, escaped).

---

## Before this ships

The mails point at `dearkarl.com` (decided), so these have to exist first,
or the links in the mails lead nowhere:

1. `https://dearkarl.com` serves the app (today it is `karl.przemekkudla.pl`).
2. `hi@dearkarl.com` is a working mailbox.
3. `https://dearkarl.com/privacy`, `https://dearkarl.com/terms` and
   `https://dearkarl.com/settings` exist.
4. Elastic Email sends from a `@dearkarl.com` address, with SPF and DKIM set
   up for that domain. Otherwise "DearKarl" mail arrives from
   `przemekkudla.pl` and is more likely to land in spam.

## Decided

- **Q1. Domain:** `dearkarl.com` everywhere.
- **Q3. Confirmation after every save:** keep it, and make it an account
  setting (default: on).
- **Q4. Language:** English and Polish.
- **Q5. Footer:** Technologie 21 Aleksander Jaworski, Pionerska 7/2,
  53-213 Wrocław, NIP 6912215667, contact `hi@dearkarl.com`.
- **Q2. Mail 2 to unknown senders:** keep it, but at most once per sender
  address per day. Every stranger's or spammer's mail would otherwise cost an
  Elastic Email send and hurt the sender reputation. Needs a small table
  (address, last sent) in D1, checked before sending.
