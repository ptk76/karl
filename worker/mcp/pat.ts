/**
 * Personal Access Token helpers. Tokens are random `karl_`-prefixed strings;
 * only their SHA-256 digest is ever stored (in D1), so a DB leak does not
 * expose usable tokens.
 */

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `karl_${hex}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
