import {
  OAuthProvider,
  getOAuthApi,
  type OAuthHelpers,
  type OAuthProviderOptions,
} from "@cloudflare/workers-oauth-provider";
import { ApiTokensDB } from "../db";
import { sha256Hex } from "../mcp/pat";
import { mcpHandler, type McpProps } from "../mcp/handler";
import { authorizeHandler } from "./authorize";
import loginHandler from "../api/login";
import {
  AUTHORIZE_PATH,
  MCP_PATH,
  OAUTH_REGISTER_PATH,
  OAUTH_TOKEN_PATH,
} from "../../shared/api";

/** The single scope MCP clients are granted: read the user's dearkarl folder. */
export const MCP_SCOPE = "files:read";

/**
 * Resolve a Personal Access Token (`karl_…`) to MCP props. Called by the
 * provider only for bearer tokens it did not issue itself, so PATs keep
 * working next to OAuth access tokens.
 */
export async function resolvePat(
  token: string,
  db: D1Database,
): Promise<McpProps | null> {
  if (!token.startsWith("karl_")) return null;
  const found = await new ApiTokensDB(db).findUserByTokenHash(
    await sha256Hex(token),
    Date.now(),
  );
  return found ? { email: found.user.email, patId: found.tokenId } : null;
}

/**
 * Provider options for one origin. The resource (token audience) and issuer
 * must be absolute URLs, and the worker is reachable on more than one origin
 * (production, workers.dev, localhost in dev), so they are derived from the
 * request origin rather than hard-coded.
 */
function optionsFor(origin: string): OAuthProviderOptions<Env> {
  const resource = `${origin}${MCP_PATH}`;
  return {
    apiRoute: MCP_PATH,
    apiHandler: { fetch: mcpHandler },
    defaultHandler: {
      fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === AUTHORIZE_PATH)
          return authorizeHandler(request, env, helpersFor(url.origin, env));
        return loginHandler(request, env.GOOGLE_CLIENT_SECRET, env.DB);
      },
    },
    authorizeEndpoint: AUTHORIZE_PATH,
    tokenEndpoint: OAUTH_TOKEN_PATH,
    clientRegistrationEndpoint: OAUTH_REGISTER_PATH,
    scopesSupported: [MCP_SCOPE],
    resourceMetadata: {
      resource,
      authorization_servers: [origin],
      scopes_supported: [MCP_SCOPE],
      resource_name: "Dear Karl",
    },
    async resolveExternalToken({ token, env }) {
      const props = await resolvePat(token, env.DB);
      return props ? { props, audience: resource } : null;
    },
  };
}

const options = new Map<string, OAuthProviderOptions<Env>>();
const providers = new Map<string, OAuthProvider<Env>>();

function cachedOptions(origin: string): OAuthProviderOptions<Env> {
  let o = options.get(origin);
  if (!o) {
    o = optionsFor(origin);
    options.set(origin, o);
  }
  return o;
}

export function providerFor(origin: string): OAuthProvider<Env> {
  let p = providers.get(origin);
  if (!p) {
    p = new OAuthProvider<Env>(cachedOptions(origin));
    providers.set(origin, p);
  }
  return p;
}

/**
 * OAuth helpers bound to this origin's issuer. Deliberately not
 * `env.OAUTH_PROVIDER`: the provider sets that once per isolate, so with more
 * than one origin it could carry another origin's issuer.
 */
function helpersFor(origin: string, env: Env): OAuthHelpers {
  return getOAuthApi(cachedOptions(origin), env);
}
