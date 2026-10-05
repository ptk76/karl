import type { ErrorPayload } from "../../shared/api";

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

export class ErrorResponse extends Response {
  constructor({ status, code, msg }: ApiError) {
    super(JSON.stringify({ type: "ERROR", code, msg } satisfies ErrorPayload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export default ErrorResponse;
