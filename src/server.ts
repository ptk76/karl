import {
  type ActiveSession,
  ApiPaths,
  type LoginUrl,
  isActiveSession,
  isLoginUrl,
} from "../shared/api";

// Re-exported so this module remains the frontend's API client surface.
export type { ActiveSession, LoginUrl };
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
