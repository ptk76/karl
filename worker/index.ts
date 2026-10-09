import emailHandler from "./api/email";
import ErrorResponse, { ApiErrors } from "./api/errors";
import { readElasticCredentials, sendDiagnosticEmail } from "./send-email";
import { providerFor } from "./oauth/provider";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const secret = env.GOOGLE_CLIENT_SECRET;
    if (!secret)
      return new Response(JSON.stringify({ error: "Missing secret" }), {
        status: 500,
      });

    try {
      // The OAuth provider owns /mcp (bearer check), its own endpoints
      // (/.well-known/*, /oauth/token, /oauth/register) and hands everything
      // else to /authorize or the login API.
      return await providerFor(new URL(request.url).origin).fetch(
        request,
        env,
        ctx,
      );
    } catch (error) {
      console.error("login handler failed", error);
      return new ErrorResponse(ApiErrors.InternalError);
    }
  },
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ) {
    const creds = readElasticCredentials(env.ELASTIC_SECRET);
    if (!creds) {
      console.error("ELASTIC_SECRET is missing or malformed");
      return;
    }

    // waitUntil() returns immediately, so a try/catch around it would never
    // see a rejection — the handler has to catch on the promise itself.
    ctx.waitUntil(
      emailHandler(env, message, creds).catch((error) =>
        sendDiagnosticEmail(
          creds,
          "ERROR",
          error?.message ?? String(error),
          (env as { DIAGNOSTIC_EMAIL?: string }).DIAGNOSTIC_EMAIL,
        ),
      ),
    );
  },
} satisfies ExportedHandler<Env>;
