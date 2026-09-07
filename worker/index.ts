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
  async email(message: ForwardableEmailMessage, env, ctx) {
    const allowedSender = "pkudla@list.pl";

    if (message.from.toLowerCase() === allowedSender.toLowerCase()) {
      // Build a reply email
      const replyRaw =
        `From: ${message.to}\r\n` +
        `To: ${message.from}\r\n` +
        `Subject: Re: ${message.headers.get("subject") || "(no subject)"}\r\n` +
        `Content-Type: text/plain; charset="UTF-8"\r\n` +
        `\r\n` +
        `Hello`;

      // EmailMessage from the cloudflare:email module
      const { EmailMessage } = await import("cloudflare:email");
      const reply = new EmailMessage(
        message.to, // from (must be a verified address on your domain)
        message.from, // to
        replyRaw,
      );

      await message.reply(reply);
    } else {
      // Reject with a bounce-style message
      message.setReject("Recipient not found");
    }
  },
} satisfies ExportedHandler<Env>;
