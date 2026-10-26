import { beforeEach, describe, expect, it, vi } from "vitest";
import { mcpHandler } from "../worker/mcp/handler";

// The handler news up UsersDB, ApiTokensDB, GoogleToken and GoogleDrive
// internally, so we replace those modules. Authentication itself happens in the
// OAuth provider (test/oauth-provider.test.ts); here the handler is called as
// the provider calls it, with the owner already in ctx.props.
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  touchToken: vi.fn(),
  isTokenValid: vi.fn(),
  refreshAccessToken: vi.fn(),
  revokeGoogleToken: vi.fn(),
  getRootFolderId: vi.fn(),
  listFiles: vi.fn(),
  getFileMeta: vi.fn(),
  getFileContent: vi.fn(),
}));

vi.mock("../worker/db", () => ({
  ApiTokensDB: class {
    touchToken = mocks.touchToken;
  },
  default: class {
    getUser = mocks.getUser;
  },
}));

vi.mock("../worker/google/token", () => ({
  default: class {
    isTokenValid = mocks.isTokenValid;
    refreshAccessToken = mocks.refreshAccessToken;
    revokeGoogleToken = mocks.revokeGoogleToken;
  },
}));

vi.mock("../worker/google/drive", () => ({
  default: class {
    getRootFolderId = mocks.getRootFolderId;
    listFiles = mocks.listFiles;
    getFileMeta = mocks.getFileMeta;
    getFileContent = mocks.getFileContent;
  },
  DriveAuthError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "DriveAuthError";
    }
  },
}));

const MOCK_USER = {
  email: "user@example.com",
  login: "karl-login",
  access_token: "google-access",
  access_expires: Date.now() + 60_000,
  refresh_token: "google-refresh",
};

const noDb = {} as never;
const patCtx = {
  waitUntil: () => {},
  props: { email: MOCK_USER.email, patId: 1 },
} as unknown as ExecutionContext;

function mcpCall(body: unknown) {
  return new Request("https://example.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Streamable HTTP requires the client to accept both formats.
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });
}

function toolCall(name: string, args: Record<string, unknown> = {}) {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

async function callTool(name: string, args?: Record<string, unknown>) {
  const res = await mcpHandler(mcpCall(toolCall(name, args)), { DB: noDb, GOOGLE_CLIENT_SECRET: "{}" } as never, patCtx);
  expect(res.status).toBe(200);
  const body = await res.json();
  if (body.error) throw new Error(`JSON-RPC error: ${JSON.stringify(body.error)}`);
  return body.result as any;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue(MOCK_USER);
  mocks.isTokenValid.mockReturnValue(true);
  mocks.getRootFolderId.mockResolvedValue("folder-1");
  mocks.touchToken.mockResolvedValue();
});

