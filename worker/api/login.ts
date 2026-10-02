import GoogleToken from "../google/token";
import {
  RequestPayload,
  ResponsePayload,
  isRequestPayloadCode,
  isRequestPayloadActive,
  isLoginRequest,
  isCodeRequest,
  isActiveRequest,
} from "../payload-types";
import UsersDB, { UserTableRow } from "../db";
import { getPayload, getSid } from "./utils";
import { ActiveSession, LoginUrl } from "../../src/server";

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
      return new Response(JSON.stringify("Page not found."), { status: 404 });

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

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Set-Cookie": `sid=${userRow.session_id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=20`,
      },
    });
  }

  if (isActiveRequest(url)) {
    const sid = getSid(request);
    if (!sid) return new Response("Page not found.", { status: 404 });

    const usersDb = new UsersDB(db);
    const user = await usersDb.getUserBySid(sid);
    if (!user) return new Response("Page not found.", { status: 404 });

    const result = await client.checkGoogleTokenValidity(user.access_token);
    if (!result.valid) return new Response("Page not found.", { status: 404 });

    let responsePayload: ActiveSession = {
      userEmail: user.email,
      karlEmail: user.login ?? "Invalid",
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
    });
  }

  return new Response("Page not found.", { status: 404 });
}

export default loginHandler;
