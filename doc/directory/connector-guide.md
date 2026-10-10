# Use Dear Karl with Claude

Dear Karl gives you a private email address for your AI. Everything you send
to it is saved as a Markdown file in a **dearkarl** folder in your Google
Drive. The Dear Karl connector lets Claude read that folder.

## Before you start

You need a Dear Karl account. Go to https://karl.przemekkudla.pl and sign in
with Google. That creates the dearkarl folder in your Drive and gives you your
Dear Karl address.

## Connect Claude

**From the directory:** in Claude, open **Settings → Connectors**, find
**Dear Karl**, and select **Connect**.

**As a custom connector:** in **Settings → Connectors**, select **Add custom
connector** and enter:

```
https://karl.przemekkudla.pl/mcp
```

Either way, Claude opens a Dear Karl page in your browser:

1. Sign in with Google, if you aren't already.
2. Check the app name on the consent page and select **Allow**.

You're connected. There's nothing to copy or paste.

## What you can ask

- "What's new in my Dear Karl inbox?"
- "Summarize the newsletter I forwarded this morning."
- "Read the note I emailed myself about the trip and turn it into a packing
  list."
- "Find the link about pricing I saved last month."

## What the connector can do

| Tool | What it does |
|---|---|
| List Saved Files (`list_files`) | Lists the files in your dearkarl folder: name, type, size, last modified |
| Read File Contents (`read_file`) | Reads the text of one file, by name or id. Files over 256 KB are cut off at 256 KB |

The connector is **read-only**. It can't create, change, move or delete
files. It only sees files that Dear Karl itself created — Google's
`drive.file` permission keeps the rest of your Drive out of reach.

## Troubleshooting

| You see | Do this |
|---|---|
| "Google Drive re-authorization required" | Sign in again at https://karl.przemekkudla.pl. This happens if you signed out of Dear Karl or revoked its Google access |
| "No file named … found" | Ask Claude to list your files first and use the exact name |
| The connector stopped working after you removed it in Claude | Connect it again; you'll see the consent page once more |

## Disconnect

Remove the connector in Claude under **Settings → Connectors**. To revoke Dear
Karl's access to Google Drive as well, go to
https://myaccount.google.com/permissions and remove Dear Karl.

## Privacy and support

- Privacy policy: `TODO` link
- Support: `TODO` contact