describe("authentication", () => {
  const env = { DB: noDb, GOOGLE_CLIENT_SECRET: "{}" } as never;
  const ping = () => mcpCall({ jsonrpc: "2.0", id: 1, method: "ping" });

  it("rejects a request without props", async () => {
    const res = await mcpHandler(ping(), env, { waitUntil: () => {} } as never);
    expect(res.status).toBe(401);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("rejects props whose user no longer exists", async () => {
    mocks.getUser.mockResolvedValue(null);
    const res = await mcpHandler(ping(), env, patCtx);
    expect(res.status).toBe(401);
  });

  it("touches last_used_at for a Personal Access Token", async () => {
    mocks.getRootFolderId.mockResolvedValue("folder-1");
    mocks.listFiles.mockResolvedValue([]);
    await callTool("list_files");
    expect(mocks.getUser).toHaveBeenCalledWith(MOCK_USER.email);
    expect(mocks.touchToken).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it("does not touch any token for an OAuth access token", async () => {
    const oauthCtx = {
      waitUntil: () => {},
      props: { email: MOCK_USER.email },
    } as unknown as ExecutionContext;
    const res = await mcpHandler(ping(), env, oauthCtx);
    expect(res.status).toBe(200);
    expect(mocks.touchToken).not.toHaveBeenCalled();
  });
});

describe("initialize", () => {
  it("returns server info", async () => {
    const res = await mcpHandler(
      mcpCall({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
      { DB: noDb, GOOGLE_CLIENT_SECRET: "{}" } as never,
      patCtx,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe("dear-karl");
  });
});

describe("list_files", () => {
  it("returns metadata for the user's dearkarl folder", async () => {
    mocks.listFiles.mockResolvedValue([
      { id: "f1", name: "notes.txt", mimeType: "text/plain", size: 5, modifiedTime: "2026-01-01T00:00:00Z" },
    ]);

    const result = await callTool("list_files");

    expect(mocks.getRootFolderId).toHaveBeenCalled();
    expect(result.structuredContent).toEqual({
      files: [
        { id: "f1", name: "notes.txt", mimeType: "text/plain", size: 5, modifiedTime: "2026-01-01T00:00:00Z" },
      ],
    });
    expect(result.content[0].text).toContain("notes.txt");
    expect(result.isError).toBeFalsy();
  });

  it("reports re-auth needed when the Drive token cannot be refreshed", async () => {
    mocks.isTokenValid.mockReturnValue(false);
    mocks.refreshAccessToken.mockRejectedValue(new Error("refresh failed"));

    const result = await callTool("list_files");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("re-authorization required");
  });

  it("surfaces a generic Drive error", async () => {
    mocks.getRootFolderId.mockRejectedValue(
      new (class extends Error {
        constructor() {
          super("boom");
        }
      })(),
    );

    const result = await callTool("list_files");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Drive error");
  });
});

describe("read_file", () => {
  it("reads by file id", async () => {
    mocks.getFileMeta.mockResolvedValue({ id: "f1", name: "notes.txt", mimeType: "text/plain" });
    mocks.getFileContent.mockResolvedValue({ content: "hello world", truncated: false });

    const result = await callTool("read_file", { fileId: "f1" });

    expect(mocks.getFileMeta).toHaveBeenCalledWith("f1");
    expect(mocks.getFileContent).toHaveBeenCalledWith("f1", "text/plain");
    expect(result.structuredContent).toMatchObject({ id: "f1", name: "notes.txt", content: "hello world", truncated: false });
    expect(result.isError).toBeFalsy();
  });

  it("reads by name (case-insensitive lookup)", async () => {
    mocks.listFiles.mockResolvedValue([{ id: "f9", name: "Lectures.txt", mimeType: "text/plain" }]);
    mocks.getFileContent.mockResolvedValue({ content: "study notes", truncated: false });

    const result = await callTool("read_file", { name: "lectures.txt" });

    expect(mocks.getFileContent).toHaveBeenCalledWith("f9", "text/plain");
    expect(result.structuredContent.content).toBe("study notes");
  });

  it("returns isError when the name does not exist", async () => {
    mocks.listFiles.mockResolvedValue([{ id: "f9", name: "Lectures.txt", mimeType: "text/plain" }]);

    const result = await callTool("read_file", { name: "missing.txt" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No file named "missing.txt"');
  });

  it("rejects providing both id and name", async () => {
    const res = await mcpHandler(
      mcpCall(toolCall("read_file", { fileId: "f1", name: "x.txt" })),
      { DB: noDb, GOOGLE_CLIENT_SECRET: "{}" } as never,
      patCtx,
    );
    const body = await res.json();
    expect(body.result).toBeDefined();
    expect(body.result.isError).toBe(true);
    expect(mocks.getFileMeta).not.toHaveBeenCalled();
    expect(mocks.getRootFolderId).not.toHaveBeenCalled();
  });

  it("passes the truncated flag through", async () => {
    mocks.getFileMeta.mockResolvedValue({ id: "f1", name: "big.txt", mimeType: "text/plain" });
    mocks.getFileContent.mockResolvedValue({
      content: "lots of text\n…[truncated at 256KB]…",
      truncated: true,
    });

    const result = await callTool("read_file", { fileId: "f1" });

    expect(result.structuredContent.truncated).toBe(true);
    expect(result.content[0].text).toContain("truncated");
  });
});
