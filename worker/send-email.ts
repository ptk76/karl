// interface ElasticEmailCredentials {
//   apiKey: string; // NOT the SMTP password — get this from Elastic Email dashboard → Settings → API
//   username: string;
// }

// async function sendEmail_(
//   creds: ElasticEmailCredentials,
//   to: string,
//   subject: string,
//   text: string,
// ): Promise<void> {
//   const body = {
//     Recipients: [{ Email: to }],
//     Content: {
//       From: creds.username,
//       Subject: subject,
//       Body: [
//         {
//           ContentType: "PlainText",
//           Content: text,
//         },
//       ],
//     },
//   };
//   console.info("BODY", body);
//   const res = await fetch("https://api.elasticemail.com/v4/emails", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-ElasticEmail-ApiKey": creds.apiKey,
//     },
//     body: JSON.stringify(body),
//   });

//   if (!res.ok) {
//     const errText = await res.text();
//     throw new Error(`Email send failed: ${res.status} ${errText}`);
//   }

//   const data = await res.json();
//   console.log("Email sent:", data);
// }

async function sendEmail(
  env: Env,
  email: EmailMessageBuilder,
): Promise<EmailSendResult> {
  const response = await env.EMAIL.send(email);
  return response;
}

export default sendEmail;
