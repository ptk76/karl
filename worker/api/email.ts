import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive from "../google/drive";
import sendEmail, { ElasticEmailCredentials } from "../send-email";

export async function emailHandler(env: Env, message: ForwardableEmailMessage) {
  const secret = JSON.parse(env.ELASTIC_SECRET) as ElasticEmailCredentials;
  try {
    // Parse the raw email message
    const parser = new PostalMime();
    // const rawEmail = new Response(message.raw);
    const rawEmail = new Response(message.raw as unknown as BodyInit);
    const email = await parser.parse(await rawEmail.arrayBuffer());
    console.log("Received email:", {
      from: message.from,
      to: message.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    const db = new UsersDB(env.DB);
    const user = await db.getUser(message.from);
    console.info("USER", user);
    if (user) {
      const drive = new GoogleDrive(user?.accessToken);
      try {
        const rootFolder = await drive.getRootFolderId();
        const filename =
          email.subject ?? `${crypto.randomUUID().split("-")[0]}` + ".txt";
        await drive.pushFile(rootFolder, filename, email.text ?? "NONE");
        await sendEmail(secret, {
          to: user.email,
          subject: "Success",
          text: `The file was created: ${filename}`,
        });
      } catch (e: unknown) {
        const error = e as Error;
        await sendEmail(secret, {
          to: user.email,
          subject: "EMAIL ERROR 1",
          text: JSON.stringify(error.message),
        });
        console.error("ERROR:", e);
      }
    }
  } catch (e: unknown) {
    const error = e as Error;
    await sendEmail(secret, {
      to: message.from,
      subject: "EMAIL ERROR 2",
      text: JSON.stringify(error.message),
    });
    console.error("EMAIL ERROR:", e);
  }
}

export default emailHandler;
