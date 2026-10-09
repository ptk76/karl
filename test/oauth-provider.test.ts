// @vitest-environment node
// The provider hashes and encrypts with WebCrypto; run against Node's, not jsdom's.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerFor, resolvePat } from "../worker/oauth/provider";

// End to end through the real OAuth provider: discovery, dynamic client
// registration, /authorize with consent, the token exchange, and /mcp with both
// an OAuth access token and a Personal Access Token. The MCP handler is
// replaced by an echo of ctx.props, and D1 by the mocked DB classes below.
const mocks = vi.hoisted(() => ({
  getUserBySid: vi.fn(),
  findUserByTokenHash: vi.fn(),
}));

vi.mock("../worker/db", () => ({
  default: class {
    getUserBySid = mocks.getUserBySid;
  },
  ApiTokensDB: class {
    findUserByTokenHash = mocks.findUserByTokenHash;
  },
}));

vi.mock("../worker/mcp/handler", () => ({
  mcpHandler: (_req: Request, _env: unknown, ctx: { props: unknown }) =>
    Response.json({ props: ctx.props }),
}));

/** Just enough of KVNamespace for the provider: get/put/delete/list with metadata. */
function memoryKv() {
  const store = new Map<string, { value: string; metadata?: unknown }>();
  return {
    async get(key: string, opts?: unknown) {
      const entry = store.get(key);
      if (!entry) return null;
      const type = typeof opts === "string" ? opts : (opts as { type?: string })?.type;
      return type === "json" ? JSON.parse(entry.value) : entry.value;
    },
    async put(key: string, value: string, opts?: { metadata?: unknown }) {
      store.set(key, { value, metadata: opts?.metadata });
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list(opts: { prefix?: string } = {}) {
      const keys = [...store.entries()]
        .filter(([name]) => name.startsWith(opts.prefix ?? ""))
        .map(([name, { metadata }]) => ({ name, metadata }));
      return { keys, list_complete: true, cursor: "" };
    },
  };
}

const ORIGIN = "https://karl.example.com";
const REDIRECT = "https://claude.example.com/api/mcp/auth_callback";
const USER = { email: "user@example.com", session_id: "sid-1" };

let env: Env;
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as never;
const call = (path: string, init?: RequestInit) =>
  providerFor(ORIGIN).fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);

async function pkce() {
  const verifier = crypto.randomUUID() + crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

async function register() {
  const res = await call("/oauth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Claude <script>",
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: "none",
    }),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { client_id: string }).client_id;
}

function authorizePath(clientId: string, challenge: string) {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT,
    state: "state-1",
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "files:read",
    resource: `${ORIGIN}/mcp`,
  });
  return `/authorize?${q}`;
}

/** Cookie header to send back, from a response's Set-Cookie headers. */
function cookiesFrom(res: Response, extra: string) {
  const set = res.headers.getSetCookie().map((c) => c.split(";")[0]);
  return [extra, ...set].join("; ");
}

beforeEach(() => {
  vi.resetAllMocks();
  env = { OAUTH_KV: memoryKv(), DB: {}, GOOGLE_CLIENT_SECRET: "{}" } as never;
  mocks.getUserBySid.mockImplementation(async (sid: string) =>
    sid === USER.session_id ? USER : null,
  );
  mocks.findUserByTokenHash.mockResolvedValue(null);
});

describe("discovery", () => {
  it("challenges an unauthenticated /mcp request with the resource metadata URL", async () => {
    const res = await call("/mcp", { method: "POST" });
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain(
      `resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/mcp"`,
    );
  });

  it("publishes protected resource and authorization server metadata", async () => {
    const resource = await (await call("/.well-known/oauth-protected-resource/mcp")).json();
    expect(resource).toMatchObject({
      resource: `${ORIGIN}/mcp`,
      authorization_servers: [ORIGIN],
    });

    const as = await (await call("/.well-known/oauth-authorization-server")).json();
    expect(as).toMatchObject({
      issuer: ORIGIN,
      authorization_endpoint: `${ORIGIN}/authorize`,
      token_endpoint: `${ORIGIN}/oauth/token`,
      registration_endpoint: `${ORIGIN}/oauth/register`,
    });
  });
});

