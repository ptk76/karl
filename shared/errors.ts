/**
 * Error contract shared between the frontend (`src`) and the worker (`worker`).
 * Pure types, the error catalog, and the wire payload guard — no runtime
 * dependencies — so either side can import it. The `Response`-producing
 * `ErrorResponse` class remains worker-side (`worker/api/errors.ts`).
 */

export interface ApiError {
  status: number; // real HTTP status
  code: string; // stable, machine-readable id
  msg: string; // human/log message
}

export const ApiErrors = {
  NoSid: {
    status: 401,
    code: "NO_SID",
    msg: "No active session",
  },
  LogoutNoSid: {
    status: 401,
    code: "LOGOUT_NO_SID",
    msg: "No active session",
  },
  NoUser: {
    status: 401,
    code: "NO_USER",
    msg: "No user",
  },
  LogoutNoUser: {
    status: 401,
    code: "LOGOUT_NO_USER",
    msg: "No user",
  },
  InvalidToken: {
    status: 401,
    code: "INVALID_TOKEN",
    msg: "Session expired, please log in again",
  },
  LogoutInvalidToken: {
    status: 401,
    code: "LOGOUT_INVALID_TOKEN",
    msg: "Invalid token",
  },
  CodeInvalidToken: {
    status: 401,
    code: "CODE_INVALID_TOKEN",
    msg: "Invalid token",
  },
  InvalidRequest: {
    status: 404,
    code: "NOT_FOUND",
    msg: "Page not found",
  },
  InternalError: {
    status: 500,
    code: "INTERNAL",
    msg: "Something went wrong",
  },
} as const satisfies Record<string, ApiError>;

export type ErrorPayload = {
  type: "ERROR";
  code: string;
  msg: string;
};

export function isResponsePayloadError(
  data: unknown,
): data is ErrorPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "ERROR" &&
    typeof (data as any).code === "string"
  );
}
