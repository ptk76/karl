import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import GoogleDrive, { DriveAuthError } from "../google/drive";
import GoogleToken from "../google/token";
import UsersDB, { UserTableRow } from "../db";
import { getValidToken } from "../api/utils";

/** Thrown when the user's Drive token cannot be obtained/refreshed. */
export class ReauthNeededError extends Error {
  constructor() {
    super("Google Drive re-authorization required");
    this.name = "ReauthNeededError";
  }
}

const REAUTH_MESSAGE =
  "Google Drive re-authorization required. Log in at " +
  "https://karl.przemekkudla.pl to refresh your Google access, then retry.";

type Deps = {
  user: UserTableRow;
  client: GoogleToken;
  db: Env["DB"];
};

function driveErrorResult(e: unknown) {
  const isAuth = e instanceof DriveAuthError || e instanceof ReauthNeededError;
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: isAuth ? REAUTH_MESSAGE : `Drive error: ${(e as Error)?.message ?? e}`,
      },
    ],
  };
}

/**
 * Build a read-only MCP server bound to one authenticated user. Every request
 * is served by a fresh instance built in `mcpHandler` — a new server + new
 * transport per HTTP request (stateless mode).
 */
export function createMcpServer(deps: Deps): McpServer {
  const { user, client, db } = deps;
  const server = new McpServer({ name: "dear-karl", version: "0.1.0" });

  /** Fresh GoogleDrive for this user, refreshing their access token if needed. */
  async function drive(): Promise<GoogleDrive> {
    const accessToken = await getValidToken(user, client, new UsersDB(db));
    if (!accessToken) throw new ReauthNeededError();
    return new GoogleDrive(accessToken);
  }

  async function driveFolder(): Promise<{ drive: GoogleDrive; folderId: string }> {
    const gdrive = await drive();
    const folderId = await gdrive.getRootFolderId();
    return { drive: gdrive, folderId };
  }

  server.registerTool(
    "list_files",
    {
      title: "List Saved Files",
      description:
        "List the files saved to the user's Dear Karl folder in Google Drive " +
        "(the dearkarl folder). Returns file metadata (id, name, mimeType, " +
        "size, modifiedTime) without contents. Use the returned file id or " +
        "name with read_file to get the contents.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const { drive: gdrive, folderId } = await driveFolder();
        const files = await gdrive.listFiles(folderId);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(files, null, 2) }],
          // Object-shaped on purpose: the 2025 wire requires structuredContent
          // to be an object (an array would be auto-wrapped in {result: …}).
          structuredContent: { files },
        };
      } catch (e) {
        return driveErrorResult(e);
      }
    },
  );

  server.registerTool(
    "read_file",
    {
      title: "Read File Contents",
      description:
        "Read the text contents of a file saved in the user's Dear Karl " +
        "Google Drive folder. Provide exactly one of fileId (the id returned " +
        "by list_files) or name (the file name). Contents are capped at " +
        "256 KB.",
      inputSchema: z
        .object({
          fileId: z.string().optional(),
          name: z.string().optional(),
        })
        .refine((a) => (a.fileId !== undefined) !== (a.name !== undefined), {
          message: "Provide exactly one of fileId or name",
        }),
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      // Enforced again here: .refine constraints do not survive the JSON-Schema
      // conversion the wire validation uses, so this is the authoritative check.
      if ((args.fileId === undefined) === (args.name === undefined)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "Provide exactly one of fileId or name.",
            },
          ],
        };
      }

      try {
        const { drive: gdrive, folderId } = await driveFolder();

        let fileId = args.fileId;
        let meta: { id: string; name: string; mimeType: string } | null = null;
        if (args.name !== undefined) {
          const files = await gdrive.listFiles(folderId);
          const match = files.find(
            (f) => f.name.toLowerCase() === (args.name ?? "").toLowerCase(),
          );
          if (!match) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: `No file named "${args.name}" found in your Dear Karl folder. Use list_files to see available files.`,
                },
              ],
            };
          }
          fileId = match.id;
          meta = { id: match.id, name: match.name, mimeType: match.mimeType };
        }

        if (!fileId) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: "No matching file found." }],
          };
        }

        const fileMeta = meta ?? (await gdrive.getFileMeta(fileId));
        const { content, truncated } = await gdrive.getFileContent(fileId, fileMeta.mimeType);
        return {
          content: [{ type: "text" as const, text: content }],
          structuredContent: {
            id: fileMeta.id,
            name: fileMeta.name,
            mimeType: fileMeta.mimeType,
            truncated,
            content,
          },
        };
      } catch (e) {
        return driveErrorResult(e);
      }
    },
  );

  return server;
}
