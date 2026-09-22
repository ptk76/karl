import loginHandler from "./api/login";
import emailHandler from "./api/email";
import sendEmail from "./send-email";

class RequestType {
  readonly #path;
  constructor(request: Request) {
    try {
      const url = new URL(request.url);
      this.#path = url.pathname;
    } catch {
      this.#path = "";
    }
  }

  isLogin() {
    if (this.#path.includes("/login")) return true;
    return false;
  }

  isMCP() {
    if (this.#path.includes("/mcp")) return true;
    return false;
  }

  isTest() {
    if (this.#path.includes("/test")) return true;
    return false;
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

    if (requestType.isTest()) {
      const result = sendEmail(env, {
        to: "pkudla@list.pl",
        from: "karl@przemekkudla.pl", // must be a verified domain
        subject: "Welcome!",
        html: "<h1>Hello!</h1>",
        text: "Hello!",
      });

      return new Response(`Email sent: ${result}`);
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
    ctx.waitUntil(emailHandler(env, message, env.DB));
  },
} satisfies ExportedHandler<Env>;
