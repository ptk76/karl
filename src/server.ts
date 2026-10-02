export interface ActiveSession {
  userEmail: string;
  karlEmail: string;
}
export function isActiveSession(value: unknown): value is ActiveSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ActiveSession).userEmail === "string" &&
    typeof (value as ActiveSession).karlEmail === "string"
  );
}

export interface LoginUrl {
  url: string;
}

export function isLoginUrl(value: unknown): value is LoginUrl {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LoginUrl).url === "string"
  );
}

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const response = await fetch("/api/active");
    if (!response.ok) return null;
    const result = await response.json();
    return isActiveSession(result) ? result : null;
  } catch {
    return null;
  }
};

export const getLoginUrl = async (): Promise<LoginUrl | null> => {
  try {
    const response = await fetch("/api/login");
    if (!response.ok) return null;
    const result = await response.json();
    return isLoginUrl(result) ? result : null;
  } catch {
    return null;
  }
};

export const requestToken = async (code: string): Promise<LoginUrl | null> => {
  try {
    const response = await fetch("/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return isLoginUrl(result) ? result : null;
  } catch {
    return null;
  }
};
