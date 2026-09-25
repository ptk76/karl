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
    // Options: {
    //   TrackOpens: "false",
    //   TrackClicks: "false",
    // },
  };
  try {
    const res = await fetch("https://api.elasticemail.com/v4/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ElasticEmail-ApiKey": creds.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Email send failed: ${res.status} ${errText}`);
    }
  } catch (e: any) {
    console.info("EMAIL ERROR", e.message ?? JSON.stringify(e));
  }
}

export async function sendDiagnosticEmail(
  creds: ElasticEmailCredentials,
  subject: string,
  text: string,
): Promise<void> {
  console.info("DIAG", subject, text);

  await sendEmail(creds, {
    to: "przemekkudla@hotmail.com",
    from: "error@przemekkudla.pl",
    subject,
    text,
  });
}

export default sendEmail;
