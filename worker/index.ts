import PostalMime from "postal-mime";

export type PayloadType = {
  type: "INVALID" | "ERROR" | "LOGIN" | "CODE" | "PROFILE";
  msg?: string;
  url?: string;
  code?: string;
  email?: string;
  login?: string;
};

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_SECRET: string;
}

type SecretConfig = {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    javascript_origins: string[];
    redirect_uri: string;
  };
};

function getLoginUrl(config: SecretConfig) {
  const url = new URL(config.web.auth_uri);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/drive.file email",
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.web.client_id);
  url.searchParams.set("redirect_uri", config.web.redirect_uri);
  url.searchParams.set("state", self.crypto.randomUUID());
  // url.searchParams.set("prompt", "consent");
  return url.href;
}

async function getAccessToken(config: SecretConfig, code: string) {
  const body = new URLSearchParams();
  body.set("client_id", config.web.client_id);
  body.set("client_secret", config.web.client_secret);
  body.set("code", code);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.web.redirect_uri);
  try {
    const response = await fetch(config.web.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    return response.json();
  } catch {
    return null;
  }
}

type AccessData = {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  id_token: string;
};

async function getUser(env: Env, email: string) {
  const user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email)
    .first();
  return user;
}

interface NewUser {
  email: string;
  login: string;
  accessToken: string;
  accessExpires: number;
  refreshToken?: string | null;
  refreshExpires?: number | null;
}

async function addUser(env: Env, user: NewUser) {
  const {
    email,
    login,
    accessToken,
    accessExpires,
    refreshToken,
    refreshExpires,
  } = user;

  const sql = `
    INSERT INTO users (email, login, access_token, access_expires, refresh_token, refresh_expires)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await env.DB.prepare(sql)
    .bind(
      email,
      login,
      accessToken,
      accessExpires,
      refreshToken ?? null,
      refreshExpires ?? null,
    )
    .run();

  return result;
}

interface TokenUpdate {
  email: string;
  accessToken: string;
  accessExpires: number;
  refreshToken?: string | null;
  refreshExpires?: number | null;
}

async function updateUserTokens(env: Env, update: TokenUpdate) {
  const { email, accessToken, accessExpires, refreshToken, refreshExpires } =
    update;

  const sql = `
    UPDATE users
    SET access_token = ?,
        access_expires = ?,
        refresh_token = COALESCE(?, refresh_token),
        refresh_expires = COALESCE(?, refresh_expires)
    WHERE email = ?
  `;

  const result = await env.DB.prepare(sql)
    .bind(
      accessToken,
      accessExpires,
      refreshToken ?? null,
      refreshExpires ?? null,
      email,
    )
    .run();

  return result;
}

function convertExpireToDate(expires_in: string) {
  const expiresTmp = parseInt(expires_in);
  if (isNaN(expiresTmp)) return 0;

  return expiresTmp * 1000 + Date.now();
}
export default {
  async fetch(request: Request, env: Env) {
    let payload: PayloadType = { type: "INVALID" };
    try {
      payload = await request.json();
    } catch (e) {
      console.warn(e);
      const payload: PayloadType = {
        type: "ERROR",
        msg: "Invalid JSON",
      };
      return new Response(JSON.stringify(payload), { status: 404 });
    }
    console.info("I AM WORKER", payload, env);

    const config = JSON.parse(env.GOOGLE_CLIENT_SECRET);
    if (payload.type === "LOGIN") {
      const payload: PayloadType = { type: "LOGIN", url: getLoginUrl(config) };
      return new Response(JSON.stringify(payload), { status: 200 });
    }
    if (payload.type === "CODE") {
      const access = (await getAccessToken(
        config,
        payload.code ?? "",
      )) as AccessData;
      console.info("+++++++++", access);
      if (access.id_token === undefined)
        return new Response(JSON.stringify(access), { status: 404 });
      const jwtPayload = access.id_token.split(".")[1];
      const decoded = JSON.parse(
        atob(jwtPayload.replace(/-/g, "+").replace(/_/g, "/")),
      );
      const karlLogin = crypto.randomUUID().split("-")[0];
      console.info("===", access);
      console.info("###", decoded);
      const user = (await getUser(env, decoded.email)) as any;
      const responsePayload: PayloadType = {
        type: "PROFILE",
        email: decoded.email,
        login: user ? user.login : karlLogin,
      };
      console.info("USER:", user);
      if (user === null) {
        await addUser(env, {
          email: decoded.email,
          login: karlLogin,
          accessToken: access.access_token,
          accessExpires: convertExpireToDate(access.expires_in),
          refreshToken: access.refresh_token,
          refreshExpires: convertExpireToDate(access.refresh_token_expires_in),
        });
      } else {
        await updateUserTokens(env, {
          email: decoded.email,
          accessToken: access.access_token,
          accessExpires: convertExpireToDate(access.expires_in),
          refreshToken: access.refresh_token,
          refreshExpires: convertExpireToDate(access.refresh_token_expires_in),
        });
      }

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
      });
    }

    // const data: any = await response.json();

    // if (!response.ok) {
    //   throw new Error(
    //     `Token exchange failed: ${data.error} - ${data.error_description || ""}`,
    //   );
    // }
    // console.info("DATA", data);

    // const url = new URL("https://www.googleapis.com/drive/v3/files");
    // url.searchParams.set("pageSize", "10");
    // url.searchParams.set("fields", "files(id,name)");

    // const response = await fetch(url, {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });
    // console.info("response", response);
    const errorPayload: PayloadType = { type: "ERROR", msg: "Unknown request" };
    return new Response(JSON.stringify(errorPayload), { status: 404 });
  },
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ) {
    // Parse the raw email message
    const parser = new PostalMime();
    const rawEmail = new Response(message.raw);
    const email = await parser.parse(await rawEmail.arrayBuffer());

    console.log("Received email:", {
      from: message.from,
      to: message.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    console.log("Email", message.from, email.html);

    // Route based on recipient
    if (message.to.includes("support@")) {
      await message.forward("przemekkudla@hotmail.com");
    } else {
      await message.forward("pkudla@opera.com");
    }
  },
} satisfies ExportedHandler<Env>;
