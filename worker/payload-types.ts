type RequestPayloadLogin = {
  type: "LOGIN";
};

export function isRequestPayloadLogin(
  data: unknown,
): data is RequestPayloadLogin {
  return (
    typeof data === "object" && data !== null && (data as any).type === "LOGIN"
  );
}

type RequestPayloadCode = {
  type: "CODE";
  code: string;
};

export function isRequestPayloadCode(
  data: unknown,
): data is RequestPayloadCode {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "CODE" &&
    typeof (data as any).code === "string"
  );
}

type RequestPayloadActive = {
  type: "ACTIVE";
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

type ResponsePayloadError = {
  type: "ERROR";
  msg: string;
};

export function isResponsePayloadError(
  data: unknown,
): data is ResponsePayloadError {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "ERROR" &&
    typeof (data as any).msg === "string"
  );
}

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

export type ResponsePayload =
  | ResponsePayloadError
  | ResponsePayloadLogin
  | ResponsePayloadProfile
  | ResponsePayloadActive;
