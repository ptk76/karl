// import { getAccessToken } from "./auth";
import PostalMime from "postal-mime";
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
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ) {
    // Parse the raw email message
    const parser = new PostalMime();
    const rawEmail = new Response(message.raw);
    const email = await parser.parse(await rawEmail.arrayBuffer());

    console.log("Received email:", {
      from: message.from,
      to: message.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    console.log("Email", message.from, email.html);

    // Route based on recipient
    if (message.to.includes("support@")) {
      await message.forward("przemekkudla@hotmail.com");
    } else {
      await message.forward("pkudla@opera.com");
    }
  },
} satisfies ExportedHandler<Env>;
