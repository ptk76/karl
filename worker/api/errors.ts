interface ApiErrorBody {
  error: { type: number; msg: string };
  status: { status: number };
}

const ApiErrors: Record<string, ApiErrorBody> = {
  NoSid: {
    error: { type: 410, msg: "No active session" },
    status: { status: 410 },
  },
  LogoutNoSid: {
    error: { type: 411, msg: "No active session" },
    status: { status: 411 },
  },
  NoUser: {
    error: { type: 420, msg: "No user" },
    status: { status: 420 },
  },
  LogoutNoUser: {
    error: { type: 424, msg: "No user" },
    status: { status: 424 },
  },
  InvalidToken: {
    error: { type: 430, msg: "Invalid token" },
    status: { status: 430 },
  },
  LogoutInvalidToken: {
    error: { type: 431, msg: "Invalid token" },
    status: { status: 431 },
  },
  CodeInvalidToken: {
    error: { type: 432, msg: "Invalid token" },
    status: { status: 432 },
  },
  InvalidRequest: {
    error: { type: 404, msg: "Page not found" },
    status: { status: 404 },
  },
};

export class ErrorResponse extends Response {
  constructor(data: ApiErrorBody) {
    super(JSON.stringify(data.error), data.status);
  }
}
export default ErrorResponse;
export { ApiErrors };
