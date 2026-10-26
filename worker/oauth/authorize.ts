import {
  AuthorizationError,
  CimdFetchError,
  type AuthRequest,
  type ClientInfo,
  type OAuthHelpers,
} from "@cloudflare/workers-oauth-provider";
import UsersDB, { type UserTableRow } from "../db";
import { getSid } from "../api/utils";
import type { McpProps } from "../mcp/handler";
import { LOGIN_RETURN_PARAM } from "../../shared/api";

/**
 * The OAuth authorization endpoint (`/authorize`): the page an MCP client
 * (Claude Desktop, claude.ai, …) opens in the browser to connect to Dear Karl.
 *
 * The user is identified by the existing `sid` session cookie — the same
 * Google login the web app uses. Without a session they are sent to the web
 * app to sign in, which brings them back here afterwards. With one, they get
 * a consent page; approving issues a grant whose props carry their email, and
 * the MCP handler resolves that to their Drive on every request.
 */
export async function authorizeHandler(
  request: Request,
  env: Env,
  oauth: OAuthHelpers,
): Promise<Response> {
  try {
    if (request.method === "POST") return await decide(request, env, oauth);
    if (request.method !== "GET")
      return new Response("Method not allowed", { status: 405 });

    // Validate first: never send anyone to sign in for a bogus request.
    const authRequest = await oauth.parseAuthRequest(request);

    const user = await sessionUser(request, env.DB);
    if (!user) {
      const url = new URL(request.url);
      const signIn = new URL("/", url.origin);
      signIn.searchParams.set(LOGIN_RETURN_PARAM, url.pathname + url.search);
      return Response.redirect(signIn.href, 302);
    }

    const client = await oauth.lookupClient(authRequest.clientId);
    if (!client) return messagePage("This app is not registered.", 400);

    const consent = await oauth.beginConsent(authRequest);
    consent.headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(
      consentPage(client, authRequest, consent.handle, user.email),
      { headers: consent.headers },
    );
  } catch (error) {
    // Redirect back only once the library vouches for the redirect URI.
    if (error instanceof AuthorizationError && error.redirectUri) {
      const redirect = new URL(error.redirectUri);
      redirect.searchParams.set("error", error.code);
      redirect.searchParams.set("error_description", error.description);
      if (error.state) redirect.searchParams.set("state", error.state);
      if (error.issuer) redirect.searchParams.set("iss", error.issuer);
      return Response.redirect(redirect.href, 302);
    }
    if (error instanceof AuthorizationError)
      return messagePage(
        `${error.description} Start connecting again from your app.`,
        400,
      );
    if (error instanceof CimdFetchError)
      return messagePage("This app could not be verified.", 400);
    throw error;
  }
}

/** POST /authorize — the consent form's Allow / Deny. */
async function decide(
  request: Request,
  env: Env,
  oauth: OAuthHelpers,
): Promise<Response> {
  const form = await request.formData();
  const handle = String(form.get("handle") ?? "");

  if (form.get("decision") !== "approve") {
    const denied = await oauth.denyConsent(request, handle);
    return new Response(null, { status: 302, headers: denied.headers });
  }

  // Re-check the session: it may have ended since the page was shown, and the
  // grant must belong to whoever is signed in now.
  const user = await sessionUser(request, env.DB);
  if (!user)
    return messagePage(
      "Your Dear Karl session has ended. Start connecting again from your app.",
      401,
    );

  const approved = await oauth.approveConsent(request, handle);
  const props: McpProps = { email: user.email };
  const { redirectTo } = await oauth.completeAuthorization({
    request: approved.request,
    userId: user.email,
    metadata: {},
    scope: approved.request.scope,
    props,
  });
  approved.headers.set("Location", redirectTo);
  return new Response(null, { status: 302, headers: approved.headers });
}

async function sessionUser(
  request: Request,
  db: D1Database,
): Promise<UserTableRow | null> {
  const sid = getSid(request);
  if (!sid) return null;
  const user = await new UsersDB(db).getUserBySid(sid);
  return user?.email ? user : null;
}

/** Client name, URIs and scopes come from dynamic registration: attacker-chosen. */
const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const LOOPBACK = /^(localhost|127(\.\d{1,3}){3}|\[::1\])$/;

function consentPage(
  client: ClientInfo,
  request: AuthRequest,
  handle: string,
  email: string,
): string {
  const name = escape(client.clientName ?? client.clientId);
  const redirectHost = new URL(request.redirectUri).hostname;
  const local = LOOPBACK.test(redirectHost);
  return layout(
    `Connect ${name}`,
    `<h1>Allow <strong>${name}</strong> to read your Dear Karl files?</h1>
<p>Signed in as <strong>${escape(email)}</strong>.</p>
<p>${name} will be able to list and read the files in your <code>dearkarl</code>
Google Drive folder. It cannot change or delete anything.</p>
<p class="muted">This app registered itself; its name is not verified.
Access will be sent to <strong>${escape(redirectHost)}</strong>.</p>
${local ? '<p class="warn"><strong>This sends access to an app on your computer.</strong> Continue only if you just started connecting from it.</p>' : ""}
<form method="post">
  <input type="hidden" name="handle" value="${escape(handle)}">
  <button name="decision" value="approve">Allow</button>
  <button name="decision" value="deny" class="secondary">Deny</button>
</form>`,
  );
}

function messagePage(message: string, status: number): Response {
  return new Response(layout("Dear Karl", `<p>${escape(message)}</p>`), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "frame-ancestors 'none'",
    },
  });
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { margin: 0; background: black; color: #eee; font-family: system-ui, Avenir, Helvetica, Arial, sans-serif; }
  main { max-width: 32rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { font-size: 1.4rem; font-weight: 500; }
  .muted { color: #aaa; font-size: 0.9rem; }
  .warn { color: #ffcc66; }
  button { font: inherit; padding: 0.5rem 1.25rem; margin-right: 0.5rem; border-radius: 6px; border: 1px solid #eee; background: #eee; color: black; cursor: pointer; }
  button.secondary { background: transparent; color: #eee; }
</style>
<main>
${body}
</main>
</html>`;
}
