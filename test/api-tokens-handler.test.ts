import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenHandler } from "../worker/api/tokens";
import loginHandler from "../worker/api/login";

const mocks = vi.hoisted(() => ({
  getUserBySid: vi.fn(),
  listActiveTokens: vi.fn(),
  createToken: vi.fn(),
  revokeToken: vi.fn(),
}));

vi.mock("../worker/db", () => ({
  default: class {
    getUserBySid = mocks.getUserBySid;
  },
  ApiTokensDB: class {
    listActiveTokens = mocks.listActiveTokens;
    createToken = mocks.createToken;
    revokeToken = mocks.revokeToken;
  },
}));

vi.mock("../worker/google/token", () => ({
  default: class {},
}));

const SID = "sid-123";
const USER = { email: "user@example.com", login: "karl-login" };
const noDb = {} as never;

function tokenRequest(path: string, init?: RequestInit) {
  return new Request(`https://example.com${path}`, {
    ...init,
    headers: {
      cookie: `sid=${SID}`,
      ...(init?.headers ?? {}),
    },
  });
}

function jsonRequest(path: string, body: unknown, extra?: RequestInit) {
  return tokenRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...extra,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUserBySid.mockResolvedValue(USER);
});

describe("session auth", () => {
  it("returns 404 without a sid cookie", async () => {
    const res = await tokenHandler(
      new Request("https://example.com/api/tokens"),
      noDb,
    );
    expect(res.status).toBe(404);
    expect(mocks.getUserBySid).not.toHaveBeenCalled();
  });

  it("returns 404 when no user matches the sid", async () => {
    mocks.getUserBySid.mockResolvedValue(null);
    const res = await tokenHandler(tokenRequest("/api/tokens"), noDb);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/tokens", () => {
  it("returns active token summaries without hash or plaintext", async () => {
    mocks.listActiveTokens.mockResolvedValue([
      {
        id: 7,
        name: "Claude Code",
        token_hash: "deadbeef",
        token_prefix: "karl_a1b2c3",
        created_at: 1000,
        expires_at: null,
        last_used_at: 2000,
      },
    ]);

    const res = await tokenHandler(tokenRequest("/api/tokens"), noDb);

    expect(res.status).toBe(200);
    expect(mocks.listActiveTokens).toHaveBeenCalledWith("user@example.com", expect.any(Number));
    expect(await res.json()).toEqual([
      {
        id: 7,
        name: "Claude Code",
        prefix: "karl_a1b2c3",
        createdAt: 1000,
        expiresAt: null,
        lastUsedAt: 2000,
      },
    ]);
  });
});

describe("POST /api/tokens", () => {
  it("stores only the SHA-256 hash and returns the plaintext once", async () => {
    mocks.createToken.mockResolvedValue(9);

    const res = await tokenHandler(jsonRequest("/api/tokens", {}), noDb);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toMatch(/^karl_[0-9a-f]{64}$/);
    expect(body.prefix).toBe(body.token.slice(0, 12));

    // The DB call must receive the hash, never the raw token.
    const createArgs = mocks.createToken.mock.calls[0][0];
    expect(createArgs.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(createArgs.tokenHash).not.toBe(body.token);
    expect(createArgs.tokenPrefix).toBe(body.token.slice(0, 12));
    expect(createArgs.email).toBe("user@example.com");
  });

  it("honours name and expiresInDays", async () => {
    mocks.createToken.mockResolvedValue(1);
    const before = Date.now();

    const res = await tokenHandler(
      jsonRequest("/api/tokens", { name: "Desktop", expiresInDays: 30 }),
      noDb,
    );

    const body = await res.json();
    expect(body.name).toBe("Desktop");
    const createArgs = mocks.createToken.mock.calls[0][0];
    expect(createArgs.name).toBe("Desktop");
    // ~30 days from now
    expect(createArgs.expiresAt).toBeGreaterThan(before + 29 * 86400000);
    expect(createArgs.expiresAt).toBeLessThan(before + 31 * 86400000);
  });

  it("defaults to no expiry", async () => {
    mocks.createToken.mockResolvedValue(1);
    await tokenHandler(jsonRequest("/api/tokens", {}), noDb);
    expect(mocks.createToken.mock.calls[0][0].expiresAt).toBeNull();
  });

  it("rejects a malformed body", async () => {
    const res = await tokenHandler(
      jsonRequest("/api/tokens", { expiresInDays: "soon" }),
      noDb,
    );
    expect(res.status).toBe(404);
    expect(mocks.createToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/tokens/revoke", () => {
  it("revokes the token for the session user", async () => {
    mocks.revokeToken.mockResolvedValue(true);
    const res = await tokenHandler(
      jsonRequest("/api/tokens/revoke", { id: 9 }),
      noDb,
    );
    expect(res.status).toBe(200);
    expect(mocks.revokeToken).toHaveBeenCalledWith("user@example.com", 9);
  });

  it("returns 404 when the token does not belong to the user", async () => {
    mocks.revokeToken.mockResolvedValue(false);
    const res = await tokenHandler(
      jsonRequest("/api/tokens/revoke", { id: 999 }),
      noDb,
    );
    expect(res.status).toBe(404);
  });

  it("rejects a malformed body", async () => {
    const res = await tokenHandler(
      jsonRequest("/api/tokens/revoke", { id: "nope" }),
      noDb,
    );
    expect(res.status).toBe(404);
    expect(mocks.revokeToken).not.toHaveBeenCalled();
  });
});

describe("routing through loginHandler", () => {
  const SECRET = "{}";

  it("mints a token on POST /api/tokens without the body being consumed", async () => {
    mocks.createToken.mockResolvedValue(21);

    const res = await loginHandler(
      jsonRequest("/api/tokens", { name: "via login" }),
      SECRET,
      noDb,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("via login");
    expect(mocks.createToken).toHaveBeenCalledTimes(1);
    const createArgs = mocks.createToken.mock.calls[0][0];
    expect(createArgs.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("routes POST /api/tokens/revoke to the token handler", async () => {
    mocks.revokeToken.mockResolvedValue(true);

    const res = await loginHandler(
      jsonRequest("/api/tokens/revoke", { id: 5 }),
      SECRET,
      noDb,
    );

    expect(res.status).toBe(200);
    expect(mocks.revokeToken).toHaveBeenCalledWith("user@example.com", 5);
  });
});
