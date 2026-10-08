import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleDrive, { DriveAuthError } from "../worker/google/drive";

const MAX = 256 * 1024;

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getFileContent", () => {
  it("downloads regular files and truncates oversized content", async () => {
    const big = "x".repeat(MAX + 1000);
    fetchMock.mockResolvedValue(new Response(big));

    const drive = new GoogleDrive("tok");
    const { content, truncated } = await drive.getFileContent("id1", "text/plain");

    // Content must be sliced before decode; the marker must be appended.
    expect(truncated).toBe(true);
    expect(content.length).toBeLessThanOrEqual(MAX + 64);
    expect(content.endsWith("…[truncated at 256KB]…")).toBe(true);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/drive/v3/files/id1?alt=media");
  });

  it("exports Google-native docs as text/plain", async () => {
    fetchMock.mockResolvedValue(new Response("exported text"));

    const drive = new GoogleDrive("tok");
    const { content, truncated } = await drive.getFileContent(
      "doc1",
      "application/vnd.google-apps.document",
    );

    expect(truncated).toBe(false);
    expect(content).toBe("exported text");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/drive/v3/files/doc1/export?mimeType=text/plain");
  });

  it("passes through small files unchanged", async () => {
    fetchMock.mockResolvedValue(new Response("hello"));

    const drive = new GoogleDrive("tok");
    const { content, truncated } = await drive.getFileContent("id1", "text/plain");

    expect(truncated).toBe(false);
    expect(content).toBe("hello");
  });
});

describe("error mapping", () => {
  it("throws DriveAuthError on 401", async () => {
    fetchMock.mockResolvedValue(new Response("unauthorized", { status: 401 }));

    const drive = new GoogleDrive("tok");
    await expect(drive.getFileContent("id1", "text/plain")).rejects.toThrow(
      DriveAuthError,
    );
  });

  it("throws a plain Error on other statuses", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));

    const drive = new GoogleDrive("tok");
    await expect(drive.getFileContent("id1", "text/plain")).rejects.not.toThrow(
      DriveAuthError,
    );
  });
});

describe("listFiles", () => {
  it("requests metadata only and converts size to a number", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          files: [
            { id: "a", name: "n.txt", mimeType: "text/plain", size: "42", modifiedTime: "2026-01-01T00:00:00Z" },
          ],
        }),
      ),
    );

    const drive = new GoogleDrive("tok");
    const files = await drive.listFiles("folder-1");

    expect(files).toEqual([
      { id: "a", name: "n.txt", mimeType: "text/plain", size: 42, modifiedTime: "2026-01-01T00:00:00Z" },
    ]);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(decodeURIComponent(url)).toContain("'folder-1' in parents");
    expect(url).toContain("modifiedTime");
  });
});
