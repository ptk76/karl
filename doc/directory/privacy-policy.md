# Dear Karl privacy policy

> **DRAFT — not legal advice.** Written from what the code does on branch
> `oauth/1` (D1 schema in `migrations/`, `worker/`). Fill in the `TODO`s,
> check every statement against production, and have the owner approve it
> before publishing. Under GDPR the controller's identity and address are
> mandatory.

_Last updated: `TODO`_

Dear Karl ("we") runs the Dear Karl service at https://karl.przemekkudla.pl,
including the email address you send messages to and the Dear Karl connector
for Claude and other MCP clients. This policy explains what data we handle
and why.

**Controller:** `TODO` name, address, contact email.

## What we collect

| Data | Why | Where it's kept |
|---|---|---|
| Your Google account email address | To identify your account and match incoming email to you | Our database (Cloudflare D1) |
| A login name derived from your email | To give you your Dear Karl address | Our database |
| Google OAuth access and refresh tokens | To save files to, and read files from, your dearkarl Drive folder | Our database |
| A browser session id | To keep you signed in to the web app | Our database and a cookie in your browser |
| Personal access tokens you create | To let MCP clients connect | Our database stores only a SHA-256 hash, the first 12 characters, a name, and created / expires / last-used / revoked times |
| Connector grants (when you connect Claude or another MCP client) | To let that client call the connector on your behalf | Cloudflare KV: tokens are stored hashed, account details encrypted |
| Emails you send to your Dear Karl address | To save them to your Drive | Processed in memory and written to **your** Google Drive as Markdown. We don't keep a copy |

## What we don't collect

- We don't read or store your Claude conversations. When Claude uses the
  connector, we receive only the tool request (a file name or id) and return
  the file. We don't log those requests.
- We can't see the rest of your Google Drive. We use Google's `drive.file`
  scope, which only covers files Dear Karl created.
- We don't sell your data or use it for advertising.
- `TODO` confirm: no analytics or tracking on the web app.

## Who processes data for us

| Provider | What for |
|---|---|
| Cloudflare | Hosting, database, email receiving |
| Google | Sign-in, and storing your files in your own Google Drive |
| Elastic Email | Sending service emails, such as replies when an email can't be saved. These can include the sender address and an error message |

`TODO` confirm the list is complete and add each provider's location / transfer basis.

## How long we keep it

- Account data and Google tokens: until you delete your account. `TODO`
  describe how a user deletes their account.
- Personal access tokens: until you revoke them or they expire; revoked
  token records are `TODO`.
- Connector grants: until you disconnect the client or the grant expires.
- Your files live in your Google Drive and are yours. Deleting your Dear
  Karl account doesn't delete them, and you can delete them at any time.

## Your choices and rights

- Disconnect Claude in **Settings → Connectors**.
- Revoke Dear Karl's Google access at https://myaccount.google.com/permissions.
- Ask us to access, correct, export or delete your data: `TODO` contact.
- If you're in the EU/EEA, you can complain to your data protection
  authority (in Poland: UODO, https://uodo.gov.pl).

## Google API data

Dear Karl's use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Changes

We'll post changes on this page and update the date above.

## Contact

`TODO` email address
