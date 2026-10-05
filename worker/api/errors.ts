import { ApiErrors } from "../../shared/errors";
import type { ApiError, ErrorPayload } from "../../shared/errors";

export class ErrorResponse extends Response {
  constructor({ status, code, msg }: ApiError) {
    super(JSON.stringify({ type: "ERROR", code, msg } satisfies ErrorPayload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export default ErrorResponse;
export { ApiErrors };
