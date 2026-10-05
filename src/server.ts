import {
  type ActiveSession,
  ApiPaths,
  type ApiTokenCreated,
  type ApiTokenSummary,
  type LoginUrl,
  isActiveSession,
  isApiTokenCreated,
  isApiTokensList,
  isLoginUrl,
} from "../shared/api";

// Re-exported so this module remains the frontend's API client surface.
export type { ActiveSession, LoginUrl, ApiTokenCreated, ApiTokenSummary };
export { isActiveSession, isLoginUrl };

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const response = await fetch(ApiPaths.active);
    if (!response.ok) {
      console.info(await response.json());
      return null;
    }
    const result = await response.json();
    return isActiveSession(result) ? result : null;
  } catch {
    return null;
  }
};

export const getLoginUrl = async (): Promise<LoginUrl | null> => {
  try {
    const response = await fetch(ApiPaths.login);
    if (!response.ok) {
      console.info(await response.json());
      return null;
    }
    const result = await response.json();
    return isLoginUrl(result) ? result : null;
  } catch {
    return null;
  }
};

export const logout = async () => {
  try {
    const response = await fetch(ApiPaths.logout);
    if (!response.ok) console.info(await response.json());
  } catch {}
};

export const requestToken = async (code: string): Promise<LoginUrl | null> => {
  try {
    const response = await fetch(ApiPaths.code, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code }),
    });
    if (!response.ok) {
      console.info(await response.json());
      return null;
    }
    const result = await response.json();
    return isLoginUrl(result) ? result : null;
  } catch {
    return null;
  }
};

export const createApiToken = async (
  name?: string,
  expiresInDays?: number,
): Promise<ApiTokenCreated | null> => {
  try {
    const response = await fetch(ApiPaths.tokens, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, expiresInDays }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return isApiTokenCreated(result) ? result : null;
  } catch {
    return null;
  }
};

export const listApiTokens = async (): Promise<ApiTokenSummary[] | null> => {
  try {
    const response = await fetch(ApiPaths.tokens);
    if (!response.ok) return null;
    const result = await response.json();
    return isApiTokensList(result) ? result : null;
  } catch {
    return null;
  }
};

export const revokeApiToken = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(ApiPaths.tokensRevoke, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return response.ok;
  } catch {
    return false;
  }
};
