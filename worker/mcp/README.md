# Dear Karl MCP server

The worker exposes a **Model Context Protocol** endpoint at `/mcp` that lets MCP
clients (Claude desktop, IDEs, scripts) read the files a user has saved to their
**"dearkarl" Google Drive folder**. It is strictly **read-only**: two tools —
`list_files` and `read_file` — and nothing writes to Drive.

- Code: `worker/mcp/handler.ts` (entrypoint), `worker/mcp/server.ts` (tools)
- Auth: `worker/oauth/provider.ts` (OAuth provider + PAT check),
  `worker/oauth/authorize.ts` (consent page)
- Wire contract: `shared/api.ts` (`MCP_PATH = "/mcp"`, OAuth paths)
- Token generation: `worker/mcp/pat.ts`, `worker/api/tokens.ts`, `worker/db.ts`

---

## Architecture / flow

```
MCP client                        Worker                          Google Drive
   |   POST /mcp (Bearer karl_…)     |                                  |
   |-------------------------------->|                                  |
   |                                 |  SHA-256 hash of token           |
   |                                 |  findUserByTokenHash() in D1     |
   |                                 |  (unknown/revoked/expired → 401) |
   |                                 |                                  |
   | initialize (JSON-RPC 2.0)      |                                  |
   |-------------------------------->|                                  |
   |  result: protocolVersion,       |                                  |
   |         serverInfo=dear-karl    |                                  |
   |<--------------------------------|                                  |
   |                                 |                                  |
   | tools/call {name, arguments}    |                                  |
   |-------------------------------->|  resolve token → fresh GoogleToken/GoogleDrive for THIS user only
   |                                 |--------------------------------->| GET /drive/v3/files…q=name='dearkarl'
   |                                 |<---------------------------------| folder id
   |                                 |--------------------------------->| list files / read contents
   |  result: content[] +            |<---------------------------------|
   |         structuredContent       |                                  |
   |<--------------------------------|                                  |
```

Key properties:

- **Stateless**: one `McpServer` + one transport per HTTP request
  (`sessionIdGenerator: undefined`). No `Mcp-Session-Id` to keep, nothing to
  leak across requests; a revoked/expired token stops working on the very next
  request.
- **JSON responses**: `enableJsonResponse: true` — replies come back as plain
  `application/json`, not SSE streams (no long-lived stream on a stateless worker).
- **Per-user isolation**: the bearer token resolves to one user; the tools are
  bound to that user's Drive via their (possibly refreshed) Google access token.

---

## Authentication

