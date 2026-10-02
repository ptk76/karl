import { RequestPayload } from "../payload-types";

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
