import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive from "../google/drive";
import sendEmail from "../send-email";

export async function emailHandler(
  env: Env,
  message: ForwardableEmailMessage,
  database: any,
) {
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
    const db = new UsersDB(database);
    const user = await db.getUser(message.from);
    console.info("USER", user);
    if (user) {
      const drive = new GoogleDrive(user?.accessToken);
      try {
        const rootFolder = await drive.getRootFolderId();
        const filename =
          email.subject ?? `${crypto.randomUUID().split("-")[0]}` + ".txt";
        await drive.pushFile(rootFolder, filename, email.text ?? "NONE");
        await sendEmail(env, {
          to: user.email,
          from: "karl@przemekkudla.pl", // must be a verified domain
          subject: "Success",
          text: `The file was created: ${filename}`,
        });
      } catch (e: any) {
        sendEmail(env, {
          to: user.email,
          from: "karl@przemekkudla.pl", // must be a verified domain
          subject: "ERROR 1",
          text: JSON.stringify(e),
        });
        console.error("ERROR:", e);
      }
    }
  } catch (e: any) {
    console.error("EMAIL ERROR:", e);
  }

  // console.log("Received email:", {
  //   from: message.from,
  //   to: message.to,
  //   subject: email.subject,
  //   text: email.text,
  //   html: email.html,
  // });
  // console.log("Email", message.from, email.html);

  // // Route based on recipient
  // if (message.to.includes("support@")) {
  //   await message.forward("przemekkudla@hotmail.com");
  // } else {
  //   await message.forward("pkudla@opera.com");
  // }
}

export default emailHandler;
