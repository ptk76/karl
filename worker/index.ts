import loginHandler from "./api/login";
import emailHandler from "./api/email";
import { readElasticCredentials, sendDiagnosticEmail } from "./send-email";

class RequestType {
  readonly #path;
  constructor(request: Request) {
    try {
      const url = new URL(request.url);
      this.#path = url.pathname.replace(/\/+$/, "") || "/";
    } catch {
      this.#path = "";
    }
  }

  isLogin() {
    return this.#path === "/login" || this.#path === "/api/login";
  }

  isMCP() {
    return this.#path === "/mcp" || this.#path === "/api/mcp";
  }

  isTest() {
    return this.#path === "/test" || this.#path === "/api/test";
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const secret = env.GOOGLE_CLIENT_SECRET;
    if (!secret)
      return new Response(JSON.stringify({ error: "Missing secret" }), {
        status: 500,
      });

    const requestType = new RequestType(request);

    if (requestType.isLogin()) return loginHandler(request, secret, env.DB);

    // TODO(pkudla) To be removed
    if (requestType.isTest()) {
    }

    return new Response(JSON.stringify({ error: "Page not found" }), {
      status: 404,
    });
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
