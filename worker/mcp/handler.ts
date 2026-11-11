import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import GoogleToken from "../google/token";
import { ApiTokensDB } from "../db";
import UsersDB, { UserTableRow } from "../db";
import GoogleDrive from "../google/drive";
import { getValidToken } from "../api/utils";
import { buildInstructions, createMcpServer, FolderSummary, RECENT_WINDOW_MS } from "./server";
import { sha256Hex } from "./pat";

/** Never let a slow Drive hold up the handshake longer than this. */
const SUMMARY_TIMEOUT_MS = 2000;

async function isInitialize(request: Request): Promise<boolean> {
  if (request.method !== "POST") return false;
  try {
    const body = await request.clone().json();
    const msgs = Array.isArray(body) ? body : [body];
    return msgs.some((m) => m?.method === "initialize");
  } catch {
    return false;
  }
}

/** Count files in the user's folder; null on any failure or timeout. */
async function folderSummary(deps: {
  user: UserTableRow;
  client: GoogleToken;
  db: Env["DB"];
}): Promise<FolderSummary> {
  const work = (async () => {
    const accessToken = await getValidToken(deps.user, deps.client, new UsersDB(deps.db));
    if (!accessToken) return null;
    const drive = new GoogleDrive(accessToken);
    const files = await drive.listFiles(await drive.getRootFolderId());
    const cutoff = Date.now() - RECENT_WINDOW_MS;
    const recent = files.filter(
      (f) => f.modifiedTime && Date.parse(f.modifiedTime) >= cutoff,
    ).length;
    return { total: files.length, recent };
  })().catch(() => null);
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), SUMMARY_TIMEOUT_MS));
  return Promise.race([work, timeout]);
}

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
  const deps = { user: found.user, client, db: env.DB };
  // Instructions only matter on `initialize`; every other request skips the
  // Drive round-trip.
  const instructions = (await isInitialize(request))
    ? buildInstructions(await folderSummary(deps))
    : undefined;
  const server = createMcpServer(deps, { instructions });
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
