import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive from "../google/drive";
import sendEmail, { ElasticEmailCredentials } from "../send-email";
import { authError } from "./messages";

export async function emailHandler(env: Env, message: ForwardableEmailMessage) {
  const secret = JSON.parse(env.ELASTIC_SECRET) as ElasticEmailCredentials;
  // Parse the raw email message
  const parser = new PostalMime();
  // const rawEmail = new Response(message.raw);
  const rawEmail = new Response(message.raw as unknown as BodyInit);
  const email = await parser.parse(await rawEmail.arrayBuffer());
  // console.log("Received email:", {
  //   from: message.from,
  //   to: message.to,
  //   subject: email.subject,
  //   text: email.text,
  //   html: email.html,
  // });
  const db = new UsersDB(env.DB);
  const user = await db.getUser(message.from);
  // console.info("USER", user);
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
      // const error = e as Error;
      await sendEmail(secret, {
        to: user.email,
        subject: "Access Denied",
        text: authError,
      });
      // console.error("ERROR:", e);
    }
  }
}

export default emailHandler;
