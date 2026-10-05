interface ApiErrorBody {
  error: { type: number; msg: string };
  status: { status: number };
}

const ApiErrors: Record<string, ApiErrorBody> = {
  NoSid: {
    error: { type: 100, msg: "No active session" },
    status: { status: 401 },
  },
  LogoutNoSid: {
    error: { type: 101, msg: "No active session" },
    status: { status: 401 },
  },
  NoUser: {
    error: { type: 200, msg: "No user with session" },
    status: { status: 401 },
  },
  LogoutNoUser: {
    error: { type: 201, msg: "No user with session" },
    status: { status: 401 },
  },
  InvalidToken: {
    error: { type: 300, msg: "Invalid token" },
    status: { status: 401 },
  },
  LogoutInvalidToken: {
    error: { type: 301, msg: "Invalid token" },
    status: { status: 401 },
  },
  CodeInvalidToken: {
    error: { type: 302, msg: "Invalid token" },
    status: { status: 401 },
  },
  InvalidRequest: {
    error: { type: 400, msg: "Page not found" },
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
