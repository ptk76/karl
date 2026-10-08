import {
  ApiTokenSummary,
  isCreateTokenRequest,
  isRevokeTokenRequest,
} from "../../shared/api";
import UsersDB, { ApiTokensDB } from "../db";
import { generateToken, sha256Hex } from "../mcp/pat";
import { getPayload, getSid } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Personal Access Token management. Authenticated by the browser session
 * (`sid` cookie) — these endpoints are never callable with a PAT.
 *
 * Plaintext tokens are generated here and returned once; only their SHA-256
 * hash is persisted.
 */
export async function tokenHandler(request: Request, db: Env["DB"]): Promise<Response> {
  const sid = getSid(request);
  if (!sid) return new Response("Page not found.", { status: 404 });

  const usersDb = new UsersDB(db);
  const user = await usersDb.getUserBySid(sid);
  if (!user || !user.email) return new Response("Page not found.", { status: 404 });

  const tokensDb = new ApiTokensDB(db);

  if (request.method === "GET") {
    const tokens = await tokensDb.listActiveTokens(user.email, Date.now());
    const summaries: ApiTokenSummary[] = tokens.map((t) => ({
      id: t.id,
      name: t.name,
      prefix: t.token_prefix,
      createdAt: t.created_at,
      expiresAt: t.expires_at,
      lastUsedAt: t.last_used_at,
    }));
    return new Response(JSON.stringify(summaries), { status: 200 });
  }

  const payload = await getPayload(request);

  // Revoke first: `{ id }` must never be interpreted as a create payload.
  if (request.method === "POST" && isRevokeTokenRequest(payload)) {
    const revoked = await tokensDb.revokeToken(user.email, payload.id);
    return new Response(JSON.stringify({ ok: revoked }), { status: revoked ? 200 : 404 });
  }

  if (request.method === "POST" && isCreateTokenRequest(payload)) {
    const rawToken = generateToken();
    const now = Date.now();
    const expiresAt =
      typeof payload.expiresInDays === "number" && payload.expiresInDays > 0
        ? now + payload.expiresInDays * DAY_MS
        : null;

    const id = await tokensDb.createToken({
      email: user.email,
      name: payload.name ?? "Default",
      tokenHash: await sha256Hex(rawToken),
      tokenPrefix: rawToken.slice(0, Math.min(12, rawToken.length)),
      createdAt: now,
      expiresAt,
    });

    const created = {
      id,
      name: payload.name ?? "Default",
      prefix: rawToken.slice(0, Math.min(12, rawToken.length)),
      createdAt: now,
      expiresAt,
      lastUsedAt: null,
      token: rawToken,
    };
    return new Response(JSON.stringify(created), { status: 200 });
  }

  return new Response("Page not found.", { status: 404 });
}
