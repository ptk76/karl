export interface Email {
  to: string;
  from?: string;
  subject: string;
  text: string;
}

export interface ElasticEmailCredentials {
  apiKey: string; // NOT the SMTP password — get this from Elastic Email dashboard → Settings → API
  username: string;
}

async function sendEmail(
  creds: ElasticEmailCredentials,
  email: Email,
): Promise<void> {
  const body = {
    Recipients: [{ Email: email.to }],
    Content: {
      From: creds.username,
      Subject: email.subject,
      Body: [
        {
          ContentType: "HTML",
          Content: email.text,
        },
      ],
    },
    Options: {
      TrackOpens: "false",
      TrackClicks: "flase",
    },
  };
  console.info("BODY", body);
  try {
    const res = await fetch("https://api.elasticemail.com/v4/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ElasticEmail-ApiKey": creds.apiKey,
      },
      body: JSON.stringify(body),
    });
    console.info("RESP", res);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Email send failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    console.log("Email sent:", data);
  } catch (e) {
    console.info("ERROR !", e);
  }
}

export async function sendDiagnosticEmail(
  env: Env,
  subject: string,
  text: string,
): Promise<EmailSendResult> {
  const response = await env.EMAIL.send({
    to: "przemekkudla@hotmail.com",
    from: "logger@przemekkudla.pl", // must be a verified domain
    subject,
    text,
  });
  return response;
}

export default sendEmail;
