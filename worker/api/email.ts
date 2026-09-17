import PostalMime from "postal-mime";

export async function emailHandler(message: ForwardableEmailMessage) {
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
  console.log("Email", message.from, email.html);

  // Route based on recipient
  if (message.to.includes("support@")) {
    await message.forward("przemekkudla@hotmail.com");
  } else {
    await message.forward("pkudla@opera.com");
  }
}

export default emailHandler;