Every `/mcp` request needs a bearer token, checked by
[`@cloudflare/workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider)
before `mcpHandler` runs. Two kinds are accepted; either way the handler gets
the owner in `ctx.props` (`{ email, patId? }`):

1. **OAuth access token** — what Claude Desktop / claude.ai custom connectors
   use. Nothing to copy by hand.
2. **Personal Access Token (PAT)** — for clients that only take a fixed header.

### OAuth (connectors)

The worker is its own OAuth 2.1 authorization server. Endpoints:

| Path | Owner | Purpose |
|---|---|---|
| `/.well-known/oauth-protected-resource/mcp` | provider | RFC 9728 resource metadata (linked from the `401` challenge) |
| `/.well-known/oauth-authorization-server` | provider | RFC 8414 metadata |
| `/oauth/register` | provider | Dynamic Client Registration (RFC 7591) |
| `/authorize` | `worker/oauth/authorize.ts` | Sign-in + consent page |
| `/oauth/token` | provider | Code / refresh-token exchange (PKCE S256 required) |

Flow when a user adds `https://karl.przemekkudla.pl/mcp` as a connector:

1. The client hits `/mcp`, gets `401` + `WWW-Authenticate: … resource_metadata=…`,
   discovers the metadata above and registers itself.
2. It opens `/authorize` in the browser. No `sid` session → redirect to
   `/?next=/authorize?…`; the web app keeps `next` in `sessionStorage` across
   the Google login and returns there afterwards.
3. With a session, the user sees a consent page (client name, redirect host,
   localhost warning; framing forbidden, form bound to the browser by cookie).
   Allow → grant with `props = { email }`, `userId = email`.
4. The client exchanges the code at `/oauth/token` and calls `/mcp` with the
   access token.

- Grants, tokens and registered clients live in the **`OAUTH_KV`** KV
  namespace (hashed tokens, encrypted props). Provisioned automatically on
  `wrangler deploy`, like D1.
- Single scope: `files:read`.
- Issuer and resource are derived from the request origin, so production,
  workers.dev and `localhost` each work as their own issuer.
- The Drive access itself still comes from the user's Google tokens in D1; if
  they log out of the web app, MCP calls return the re-authorization message.

### Personal Access Tokens

PATs go in the `Authorization` header:

```
Authorization: Bearer karl_<64 hex chars>
```

- Tokens are generated by the web app — `POST /api/tokens` (below).
- **Only the SHA-256 digest of the token is stored** in D1; a DB leak does not
  expose usable tokens.
- A token is valid while it is not revoked and not expired
  (`api_tokens.revoked_at IS NULL` and `expires_at IS NULL OR expires_at > now`).
- **Unknown, revoked, and expired tokens all return the same `401 invalid_token`**
  — deliberately no hint about which case failed.
- The provider tries a token as an OAuth token first; anything it did not issue
  goes to `resolvePat()`, which only looks up `karl_`-prefixed tokens.
- Each successful request best-effort updates `last_used_at` (via
  `ctx.waitUntil`, never blocks the response).

### Creating tokens (web session)

Token management endpoints are authenticated by the **browser `sid` session
cookie**, never by a PAT.

| Command | Method & path | Body | Returns |
|---|---|---|---|
| List tokens | `GET /api/tokens` | — | `ApiTokenSummary[]` (`id`, `name`, `prefix`, `createdAt`, `expiresAt`, `lastUsedAt`) — never the raw token |
| Create token | `POST /api/tokens` | `{ name?: string, expiresInDays?: number }` | `ApiTokenCreated` — includes `token` **once only** (never stored; the only chance to see it) |
| Revoke token | `POST /api/tokens/revoke` | `{ id: number }` | `{ ok: boolean }` |

Notes:

- Default `name` is `"Default"`. `expiresInDays` is optional; omitted → never
  expires. `prefix` is the first 12 chars, for display.
- Revoke is checked before create so a `{ id }` payload is never mistaken for a
  create request.
- Routing: `/mcp` → `mcpHandler` in `worker/index.ts`; `/api/tokens*` →
  `tokenHandler` via `loginHandler` (`worker/api/login.ts`).

---

## Protocol

- **Endpoint**: `POST /mcp`
  - local dev: `http://localhost:5173/mcp` (Vite + Cloudflare plugin serves the worker)
  - production: `https://karl.przemekkudla.pl/mcp`
- **Transport**: MCP Streamable HTTP (`application/json` responses)
- **JSON-RPC 2.0** request envelope; responses are JSON-RPC 2.0 results
- **`protocolVersion`: `2025-06-18`**
- **Capabilities**: `tools` (`listChanged: true`); no resources, no prompts
- **Headers**: `Authorization: Bearer karl_…`, `Content-Type: application/json`,
  `Accept: application/json, text/event-stream`

### Handshake & call sequence

```text
1. initialize                      → establishes protocol version + server info
2. notifications/initialized         (informational; optional in stateless mode)
3. tools/list (optional)           → names/schemas of the available tools
4. tools/call {name, arguments}    → execute one tool
```

---

## Tools (all commands)

Both tools are marked `readOnlyHint: true`.

### `list_files`

List the files saved in the user's Dear Karl Drive folder ("dearkarl").

- **Input**: `{}`
- **Output text**: pretty-printed JSON array of file metadata:
  `{ id, name, mimeType, size, modifiedTime }`
- **structuredContent**: `{ files: [...] }`
- Use the returned `id` (or `name`) with `read_file`.

Example result (from a live call):

```json
{
  "files": [
    {
      "id": "1avTWLqJ13Ni6s8QAzdVEstftp_sNrUw5",
      "name": "zz",
      "mimeType": "text/plain",
      "size": 128,
      "modifiedTime": "2026-10-04T08:07:17.304Z"
    }
  ]
}
```

### `read_file`

Read the text contents of one file.

- **Input**: exactly **one** of
  - `fileId: string` (id from `list_files`), or
  - `name: string` (matched case-insensitively against folder files)
- **Output text**: the file contents
- **structuredContent**: `{ id, name, mimeType, truncated, content }`
- Contents are capped at **256 KB** (`truncated: true` if a larger file was cut).

Errors:

| Condition | Result |
|---|---|
| Both or neither of `fileId`/`name` given | tool result `isError: true`, "Provide exactly one of fileId or name." |
| `name` matches nothing | `isError: true`, "No file named \"…\" found…" |
| Google token cannot be refreshed / Drive rejects it | `ReauthNeededError` → "Google Drive re-authorization required. Log in at https://karl.przemekkudla.pl …" |
| Other Drive failure | `isError: true`, `"Drive error: <message>"` |

---

## Manual testing (curl)

Valid token, full flow against the local dev server:

```bash
TOKEN="karl_3fde080a792ccc20a1f993915fc4d93b337c099dbecdcb1a33cce5a43e71ad6a"
URL=http://localhost:5173/mcp

# 1. initialize (protocol handshake)
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'

# 2. list tools
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 3. list files
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_files","arguments":{}}}'

# 4. read a file by name
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"read_file","arguments":{"name":"zz"}}}'
```

A quick end-to-end token check without the handshake — invalid/revoked/expired
tokens get a bare `401 Unauthorized` on the first message.

---

## Status codes

| Code | Meaning |
|---|---|
| `200` | JSON-RPC result (initialize, tools/list, tools/call) |
| `401` | Missing, unknown, revoked, or expired bearer token (with a `WWW-Authenticate` challenge for OAuth discovery) |
