import PostalMime from "postal-mime";
import UsersDB from "../db";
import GoogleDrive, { DriveAuthError } from "../google/drive";
import sendEmail, {
  ElasticEmailCredentials,
  escapeHtml,
  sendDiagnosticEmail,
} from "../send-email";
import { authError, genericError } from "./messages";

/** Google Drive rejects these in names; also cap the length. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[/\\\r\n\t]+/g, "-").trim();
  return (cleaned || "message").slice(0, 120);
}

/**
 * Reject only mail whose sender authentication explicitly failed. Anything
 * else (header absent, unknown verdict) is let through, so a change in
 * Cloudflare's header format cannot silently drop legitimate mail.
 */
function senderAuthenticationFailed(message: ForwardableEmailMessage): boolean {
  const results = message.headers.get("Authentication-Results") ?? "";
  return /dmarc=fail/i.test(results) || /spf=fail/i.test(results);
}

export async function emailHandler(
  env: Env,
  message: ForwardableEmailMessage,
  creds: ElasticEmailCredentials,
) {
  const diagnosticTo = (env as { DIAGNOSTIC_EMAIL?: string }).DIAGNOSTIC_EMAIL;

  if (senderAuthenticationFailed(message)) {
    await sendDiagnosticEmail(
      creds,
      "Rejected: sender authentication failed",
      `rawSize=${message.rawSize}`,
      diagnosticTo,
    );
    return;
  }

  const parser = new PostalMime();
  const rawEmail = new Response(message.raw as unknown as BodyInit);
  const email = await parser.parse(await rawEmail.arrayBuffer());

  const db = new UsersDB(env.DB);
  const user = await db.getUser(message.from);

  if (!user) {
    // Deliberately no sender address, subject or body here: the operator
    // needs to know that an unknown sender hit the endpoint, not who it was.
    await sendDiagnosticEmail(
      creds,
      "Unknown user",
      `An unregistered sender was rejected. rawSize=${message.rawSize}`,
      diagnosticTo,
    );
    return;
  }

  const drive = new GoogleDrive(user.accessToken);
  const filename = safeFileName(
    email.subject ?? `${crypto.randomUUID().split("-")[0]}.txt`,
  );

  try {
    const rootFolder = await drive.getRootFolderId();
    await drive.pushFile(rootFolder, filename, email.text ?? "NONE");
    await sendEmail(creds, {
      to: user.email,
      subject: `Saved to Drive: ${filename}`,
      text: `The file was created: ${escapeHtml(filename)}`,
    });
  } catch (e: any) {
    await sendDiagnosticEmail(
      creds,
      "ERROR",
      e?.message ?? JSON.stringify(e),
      diagnosticTo,
    );

    // Only an actual authorization failure should tell the user to log in
    // again — otherwise the advice is wrong and sends them in a loop.
    const isAuthProblem = e instanceof DriveAuthError;
    await sendEmail(creds, {
      to: user.email,
      subject: isAuthProblem ? "Access Denied" : "Could not save your file",
      text: isAuthProblem ? authError : genericError,
    });
  }
}

export default emailHandler;
