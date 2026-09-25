export interface Email {
  to: string;
  from?: string;
  subject: string;
  text: string;
}

export interface ElasticEmailCredentials {
  apiKey: string;
  username: string;
}

/** Fallback used when DIAGNOSTIC_EMAIL is not configured. */
const DEFAULT_DIAGNOSTIC_RECIPIENT = "przemekkudla@hotmail.com";
const DEFAULT_DIAGNOSTIC_SENDER = "diagnostic@przemekkudla.pl";

/**
 * Escape text that will be interpolated into an HTML email body.
 * Inbound mail is attacker-controlled, so nothing from it may reach the
 * body as markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(
  creds: ElasticEmailCredentials,
  email: Email,
): Promise<void> {
  const body = {
    Recipients: [{ Email: email.to }],
    Content: {
      From: email.from ?? creds.username,
      Subject: email.subject,
      Body: [
        {
          ContentType: "HTML",
          Content: email.text,
        },
      ],
    },
  };

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
}

/**
 * Report an operational problem to the operator's mailbox. Never throws —
 * a failing diagnostic must not take down the flow that reported it.
 */
export async function sendDiagnosticEmail(
  creds: ElasticEmailCredentials,
  subject: string,
  text: string,
  recipient?: string,
  sender?: string,
): Promise<void> {
  try {
    await sendEmail(creds, {
      to: recipient ?? DEFAULT_DIAGNOSTIC_RECIPIENT,
      from: sender ?? DEFAULT_DIAGNOSTIC_SENDER,
      subject,
      text: escapeHtml(text),
    });
  } catch (e: any) {
    console.error("DIAG EMAIL", e.message ?? e);
  }
}

/** Parse ELASTIC_SECRET, returning null instead of throwing on bad input. */
export function readElasticCredentials(
  raw: string | undefined,
): ElasticEmailCredentials | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ElasticEmailCredentials;
    if (!parsed?.apiKey || !parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default sendEmail;