describe("authorization code flow", () => {
  it("connects a dynamically registered client end to end", async () => {
    const clientId = await register();
    const { verifier, challenge } = await pkce();
    const sid = `sid=${USER.session_id}`;

    // Consent page, for the signed-in user, with the client name escaped.
    const page = await call(authorizePath(clientId, challenge), {
      headers: { Cookie: sid },
    });
    expect(page.status).toBe(200);
    expect(page.headers.get("X-Frame-Options")).toBe("DENY");
    const html = await page.text();
    expect(html).toContain(USER.email);
    expect(html).toContain("Claude &#60;script&#62;");
    expect(html).not.toContain("<script>");
    const handle = /name="handle" value="([^"]+)"/.exec(html)![1];

    // Allow.
    const approved = await call("/authorize", {
      method: "POST",
      headers: {
        Cookie: cookiesFrom(page, sid),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ handle, decision: "approve" }),
    });
    expect(approved.status).toBe(302);
    const back = new URL(approved.headers.get("Location")!);
    expect(back.origin + back.pathname).toBe(REDIRECT);
    expect(back.searchParams.get("state")).toBe("state-1");
    const code = back.searchParams.get("code")!;

    // Token exchange.
    const tokenRes = await call("/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: REDIRECT,
        code_verifier: verifier,
      }),
    });
    expect(tokenRes.status).toBe(200);
    const tokens = (await tokenRes.json()) as { access_token: string; refresh_token: string };
    expect(tokens.refresh_token).toBeTruthy();

    // The access token reaches the MCP handler as the user's email.
    const mcp = await call("/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    expect(mcp.status).toBe(200);
    expect(await mcp.json()).toEqual({ props: { email: USER.email } });
  });

  it("sends a signed-out user to the web app to log in, then back", async () => {
    const clientId = await register();
    const path = authorizePath(clientId, (await pkce()).challenge);

    const res = await call(path);

    expect(res.status).toBe(302);
    const login = new URL(res.headers.get("Location")!);
    expect(login.origin + login.pathname).toBe(`${ORIGIN}/`);
    expect(login.searchParams.get("next")).toBe(path);
  });

  it("redirects a denial back to the client with access_denied", async () => {
    const clientId = await register();
    const sid = `sid=${USER.session_id}`;
    const page = await call(authorizePath(clientId, (await pkce()).challenge), {
      headers: { Cookie: sid },
    });
    const handle = /name="handle" value="([^"]+)"/.exec(await page.text())![1];

    const denied = await call("/authorize", {
      method: "POST",
      headers: {
        Cookie: cookiesFrom(page, sid),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ handle, decision: "deny" }),
    });

    expect(denied.status).toBe(302);
    const back = new URL(denied.headers.get("Location")!);
    expect(back.searchParams.get("error")).toBe("access_denied");
    expect(back.searchParams.get("state")).toBe("state-1");
  });

  it("refuses an approval posted without the consent page's cookie", async () => {
    const clientId = await register();
    const sid = `sid=${USER.session_id}`;
    const page = await call(authorizePath(clientId, (await pkce()).challenge), {
      headers: { Cookie: sid },
    });
    const handle = /name="handle" value="([^"]+)"/.exec(await page.text())![1];

    const forged = await call("/authorize", {
      method: "POST",
      headers: { Cookie: sid, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ handle, decision: "approve" }),
    });

    expect(forged.status).toBe(400);
    expect(forged.headers.get("Location")).toBeNull();
  });

  it("renders an unknown client locally instead of redirecting", async () => {
    const res = await call(authorizePath("no-such-client", (await pkce()).challenge), {
      headers: { Cookie: `sid=${USER.session_id}` },
    });
    expect(res.status).toBe(400);
    expect(res.headers.get("Location")).toBeNull();
  });
});

describe("Personal Access Tokens", () => {
  it("still authenticate /mcp", async () => {
    mocks.findUserByTokenHash.mockResolvedValue({ user: USER, tokenId: 7 });

    const res = await call("/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer karl_abc" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ props: { email: USER.email, patId: 7 } });
  });

  it("are rejected when unknown, revoked or expired", async () => {
    const res = await call("/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer karl_revoked" },
    });
    expect(res.status).toBe(401);
  });

  it("skip the database for anything that is not a karl_ token", async () => {
    expect(await resolvePat("something-else", {} as never)).toBeNull();
    expect(mocks.findUserByTokenHash).not.toHaveBeenCalled();
  });
});
