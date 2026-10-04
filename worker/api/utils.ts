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
  if (client.isTokenValid(user.access_expires ?? 0))
    return user.access_token ?? null;
  if (!user.refresh_token) return null;

  try {
    const refreshed = await client.refreshAccessToken(user.refresh_token);
    await db.updateUserTokens({
      email: user.email,
      access_token: refreshed.access_token,
      access_expires: Date.now() + refreshed.expires_in * 1000,
    });
    return refreshed.access_token;
  } catch (e: any) {
    return null;
  }
}
