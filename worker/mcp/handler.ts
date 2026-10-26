import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import GoogleToken from "../google/token";
import UsersDB, { ApiTokensDB } from "../db";
import { createMcpServer } from "./server";

/** What the MCP handler finds in `ctx.props`, however the request was authenticated. */
export type McpProps = {
  email: string;
  /** Set only for Personal Access Tokens, so the handler can touch last_used_at. */
  patId?: number;
};

/**
 * MCP entrypoint. Reached only through the OAuth provider
 * (`worker/oauth/provider.ts`), which has already authenticated the bearer
 * token — an OAuth access token or a Personal Access Token — and put the
 * owner in `ctx.props`. Serves the MCP protocol statelessly: a fresh server +
 * transport per request (`sessionIdGenerator: undefined`), so a revoked or
 * expired token stops working on the very next request.
 */
export async function mcpHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const props = (ctx as ExecutionContext<McpProps>).props;
  const user = props?.email ? await new UsersDB(env.DB).getUser(props.email) : null;
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Best-effort last_used_at audit trail; never blocks the MCP response.
  if (props.patId !== undefined)
    ctx.waitUntil(
      new ApiTokensDB(env.DB).touchToken(props.patId, Date.now()).catch(() => {}),
    );

  const client = new GoogleToken(env.GOOGLE_CLIENT_SECRET);
  const server = createMcpServer({ user, client, db: env.DB });
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
