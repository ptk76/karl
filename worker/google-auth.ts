import { SignJWT, importPKCS8 } from "jose";

interface Env {
  GCP_SERVICE_ACCOUNT: string; // The secret stored in Cloudflare
}

/**
 * Exchanges a Service Account JWT for a Google OAuth Access Token
 * @param env The Cloudflare Worker environment (containing the secret)
 * @param scope The API scope (e.g., 'https://www.googleapis.com/auth/cloud-platform')
 */
export async function getGoogleAccessToken(
  env: Env,
  scope: string,
): Promise<string> {
  // 1. Parse the Service Account JSON
  const sa = JSON.parse(env.GCP_SERVICE_ACCOUNT);
  // const sa = JSON.parse(secret);

  console.info("SECRET", sa);
  // 2. Import the private key
  const privateKey = await importPKCS8(sa.private_key, "RS256");

  // 3. Create and sign the JWT
  const jwt = await new SignJWT({
    scope: scope,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  // 4. Exchange the JWT for an Access Token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to exchange JWT: ${JSON.stringify(errorData)}`);
  }

  // const data = await response.json<{ access_token: string }>();
  const data: any = await response.json();
  return data.access_token;
}
