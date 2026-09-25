import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive from "../google/drive";
import sendEmail, {
  ElasticEmailCredentials,
  sendDiagnosticEmail,
} from "../send-email";
import { authError, unknownUser } from "./messages";

export async function emailHandler(env: Env, message: ForwardableEmailMessage) {
  const secret = JSON.parse(env.ELASTIC_SECRET) as ElasticEmailCredentials;
  // Parse the raw email message
  const parser = new PostalMime();
  const rawEmail = new Response(message.raw as unknown as BodyInit);
  const email = await parser.parse(await rawEmail.arrayBuffer());
  const db = new UsersDB(env.DB);
  const user = await db.getUser(message.from);
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
    } catch (e: any) {
      console.info("USER email", email, "MSG", message);
      await sendEmail(secret, {
        to: message.from,
        subject: authError.subject,
        text: authError.message,
      });
    }
  } else {
    await sendEmail(secret, {
      to: message.from,
      subject: unknownUser.subject,
      text: unknownUser.message,
    });
  }
}

export default emailHandler;
