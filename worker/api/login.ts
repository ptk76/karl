import GoogleToken from "../google/token";
import {
  RequestPayload,
  ResponsePayload,
  isRequestPayloadCode,
  isLoginRequest,
  isCodeRequest,
  isActiveRequest,
  ActiveSession,
  LoginUrl,
  isLogoutRequest,
} from "../../shared/api";
import UsersDB, { UserTableRow } from "../db";
import { getPayload, getSid, getValidToken } from "./utils";
import ErrorResponse, { ApiErrors } from "./errors";

type AccessData = {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  id_token: string;
};

function convertExpireToDate(expires_in: string) {
  const expiresTmp = parseInt(expires_in);
  if (isNaN(expiresTmp)) return 0;

  return expiresTmp * 1000 + Date.now();
}

export async function loginHandler(
  request: Request,
  secret: string,
  db: Env["DB"],
) {
  const payload: RequestPayload | null = await getPayload(request);
  const url = new URL(request.url);

  const client = new GoogleToken(secret);
  if (isLogoutRequest(url)) {
    const sid = getSid(request);
    if (!sid) return new ErrorResponse(ApiErrors.LogoutNoSid);

    const usersDb = new UsersDB(db);
    const user = await usersDb.getUserBySid(sid);
    if (!user) return new ErrorResponse(ApiErrors.LogoutNoUser);
    if (!user.refresh_token)
      return new ErrorResponse(ApiErrors.LogoutInvalidToken);

    await client.revokeGoogleToken(user.refresh_token);
    await usersDb.logout(user.email);
  }
  if (isLoginRequest(url)) {
    const payload: LoginUrl = {
      url: client.getLoginUrl(),
    };
    return new Response(JSON.stringify(payload), { status: 200 });
  }

  if (isCodeRequest(url) && isRequestPayloadCode(payload)) {
    const access = (await client.getAccessToken(
      payload.code ?? "",
    )) as AccessData | null;
    if (!access || access.id_token === undefined)
      return new ErrorResponse(ApiErrors.CodeInvalidToken);

    const jwtPayload = access.id_token.split(".")[1];
    const decoded = JSON.parse(
      atob(jwtPayload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    const karlLogin = crypto.randomUUID().split("-")[0];

    const usersDb = new UsersDB(db);

    const user = (await usersDb.getUser(decoded.email)) as any;
    const responsePayload: ResponsePayload = {
      type: "PROFILE",
      email: decoded.email,
      login: user ? user.login : karlLogin,
    };

    const userRow: UserTableRow = {
      email: decoded.email,
      login: user ? user.karlLogin : karlLogin,
      access_token: access.access_token,
      access_expires: convertExpireToDate(access.expires_in),
      refresh_token: access.refresh_token,
      refresh_expires: access.refresh_token_expires_in
        ? convertExpireToDate(access.refresh_token_expires_in)
        : null,
      session_id: crypto.randomUUID(),
    };

    if (user === null) {
      await usersDb.addUser(userRow);
    } else {
      await usersDb.updateUserTokens(userRow);
    }

    const cookieEpires =
      (access.refresh_token_expires_in as unknown as number) / 1000 - 60;
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Set-Cookie": `sid=${userRow.session_id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieEpires}`,
      },
    });
  }

  if (isActiveRequest(url)) {
    const sid = getSid(request);
    if (!sid) return new ErrorResponse(ApiErrors.NoSid);

    const usersDb = new UsersDB(db);
    const user = await usersDb.getUserBySid(sid);
    if (!user) return new ErrorResponse(ApiErrors.NoUser);

    const accessToken = await getValidToken(user, client, usersDb);
    if (!accessToken) return new ErrorResponse(ApiErrors.InvalidToken);

    let responsePayload: ActiveSession = {
      userEmail: user.email,
      karlEmail: user.login ?? "Invalid",
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
    });
  }

  return new ErrorResponse(ApiErrors.InvalidRequest);
}

export default loginHandler;
