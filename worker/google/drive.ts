export interface DriveFile {
  id: string;
  name: string;
}

/** Cap for file contents read via MCP (bytes), before decoding. */
const MAX_CONTENT_BYTES = 256 * 1024;

/** Raised when Drive rejects the token, so callers can tell this apart. */
export class DriveAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveAuthError";
  }
}

function driveError(status: number, body: string, context: string): Error {
  const message = `${context}: ${status} ${body}`;
  return status === 401 || status === 403
    ? new DriveAuthError(message)
    : new Error(message);
}

class GoogleDrive {
  readonly #token;
  readonly #folder;
  constructor(accessToken: string, folder = "dearkarl") {
    this.#token = accessToken;
    this.#folder = folder;
  }

  get #headers() {
    return { Authorization: `Bearer ${this.#token}` };
  }

  /**
   * Returns the folder id as a string on every path. The create branch used
   * to return the whole API response object, so the first write for a new
   * user was given an object where an id was expected.
   */
  async getRootFolderId(): Promise<any> {
    const query = `name = '${this.#folder.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      { headers: this.#headers },
    );
    if (!searchRes.ok) {
      throw driveError(
        searchRes.status,
        await searchRes.text(),
        "Failed to search for folder",
      );
    }

    const searchData = (await searchRes.json()) as { files?: DriveFile[] };
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    const createRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?fields=id,name",
      {
        method: "POST",
        headers: { ...this.#headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.#folder,
          mimeType: "application/vnd.google-apps.folder",
        }),
      },
    );

    if (!createRes.ok) {
      throw driveError(
        createRes.status,
        await createRes.text(),
        "Failed to create folder",
      );
    }

    const created = (await createRes.json()) as DriveFile;
    if (!created?.id) throw new Error("Drive did not return a folder id");
    return created.id;
  }

  async fetchAllFiles(folderId: string) {
    const filesQuery = encodeURIComponent(
      `'${folderId}' in parents and trashed = false`,
    );
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${filesQuery}&fields=files(id,name,mimeType)`,
      { headers: this.#headers },
    );
    if (!filesRes.ok) {
      throw driveError(
        filesRes.status,
        await filesRes.text(),
        "Failed to list files",
      );
    }

    const filesData = (await filesRes.json()) as {
      files?: Array<DriveFile & { mimeType: string }>;
    };
    const files = filesData.files ?? [];

    const results = [];
    for (const file of files) {
      let content;
      const { content: fileContent } = await this.getFileContent(
        file.id,
        file.mimeType,
      );
      content = fileContent;

      results.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        content,
      });
    }
    return results;
  }

  /**
   * File metadata (no content) within the dearkarl folder. Used by the MCP
   * `list_files` tool — do not use `fetchAllFiles` for listing, it downloads
   * every file body.
   */
  async listFiles(folderId: string) {
    const filesQuery = encodeURIComponent(
      `'${folderId}' in parents and trashed = false`,
    );
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${filesQuery}&fields=files(id,name,mimeType,size,modifiedTime)`,
      { headers: this.#headers },
    );
    if (!filesRes.ok) {
      throw driveError(
        filesRes.status,
        await filesRes.text(),
        "Failed to list files",
      );
    }

    const filesData = (await filesRes.json()) as {
      files?: Array<{
        id: string;
        name: string;
        mimeType: string;
        size?: string;
        modifiedTime?: string;
      }>;
    };
    return (filesData.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? Number(f.size) : null,
      modifiedTime: f.modifiedTime ?? null,
    }));
  }

  async getFileMeta(fileId: string) {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
      { headers: this.#headers },
    );
    if (!metaRes.ok) {
      throw driveError(
        metaRes.status,
        await metaRes.text(),
        "Failed to fetch file metadata",
      );
    }
    return (await metaRes.json()) as { id: string; name: string; mimeType: string };
  }

  /**
   * Download a file's text content, capped at `MAX_CONTENT_BYTES`.
   * Google-native docs (Doc/Sheet/Slide) are exported as text/plain;
   * regular files (e.g. .txt) are downloaded directly.
   */
  async getFileContent(fileId: string, mimeType: string) {
    if (mimeType.startsWith("application/vnd.google-apps")) {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers: this.#headers },
      );
      if (!exportRes.ok) {
        throw driveError(
          exportRes.status,
          await exportRes.text(),
          "Failed to export file",
        );
      }
      return this.#readTruncated(exportRes);
    }

    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: this.#headers },
    );
    if (!downloadRes.ok) {
      throw driveError(
        downloadRes.status,
        await downloadRes.text(),
        "Failed to download file",
      );
    }
    return this.#readTruncated(downloadRes);
  }

  /**
   * Read a response body as text, slicing to MAX_CONTENT_BYTES *before*
   * decoding so an oversized email cannot blow up memory.
   */
  async #readTruncated(res: Response) {
    const buf = await res.arrayBuffer();
    const truncated = buf.byteLength > MAX_CONTENT_BYTES;
    const bytes = new Uint8Array(buf).slice(0, MAX_CONTENT_BYTES);
    const content =
      new TextDecoder().decode(bytes) +
      (truncated ? "\n…[truncated at 256KB]…" : "");
    return { content, truncated };
  }

  async pushFile(folderId: string, name: string, payload: string) {
    const metadata = {
      name,
      parents: [folderId],
      mimeType: "text/plain",
    };

    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: text/plain\r\n\r\n" +
      payload +
      closeDelimiter;

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,parents",
      {
        method: "POST",
        headers: {
          ...this.#headers,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      },
    );

    if (!uploadRes.ok) {
      throw driveError(
        uploadRes.status,
        await uploadRes.text(),
        `Failed to create ${name}`,
      );
    }

    return uploadRes.json();
  }
}

export default GoogleDrive;
