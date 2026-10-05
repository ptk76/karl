/**
 * API contract shared between the frontend (`src`) and the worker (`worker`).
 * Wire types, runtime guards, and route constants live here so both sides
 * agree on the same shapes. Never redefine these in `src` or `worker`.
 */

const api = (path: string) => `/api/${path}`;

export const ApiPaths = {
  login: api("login"),
  code: api("code"),
  logout: api("logout"),
  active: api("active"),
} as const;

export function isLoginRequest(url: URL) {
  return url.pathname === ApiPaths.login;
}

export function isLogoutRequest(url: URL) {
  return url.pathname === ApiPaths.logout;
}

export function isCodeRequest(url: URL) {
  return url.pathname === ApiPaths.code;
}

export function isActiveRequest(url: URL) {
  return url.pathname === ApiPaths.active;
}

type RequestPayloadLogin = {
  type: "LOGIN";
};

type RequestPayloadCode = {
  code: string;
};

export function isRequestPayloadCode(
  data: unknown,
): data is RequestPayloadCode {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as any).code === "string"
  );
}

type RequestPayloadActive = {
  email: string;
};

export function isRequestPayloadActive(
  data: unknown,
): data is RequestPayloadActive {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "ACTIVE" &&
    typeof (data as any).email === "string"
  );
}

type RequestPayloadRefresh = {
  type: "REFRESH";
  email: string;
};

export function isRequestPayloadRefresh(
  data: unknown,
): data is RequestPayloadRefresh {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "REFRESH" &&
    typeof (data as any).email === "string"
  );
}

export type RequestPayload =
  | RequestPayloadLogin
  | RequestPayloadCode
  | RequestPayloadActive
  | RequestPayloadRefresh;

import { type ErrorPayload } from "./errors";
export { type ErrorPayload, isResponsePayloadError } from "./errors";

export type ResponsePayload =
  | ErrorPayload
  | ResponsePayloadLogin
  | ResponsePayloadProfile
  | ResponsePayloadActive;

type ResponsePayloadLogin = {
  type: "LOGIN";
  url: string;
};

export function isResponsePayloadLogin(
  data: unknown,
): data is ResponsePayloadLogin {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "LOGIN" &&
    typeof (data as any).url === "string"
  );
}

type ResponsePayloadProfile = {
  type: "PROFILE";
  email: string;
  login: string;
};

export function isResponsePayloadProfile(
  data: unknown,
): data is ResponsePayloadProfile {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "PROFILE" &&
    typeof (data as any).email === "string" &&
    typeof (data as any).login === "string"
  );
}

type ResponsePayloadActive = {
  type: "ACTIVE";
  email: string;
  loggedIn: boolean;
  expiresIn: number;
};

export function isResponsePayloadActive(
  data: unknown,
): data is ResponsePayloadActive {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "ACTIVE" &&
    typeof (data as any).email === "string" &&
    typeof (data as any).loggedIn === "boolean" &&
    typeof (data as any).expiresIn === "number"
  );
}

/** Response of `GET /api/active`, as consumed by `src/server`. */
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

/** Response of `GET /api/login`. */
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
