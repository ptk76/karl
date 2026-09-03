// import { getAccessToken } from "./auth";
import { getGoogleAccessToken } from "./google-auth";
export default {
  async fetch(request: Request, env: Env) {
    const payload = await request.json();
    console.info("FETCH", payload);
    // const token = await getAccessToken();
    console.info("ENV:", env);
    console.info(
      "GOOGLE TOKEN",
      await getGoogleAccessToken(
        env as unknown as any,
        "https://www.googleapis.com/auth/drive.readonly",
      ),
    );
    return new Response(JSON.stringify({ token: "EMPTY" }), { status: 200 });
  },
  async email(message: ForwardableEmailMessage, env: Env) {
    console.info("reveived!");
    message.setReject("karl, wrong email");
    return;
  },
} satisfies ExportedHandler<Env>;
