import PostalMime from "postal-mime";
import UsersDB, { claimUnknownSenderNotice } from "../db";
import GoogleDrive, { DriveAuthError } from "../google/drive";
import sendEmail, {
  ElasticEmailCredentials,
  sendDiagnosticEmail,
} from "../send-email";
import {
  EmailContent,
  couldNotSaveEmail,
  diagAuthRejectedSubject,
  savedEmail,
  signInAgainEmail,
  unknownSenderEmail,
  wrongAddressEmail,
} from "./messages";
import GoogleToken from "../google/token";
import { getValidToken } from "./utils";
import { htmlToMarkdown } from "../../shared/html-to-md";

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
export function senderAuthenticationFailed(
  message: ForwardableEmailMessage,
): boolean {
  const results = message.headers.get("Authentication-Results") ?? "";
  // "hardfail" is the historic spelling of an SPF fail that Gmail still uses
  // in Authentication-Results; softfail/neutral are weaker and let through.
  return /dmarc=fail/i.test(results) || /spf=(?:fail|hardfail)/i.test(results);
}

export async function emailHandler(
  env: Env,
  message: ForwardableEmailMessage,
  creds: ElasticEmailCredentials,
) {
  const parser = new PostalMime();
  const rawEmail = new Response(message.raw as unknown as BodyInit);
  const email = await parser.parse(await rawEmail.arrayBuffer());

  const diagnosticTo = (env as { DIAGNOSTIC_EMAIL?: string }).DIAGNOSTIC_EMAIL;
  if (senderAuthenticationFailed(message)) {
    await sendDiagnosticEmail(
      creds,
      diagAuthRejectedSubject,
      `rawSize=${message.rawSize}`,
      diagnosticTo,
    );
    return;
  }

  const send = (to: string, content: EmailContent) =>
    sendEmail(creds, { to, subject: content.subject, text: content.html });
  // Quoted back in every mail so the user knows which message it is about.
  const subject = email.subject?.trim() || "—";

  const db = new UsersDB(env.DB);
  const user = await db.getUser(message.from);
  if (!user) {
    if (await claimUnknownSenderNotice(env.DB, message.from, Date.now())) {
      await send(
        message.from,
        unknownSenderEmail({ subject, from: message.from }),
      );
    }
    return;
  }

  const toAddress = email.to?.[0]?.address ?? message.to;
  const emailToLogin = email.to?.[0]?.address?.split("@")[0];
  if (!emailToLogin || user.login !== emailToLogin) {
    // The envelope recipient is always on the DearKarl domain.
    const karlDomain = message.to.split("@")[1] ?? "";
    await send(
      message.from,
      wrongAddressEmail({
        subject,
        to: toAddress,
        karlAddress: `${user.login}@${karlDomain}`,
      }),
    );
    return;
  }

  const secret = env.GOOGLE_CLIENT_SECRET;
  const client = new GoogleToken(secret);

  let accessToken: string | null = "";
  if (client.isTokenValid(user.access_expires ?? 0)) {
    accessToken = user.access_token!;
  } else {
    accessToken = await getValidToken(user, client, db);
    if (accessToken === null) {
      await send(user.email, signInAgainEmail({ subject }));
      return;
    }
  }

  const drive = new GoogleDrive(accessToken);
  const filename = safeFileName(
    email.subject ?? `${crypto.randomUUID().split("-")[0]}.txt`,
  );

  try {
    const rootFolder = await drive.getRootFolderId();
    await drive.pushFile(
      rootFolder,
      filename,
      email.html ? htmlToMarkdown(email.html) : (email.text ?? "NONE"),
    );
    await send(user.email, savedEmail({ subject, filename }));
  } catch (e: any) {
    // Only an actual authorization failure should tell the user to log in
    // again — otherwise the advice is wrong and sends them in a loop.
    const isAuthProblem = e instanceof DriveAuthError;
    await send(
      user.email,
      isAuthProblem
        ? signInAgainEmail({ subject })
        : couldNotSaveEmail({ subject }),
    );
  }
}

export default emailHandler;
