import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import GoogleToken from "../google/token";
import { ApiTokensDB } from "../db";
import { createMcpServer } from "./server";
import { sha256Hex } from "./pat";

/**
 * MCP entrypoint. Authenticates the bearer Personal Access Token against D1,
 * resolves it to a user, then serves the MCP protocol statelessly: a fresh
 * server + transport per request (`sessionIdGenerator: undefined`), so a
 * revoked or expired token stops working on the very next request.
 */
export async function mcpHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token)
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });

  const tokensDb = new ApiTokensDB(env.DB);
  const found = await tokensDb.findUserByTokenHash(await sha256Hex(token), Date.now());
  if (!found)
    // Deliberately the same response for unknown, revoked, or expired tokens.
    return new Response("Unauthorized", { status: 401 });

  // Best-effort last_used_at audit trail; never blocks the MCP response.
  ctx.waitUntil(
    tokensDb.touchToken(found.tokenId, Date.now()).catch(() => {}),
  );

  const client = new GoogleToken(env.GOOGLE_CLIENT_SECRET);
  const server = createMcpServer({ user: found.user, client, db: env.DB });
  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless: one server + transport per request, no session ids.
    sessionIdGenerator: undefined,
    // Reply with plain JSON instead of SSE streams: no long-lived stream or
    // keep-alive timer to leak across per-request servers on a stateless worker.
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
