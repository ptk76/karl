import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive from "../google/drive";

export async function emailHandler(
  message: ForwardableEmailMessage,
  dbSrc: Env["DB"],
) {
  // Parse the raw email message
  const parser = new PostalMime();
  // const rawEmail = new Response(message.raw);
  const rawEmail = new Response(message.raw as unknown as BodyInit);
  const email = await parser.parse(await rawEmail.arrayBuffer());
  console.info("EMAIL", message.from);
  if (message.from === "pkudla@list.pl") {
    const db = new UsersDB(dbSrc);
    const user = await db.getUser(message.from);
    console.info("USER", user);
    if (user) {
      const drive = new GoogleDrive(user?.accessToken);
      try {
        const rootFolder = await drive.getRootFolderId();
        await drive.pushFile(
          rootFolder,
          email.subject ?? `${crypto.randomUUID().split("-")[0]}` + ".txt",
          email.text ?? "NONE",
        );
      } catch (e: any) {
        console.error("ERROR:", e);
      }
    }
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
