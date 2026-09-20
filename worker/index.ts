import loginHandler from "./api/login";
import emailHandler from "./api/email";
import GoogleDrive from "./google/drive";
import UsersDB from "./db";
import { isRequestPayloadTest, RequestPayload } from "./payload-types";

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
      const payload = (await request.json()) as RequestPayload;

      if (isRequestPayloadTest(payload)) {
        const db = new UsersDB(env.DB);

        const user = await db.getUser(payload.email);
        if (user) {
          const drive = new GoogleDrive(user?.accessToken);

          try {
            const rootFolder = await drive.getRootFolderId();

            console.info("FOLDER", rootFolder);
            console.info("FILES", await drive.fetchAllFiles(rootFolder));
            console.info(
              "NEW",
              await drive.pushFile(
                rootFolder,
                `${crypto.randomUUID().split("-")[0]}.txt`,
                `ala kota i kota o imieniu ${crypto.randomUUID()}`,
              ),
            );
          } catch (e: any) {
            console.info("ERROR", e);
          }

          return new Response(JSON.stringify({ msg: "Test OK" }), {
            status: 200,
          });
        }
      }
      return new Response(JSON.stringify({ err: "Wrong test" }), {
        status: 400,
      });
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
    ctx.waitUntil(emailHandler(message, env.DB));
  },
} satisfies ExportedHandler<Env>;
