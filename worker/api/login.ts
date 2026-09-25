import GoogleToken, { RefreshTokenResult } from "../google/token";
import {
  RequestPayload,
  ResponsePayload,
  isRequestPayloadLogin,
  isRequestPayloadCode,
  isRequestPayloadActive,
  isRequestPayloadRefresh,
} from "../payload-types";
import UsersDB, { User } from "../db";

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
  let payload: RequestPayload | null = null;
  try {
    payload = await request.json();
  } catch (e) {
    console.warn(e);
    const payload: ResponsePayload = {
      type: "ERROR",
      msg: "Invalid JSON",
    };
    return new Response(JSON.stringify(payload), { status: 404 });
  }

  const client = new GoogleToken(secret);
  if (isRequestPayloadLogin(payload)) {
    const payload: ResponsePayload = {
      type: "LOGIN",
      url: client.getLoginUrl(),
    };
    return new Response(JSON.stringify(payload), { status: 200 });
  }
  if (isRequestPayloadCode(payload)) {
    const access = (await client.getAccessToken(
      payload.code ?? "",
    )) as AccessData | null;
    if (!access || access.id_token === undefined)
      return new Response(JSON.stringify(access), { status: 404 });
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
    if (user === null) {
      await usersDb.addUser({
        email: decoded.email,
        login: karlLogin,
        accessToken: access.access_token,
        accessExpires: convertExpireToDate(access.expires_in),
        refreshToken: access.refresh_token,
        refreshExpires: access.refresh_token_expires_in
          ? convertExpireToDate(access.refresh_token_expires_in)
          : null,
      });
    } else {
      await usersDb.updateUserTokens(decoded.email, {
        accessToken: access.access_token,
        accessExpires: convertExpireToDate(access.expires_in),
        refreshToken: access.refresh_token,
        refreshExpires: access.refresh_token_expires_in
          ? convertExpireToDate(access.refresh_token_expires_in)
          : null,
      });
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
    });
  }
  if (isRequestPayloadActive(payload)) {
    const usersDb = new UsersDB(db);
    const user = await usersDb.getUser(payload.email ?? "");
    let responsePayload: ResponsePayload = {
      type: "ACTIVE",
      email: payload.email,
      loggedIn: false,
      expiresIn: -1,
    };
    if (user) {
      const token = user.accessToken;
      const result = await client.checkGoogleTokenValidity(token);
      responsePayload.expiresIn = result.expires_in ?? -1;
      if (result.valid) responsePayload.loggedIn = true;
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
    });
  }
  if (isRequestPayloadRefresh(payload)) {
    const usersDb = new UsersDB(db);
    let responsePayload: ResponsePayload = {
      type: "ACTIVE",
      email: payload.email,
      loggedIn: false,
      expiresIn: -1,
    };
    const user = (await usersDb.getUser(payload.email)) as User | null;
    if (user?.refreshToken) {
      try {
        const result = (await client.refreshAccessToken(
          user.refreshToken,
        )) as RefreshTokenResult;
        await usersDb.updateUserTokens(payload.email, {
          accessToken: result.access_token,
          accessExpires: convertExpireToDate(result.expires_in.toString()),
        });
        responsePayload.loggedIn = true;
        responsePayload.expiresIn = result.expires_in;
      } catch (e) {
        console.warn("Token refresh failed");
      }
    }
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
    });
  }

  const errorPayload: ResponsePayload = {
    type: "ERROR",
    msg: "Unknown request",
  };
  return new Response(JSON.stringify(errorPayload), { status: 404 });
}

export default loginHandler;

// async function getValidAccessToken(
//   usersDb: UsersDB,
//   env: Env,
//   email: string,
// ): Promise<string> {
//   const user = await usersDb.getUser(email);
//   if (!user) throw new Error("User not found");

//   if (isTokenStillValid(user.accessExpires)) {
//     return user.accessToken;
//   }

//   if (!user.refreshToken) {
//     throw new Error("No refresh token available — user must re-authenticate");
//   }

//   const refreshed = await refreshAccessToken({
//     refreshToken: user.refreshToken,
//     clientId: env.GOOGLE_CLIENT_ID,
//     clientSecret: env.GOOGLE_CLIENT_SECRET,
//   });

//   await usersDb.updateUserTokens(email, {
//     accessToken: refreshed.access_token,
//     accessExpires: Date.now() + refreshed.expires_in * 1000,
//     // refreshToken omitted — Google didn't return a new one, so
//     // your COALESCE logic in updateUserTokens correctly leaves it untouched
//   });

//   return refreshed.access_token;
// }
