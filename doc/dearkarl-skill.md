---
name: dearkarl-mcp
description: How to use the read-only Dear Karl MCP server to list and read files from the user's dearkarl Google Drive folder. Load this before calling /mcp.
---

# Using Dear Karl MCP

You have access to a **read-only MCP server** that reads files out of a Google
Drive folder called `dearkarl`. You can do exactly two things: **list** the
files, or **read** one file's text. Nothing you do can create, edit, or delete
anything.

## 1. Connect

- **Endpoint:** `https://karl.przemekkudla.pl/mcp` (local dev: `http://localhost:5173/mcp`)
- **Auth:** `Authorization: Bearer karl_<token>` header on every request
- **Headers:** `Content-Type: application/json`, `Accept: application/json, text/event-stream`
- **No sessions** — each request is independent; no session id to carry.

## 2. Flow (JSON-RPC 2.0 over Streamable HTTP)

1. `initialize` — request protocol version `2025-06-18`
2. `notifications/initialized` — optional
3. `tools/list` — optional; shows the two tools
4. `tools/call` — run a tool

## 3. Tools

### `list_files`

No arguments. Returns metadata for every file:
`id`, `name`, `mimeType`, `size`, `modifiedTime` (never contents).

### `read_file`

Supply **exactly one** of:

- `fileId` (id from `list_files`, preferred), or
- `name` (matched case-insensitively)

Returns the file's text, capped at 256 KB (the `truncated` flag says if it was cut).

## 4. Example (curl)

```bash
URL=https://karl.przemekkudla.pl/mcp
TOKEN="karl_<your token>"

# handshake
curl -sS -X POST "$URL" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"assistant","version":"1.0"}}}'

# list files
curl -sS -X POST "$URL" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_files","arguments":{}}}'

# read a file by name
curl -sS -X POST "$URL" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"read_file","arguments":{"name":"zz"}}}'
```

## 5. Reading results & errors

| What you see | Meaning | What to do |
|---|---|---|
| `HTTP 200` | JSON-RPC result; answer under `.result` | Read it |
| `HTTP 401` | Missing, unknown, revoked, or expired token | Ask the user for a valid token |
| `result.isError = true` | Tool-level failure; message in `content[0].text` | Read and report the message |
| `"Drive re-authorization required"` | The user's Google access expired | Stop; tell the user to log in again at `karl.przemekkudla.pl`, then retry |

## 6. Rules

- Only the two tools above exist — don't attempt any other operation.
- Always pass exactly one of `fileId`/`name` to `read_file`.
- Prefer `fileId` from `list_files` over `name` lookups.
- Never echo the token into outputs, logs, or other tools.
