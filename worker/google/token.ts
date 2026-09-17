interface GoogleWebClientSecret {
  client_id: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_secret: string;
  javascript_origins: string[];
  redirect_uri: string;
}

interface TokenInfo {
  valid: boolean;
  expires_in?: number; // seconds remaining
  scope?: string;
  email?: string;
}

export interface RefreshTokenResult {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
  // note: Google does NOT return a new refresh_token here —
  // the original refresh_token keeps working until revoked
}

class GoogleToken {
  #config: GoogleWebClientSecret;
  constructor(secret: string) {
    this.#config = JSON.parse(secret).web;
  }

  getLoginUrl() {
    const url = new URL(this.#config.auth_uri);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set(
      "scope",
      "https://www.googleapis.com/auth/drive.file email",
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.#config.client_id);
    url.searchParams.set("redirect_uri", this.#config.redirect_uri);
    url.searchParams.set("state", self.crypto.randomUUID());
    url.searchParams.set("prompt", "consent");
    return url.href;
  }

  async getAccessToken(code: string) {
    const body = new URLSearchParams({
      client_id: this.#config.client_id,
      client_secret: this.#config.client_secret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: this.#config.redirect_uri,
    });
    try {
      const response = await fetch(this.#config.token_uri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      return response.json();
    } catch {
      return null;
    }
  }

  async checkGoogleTokenValidity(accessToken: string): Promise<TokenInfo> {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!res.ok) {
      // Google returns 400 for expired/invalid/revoked tokens
      return { valid: false };
    }

    const data = (await res.json()) as TokenInfo;

    return {
      valid: true,
      expires_in: Number(data.expires_in),
      scope: data.scope,
      email: data.email,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.#config.client_id,
      client_secret: this.#config.client_secret,
      grant_type: "refresh_token",
    });

    const response = await fetch(this.#config.token_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(
        `Token refresh failed: ${data.error} - ${data.error_description || ""}`,
      );
    }

    return data as RefreshTokenResult;
  }

  async revokeGoogleToken(token: string): Promise<void> {
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ token }).toString(),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as any;
      throw new Error(
        `Token revocation failed: ${data.error || response.status} - ${data.error_description || ""}`,
      );
    }
  }
}

export default GoogleToken;
