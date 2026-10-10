# Portal answers

One section per step of the developer portal. Character limits are the
portal's. `TODO` marks what only the owner can fill in.

## 1. Connection

- Server URL: `https://karl.przemekkudla.pl/mcp` (see README → Domain)
- Users connect to different URLs: **no** — one URL for everyone

## 2. Tools

Synced from the server. Expect two tools, both in the read-only group:

| Tool | Title | Annotation |
|---|---|---|
| `list_files` | List Saved Files | `readOnlyHint: true` |
| `read_file` | Read File Contents | `readOnlyHint: true` |

## 3. Listing

**Server name** (≤ 100): `Dear Karl`

**One-liner** (≤ 200):

> Read the notes, links and emails you've sent to Dear Karl — your private
> inbox for your AI — straight from Claude.

**Description** (≤ 2,000):

> Dear Karl gives you a private email address for your AI. Forward a
> newsletter, email yourself a note, or send a link from your phone, and Dear
> Karl saves it as a Markdown file in a "dearkarl" folder in your own Google
> Drive.
>
> This connector lets Claude read that folder. Ask Claude what's new in your
> inbox, summarize the article you forwarded this morning, or pull up the
> note you sent yourself last week — without copying and pasting.
>
> What it can do:
> - List the files in your Dear Karl folder (name, type, size, date)
> - Read the text of a file, by name or id
>
> What it can't do: it is read-only. It can't write, move or delete files,
> and it only sees the dearkarl folder — Dear Karl uses Google's `drive.file`
> scope, so it has no access to the rest of your Drive.
>
> You need a Dear Karl account (sign in with Google at
> https://karl.przemekkudla.pl). Connecting asks you to sign in and approve
> access once.

**Categories** (1–5): Productivity; Knowledge management — `TODO` pick from
the portal's list

**Documentation URL**: `TODO` — where `connector-guide.md` gets published

**Privacy policy URL**: `TODO` — where `privacy-policy.md` gets published

**Support contact**: `TODO`

**Icon**: `public/karl.png`

**Slug**: `dear-karl` (permanent)

## 4. Use cases

**Primary use cases:**
1. Catch up on your inbox: "What did I send to Dear Karl this week?"
2. Work with a saved item: "Summarize the newsletter I forwarded today" /
   "Turn the note I emailed myself into a checklist"
3. Find something: "Find the link about pricing I saved last month"

**What users need before connecting:** a Dear Karl account, created by
signing in with a Google account at https://karl.przemekkudla.pl. Free.
`TODO` confirm pricing.

**Reads / writes:** reads only.

## 5. Company

- Company name: `TODO`
- Website: `TODO` (https://dearkarl.com?)
- Primary contact for review updates: `TODO`

## 6. Authentication

**OAuth with dynamic client registration.** The server is its own OAuth 2.1
authorization server (RFC 8414 metadata, RFC 9728 protected-resource metadata
linked from the 401 challenge, RFC 7591 registration, PKCE S256). Single
scope: `files:read`. Users sign in with Google, then approve access on a
consent page.

Doesn't start unauthenticated; every `/mcp` call needs a token.

## 7. Data handling

- **Underlying API:** proxied, with permission — the server calls the Google
  Drive API on the user's behalf, using the Google OAuth grant the user gave
  Dear Karl (`drive.file` scope, limited to files Dear Karl created).
  `TODO` confirm this choice (see README → Open decisions).
- **Personal health data:** no
- **Sponsored content:** no

## 8. Test & launch

Instructions for reviewers (fill in the credentials in the portal only, never
in this repo):

> 1. In Claude, add a custom connector with the URL
>    `https://karl.przemekkudla.pl/mcp`.
> 2. Claude opens a sign-in page. Choose "Sign in with Google" and use the
>    test account: `TODO` (email) / password given in the credentials field.
> 3. On the Dear Karl consent page, select **Allow**.
> 4. Try:
>    - "List the files in my Dear Karl folder" → `list_files`
>    - "Read the file named welcome.md" → `read_file` by name
>    - "Read the newest file" → `list_files`, then `read_file` by id
>    - "Read the file named does-not-exist" → actionable error message
>
> The test account's folder holds `TODO` files: forwarded newsletters,
> self-sent notes and a long file (> 256 KB) that comes back truncated.

Before submitting:
- [ ] Create the test Google account and sign up for Dear Karl with it
- [ ] Populate its folder by emailing it several messages of different kinds
- [ ] Turn off 2-step verification prompts that would block a reviewer, or
      document how they get through them
- [ ] Google Cloud OAuth app published to production (or the reviewer
      account added as a test user)
- [ ] Run both tools in MCP Inspector
- [ ] Run both tools from a Claude conversation as a custom connector

## 9. Compliance

All seven acknowledgments apply cleanly:
- Directory guidelines — yes
- First-party API usage — see Data handling
- Financial transactions — none
- AI media generation — none
- Prompt injection — tool descriptions only describe the tools
- Conversation data collection — the server receives only tool arguments
  (a file id or name); it doesn't log or store them
- Public documentation — `connector-guide.md`, publish before going live
