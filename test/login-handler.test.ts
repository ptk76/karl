import { beforeEach, describe, expect, it, vi } from "vitest";
import loginHandler from "../worker/api/login";

// Shared mocks: the handler news up GoogleToken and UsersDB internally, so we
// replace those modules and control their methods from the test. hoisted() keeps
// these references usable from inside the vi.mock factories.
const mocks = vi.hoisted(() => ({
  getLoginUrl: vi.fn(),
  getAccessToken: vi.fn(),
  isTokenValid: vi.fn(),
  refreshAccessToken: vi.fn(),
  getUser: vi.fn(),
  getUserBySid: vi.fn(),
  addUser: vi.fn(),
  updateUserTokens: vi.fn(),
}));

vi.mock("../worker/google/token", () => ({
  default: class {
    getLoginUrl = mocks.getLoginUrl;
    getAccessToken = mocks.getAccessToken;
    isTokenValid = mocks.isTokenValid;
    refreshAccessToken = mocks.refreshAccessToken;
  },
}));

vi.mock("../worker/db", () => ({
  default: class {
    getUser = mocks.getUser;
    getUserBySid = mocks.getUserBySid;
    addUser = mocks.addUser;
    updateUserTokens = mocks.updateUserTokens;
  },
}));

// loginHandler ignores these when the modules above are mocked.
const SECRET = "{}";
const noDb = {} as never;

function apiRequest(path: string, init?: RequestInit) {
  return new Request(`https://example.com${path}`, init);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("/api/login", () => {
  it("returns 200 with the Google login URL for a POST", async () => {
    mocks.getLoginUrl.mockReturnValue(
      "https://accounts.google.com/o/oauth2/v2/auth?foo=1",
    );

    const res = await loginHandler(
      apiRequest("/api/login", { method: "POST" }),
      SECRET,
      noDb,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://accounts.google.com/o/oauth2/v2/auth?foo=1",
    });
  });

  it("returns 200 for a GET as well (routing is path-based)", async () => {
    mocks.getLoginUrl.mockReturnValue("https://accounts.google.com/");

    const res = await loginHandler(apiRequest("/api/login"), SECRET, noDb);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://accounts.google.com/" });
  });

  it("does not touch the database", async () => {
    mocks.getLoginUrl.mockReturnValue("https://accounts.google.com/");

    await loginHandler(apiRequest("/api/login"), SECRET, noDb);

    expect(mocks.getUserBySid).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});

describe("/api/active", () => {
  const sid = "abc123";
  const userRow = {
    email: "user@example.com",
    login: "karl-login",
    access_token: "google-token-123",
    refresh_token: "refresh-123",
  };

  function activeRequest() {
    return apiRequest("/api/active", {
      headers: { cookie: `sid=${sid}` },
    });
  }

  it("returns 404 when there is no sid cookie", async () => {
    const res = await loginHandler(apiRequest("/api/active"), SECRET, noDb);

    expect(res.status).toBe(404);
    expect(mocks.getUserBySid).not.toHaveBeenCalled();
  });

  it("returns 404 when no user matches the sid", async () => {
    mocks.getUserBySid.mockResolvedValue(null);

    const res = await loginHandler(activeRequest(), SECRET, noDb);

    expect(res.status).toBe(404);
    expect(mocks.getUserBySid).toHaveBeenCalledWith(sid);
    expect(mocks.isTokenValid).not.toHaveBeenCalled();
  });

  it("returns 404 when the user's Google token has expired", async () => {
    mocks.getUserBySid.mockResolvedValue(userRow);
    mocks.isTokenValid.mockReturnValue(false);
    mocks.refreshAccessToken.mockRejectedValue(new Error("refresh failed"));

    const res = await loginHandler(activeRequest(), SECRET, noDb);

    expect(res.status).toBe(404);
    expect(mocks.isTokenValid).toHaveBeenCalled();
    expect(mocks.refreshAccessToken).toHaveBeenCalledWith("refresh-123");
  });

  it("returns 200 with the active session when the token is valid", async () => {
    mocks.getUserBySid.mockResolvedValue(userRow);
    mocks.isTokenValid.mockReturnValue(true);

    const res = await loginHandler(activeRequest(), SECRET, noDb);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      userEmail: "user@example.com",
      karlEmail: "karl-login",
    });
  });
});

describe("routing", () => {
  it("returns 404 for an unknown route", async () => {
    const res = await loginHandler(apiRequest("/api/nope"), SECRET, noDb);

    expect(res.status).toBe(404);
  });
});
