# Connectors Directory submission

Prep for listing the Dear Karl MCP server in Anthropic's Connectors Directory
(https://claude.com/docs/directory/publish). Submission happens in the
developer portal at https://claude.ai/directory/manage → **Submit new** →
**MCP connector**, from a paid claude.ai account.

| File | What it is |
|---|---|
| `listing.md` | Answers for every step of the portal form, ready to paste |
| `connector-guide.md` | Draft of the public setup/usage docs (required by publish date) |
| `privacy-policy.md` | Draft privacy policy (required; missing one = rejection) |

## Status against the checklist

| Requirement | Status |
|---|---|
| Remote server over HTTPS | ✅ `https://karl.przemekkudla.pl/mcp` (once `oauth/1` is deployed) |
| OAuth 2.0 for Claude's client | ✅ OAuth 2.1 + Dynamic Client Registration (`worker/oauth/provider.ts`) |
| Every tool has `title` + `readOnlyHint`/`destructiveHint` | ✅ both tools: `title` + `readOnlyHint: true` (`worker/mcp/server.ts`) |
| Separate read/write tools, no catch-all | ✅ read-only, two purpose-built tools |
| Tool names ≤ 64 chars, narrow descriptions, no prompt injection | ✅ |
| Actionable error messages | ✅ see `worker/mcp/README.md` → Errors |
| Tested in MCP Inspector **and** as a custom connector in Claude | ⬜ |
| Public documentation URL | ⬜ publish `connector-guide.md` somewhere public |
| Privacy policy URL | ⬜ review + publish `privacy-policy.md` |
| Icon | ⬜ `public/karl.png` — check it reads well at small sizes |
| Support contact | ⬜ |
| Reviewer test account (fully populated) | ⬜ see `listing.md` → Test & launch |
| Google OAuth app in **production** (not "Testing") | ⬜ otherwise reviewers can't sign in |

## Open decisions

- **Domain.** Review criteria: "The MCP server domain should match your
  service." The server lives on `karl.przemekkudla.pl`, the product is Dear
  Karl (`dearkarl.com`). Consider serving it from e.g. `karl.dearkarl.com`
  before submitting — the issuer is derived from the request origin, so this
  is a DNS/route change, not a code change. The connection URL is hard to
  change after listing.
- **Who submits / owns the listing.** The listing belongs to the claude.ai
  organization it's submitted from, and the Company step asks for company
  name, website and a primary contact.
- **Data handling answer.** The server reads the user's own Google Drive via
  the user's own Google OAuth grant. `listing.md` proposes "proxied … with
  permission"; confirm before submitting.
- **Slug** is permanent once published (`dear-karl` proposed).
