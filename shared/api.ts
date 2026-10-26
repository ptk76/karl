/**
 * API contract shared between the frontend (`src`) and the worker (`worker`).
 * Wire types, runtime guards, and route constants live here so both sides
 * agree on the same shapes. Never redefine these in `src` or `worker`.
 */

const api = (path: string) => `/api/${path}`;

/** MCP (Model Context Protocol) endpoint, served from the worker itself. */
export const MCP_PATH = "/mcp";

/** OAuth 2.1 endpoints that let MCP clients connect without a hand-made token. */
export const AUTHORIZE_PATH = "/authorize";
export const OAUTH_TOKEN_PATH = "/oauth/token";
export const OAUTH_REGISTER_PATH = "/oauth/register";

/**
 * Query parameter `/authorize` uses to send a signed-out user to the web app
 * and get them back after the Google login.
 */
export const LOGIN_RETURN_PARAM = "next";

/** Only an `/authorize` request on this origin may be a post-login target. */
export function isLoginReturnPath(path: string | null): path is string {
  return typeof path === "string" && path.startsWith(`${AUTHORIZE_PATH}?`);
}

export const ApiPaths = {
  login: api("login"),
  code: api("code"),
  logout: api("logout"),
  active: api("active"),
  tokens: api("tokens"),
  tokensRevoke: api("tokens/revoke"),
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

export function isTokensRequest(url: URL) {
  return url.pathname === ApiPaths.tokens;
}

export function isTokensRevokeRequest(url: URL) {
  return url.pathname === ApiPaths.tokensRevoke;
}

export function isMcpRequest(url: URL) {
  return url.pathname === MCP_PATH;
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

/** Body of `POST /api/tokens` — mint a Personal Access Token. */
export type CreateTokenRequest = {
  name?: string;
  expiresInDays?: number;
};

export function isCreateTokenRequest(data: unknown): data is CreateTokenRequest {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  // A revoke payload carries `id`; never treat it as a create.
  if (d.id !== undefined) return false;
  if (d.name !== undefined && typeof d.name !== "string") return false;
  if (d.expiresInDays !== undefined && typeof d.expiresInDays !== "number")
    return false;
  return true;
}

/** Body of `POST /api/tokens/revoke`. */
export type RevokeTokenRequest = {
  id: number;
};

export function isRevokeTokenRequest(data: unknown): data is RevokeTokenRequest {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as RevokeTokenRequest).id === "number"
  );
}

/** A token as listed (never contains the raw token or its hash). */
export interface ApiTokenSummary {
  id: number;
  name: string;
  prefix: string;
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
}

export function isApiTokenSummary(value: unknown): value is ApiTokenSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiTokenSummary).id === "number" &&
    typeof (value as ApiTokenSummary).name === "string" &&
    typeof (value as ApiTokenSummary).prefix === "string" &&
    typeof (value as ApiTokenSummary).createdAt === "number" &&
    ((value as ApiTokenSummary).expiresAt === null ||
      typeof (value as ApiTokenSummary).expiresAt === "number") &&
    ((value as ApiTokenSummary).lastUsedAt === null ||
      typeof (value as ApiTokenSummary).lastUsedAt === "number")
  );
}

/**
 * Response of `POST /api/tokens`. The plaintext `token` is included only
 * here — it is never stored, so this is the sole chance to see it.
 */
export interface ApiTokenCreated extends ApiTokenSummary {
  token: string;
}

export function isApiTokenCreated(value: unknown): value is ApiTokenCreated {
  return (
    isApiTokenSummary(value) &&
    typeof (value as ApiTokenCreated).token === "string"
  );
}

export function isApiTokensList(value: unknown): value is ApiTokenSummary[] {
  return Array.isArray(value) && value.every(isApiTokenSummary);
}
