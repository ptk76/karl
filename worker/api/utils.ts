import { type RequestPayload } from "../../shared/api";
import UsersDB, { UserTableRow } from "../db";
import GoogleToken from "../google/token";

export function getSid(req: Request) {
  const cookieHeader = req.headers?.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  return match ? match[1] : null;
}

export async function getPayload(
  request: Request,
): Promise<RequestPayload | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function getValidToken(
  user: UserTableRow,
  client: GoogleToken,
  db: UsersDB,
): Promise<string | null> {
  if (await isAccessTokenValidWithGoogle(user, client)) {
    console.info("VALID TOKEN 1");
    return user.access_token!;
  }

  // if (client.isTokenValid(user.access_expires ?? 0))
  // return user.access_token ?? null;
  if (!user.refresh_token) {
    console.info("INVALID REFRESH TOKEN");
    return null;
  }
  try {
    const refreshed = await client.refreshAccessToken(user.refresh_token);
    await db.updateUserTokens({
      email: user.email,
      access_token: refreshed.access_token,
      access_expires: Date.now() + refreshed.expires_in * 1000,
    });
    console.info("VALID TOKEN 2");
    return refreshed.access_token;
  } catch (e: any) {
    console.info("ERROR", e);
    return null;
  }
}

/**
 * Ask Google (not just the local expiry timestamp) whether a user's stored
 * access_token is still valid. This catches tokens that were revoked
 * server-side or expired early, which `getValidToken`'s `isTokenValid`
 * timestamp check cannot see.
 *
 * Returns false when the user has no token, when Google rejects it, or when
 * the check itself fails (e.g. a network error).
 */
export async function isAccessTokenValidWithGoogle(
  user: UserTableRow,
  client: GoogleToken,
): Promise<boolean> {
  if (!user.access_token) return false;
  try {
    const info = await client.checkGoogleTokenValidity(user.access_token);
    return info.valid;
  } catch {
    return false;
  }
}

/**
 * Derive a unique login for a new user from their base email.
 *
 * The login is seeded from the email's local part (before "@", lowercased).
 * If that login is already taken in the database, a numeric suffix is appended
 * and the lookup is repeated until an unused login is found.
 *
 * Example: `John.Doe@example.com` -> "john.doe", "john.doe1", "john.doe2", ...
 *
 * Note: the `users.login` column is UNIQUE, so a concurrent insert that loses
 * the check-and-set race still fails safe at the DB constraint.
 */
export async function getUniqueLogin(
  email: string,
  db: UsersDB,
): Promise<string> {
  const base = email.split("@")[0].toLowerCase() || "user";
  let login = base;
  let suffix = 0;

  while (await db.loginExists(login)) {
    suffix += 1;
    login = `${base}${suffix}`;
  }

  return login;
}
