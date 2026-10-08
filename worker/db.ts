export interface UserTableRow {
  email: string;
  login?: string;
  access_token?: string | null;
  access_expires?: number | null;
  refresh_token?: string | null;
  refresh_expires?: number | null;
  session_id?: string | null;
}

class UsersDB {
  constructor(private readonly db: D1Database) {}

  /**
   * Fetch a user by email. Returns null if not found.
   */
  async getUser(email: string): Promise<UserTableRow | null> {
    const row = await this.db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(email)
      .first<UserTableRow>();

    if (!row) return null;

    return row;
  }

  async removeUser(email: string): Promise<UserTableRow | null> {
    const row = await this.db
      .prepare(`DELETE FROM users WHERE email = ?`)
      .bind(email)
      .first<UserTableRow>();

    if (!row) return null;

    return row;
  }

  /**
   * Fetch a user by session. Returns null if not found.
   */
  async getUserBySid(sid: string): Promise<UserTableRow | null> {
    const row = await this.db
      .prepare(`SELECT * FROM users WHERE session_id = ?`)
      .bind(sid)
      .first<UserTableRow>();

    if (!row) return null;

    return row;
  }

  /**
   * Insert a new user. Throws if the email or login already exists
   * (UNIQUE constraint violation).
   */
  async addUser(user: UserTableRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (email, login, access_token, access_expires, refresh_token, refresh_expires, session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.email,
        user.login ?? null,
        user.access_token ?? null,
        user.access_expires ?? null,
        user.refresh_token ?? null,
        user.refresh_expires ?? null,
        user.session_id ?? null,
      )
      .run();
  }

  /**
   * Update tokens for an existing user. If refreshToken is omitted/null,
   * the existing refresh_token / refresh_expires are left untouched.
   */
  async updateUserTokens(user: UserTableRow): Promise<void> {
    await this.db
      .prepare(
        `UPDATE users
         SET access_token = ?,
             access_expires = ?,
             refresh_token = COALESCE(?, refresh_token),
             refresh_expires = COALESCE(?, refresh_expires),
             session_id = COALESCE(?, session_id)
         WHERE email = ?`,
      )
      .bind(
        user.access_token ?? null,
        user.access_expires ?? null,
        user.refresh_token ?? null,
        user.refresh_expires ?? null,
        user.session_id ?? null,
        user.email,
      )
      .run();
  }

  async logout(email: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE users
         SET access_token = null,
             access_expires = null,
             refresh_token = null,
             refresh_expires = null,
             session_id = null
         WHERE email = ?`,
      )
      .bind(email)
      .run();
  }
}

export interface ApiTokenRow {
  id: number;
  email: string;
  name: string;
  token_hash: string;
  token_prefix: string;
  created_at: number;
  expires_at: number | null;
  last_used_at: number | null;
  revoked_at: number | null;
}

/** Result of a PAT lookup: the owning user plus the matching token id. */
export type TokenUser = { user: UserTableRow; tokenId: number };

/**
 * Access to the `api_tokens` table — Personal Access Tokens used to
 * authenticate MCP clients. Only SHA-256 hashes of tokens are persisted.
 */
class ApiTokensDB {
  constructor(private readonly db: D1Database) {}

  async createToken(row: {
    email: string;
    name: string;
    tokenHash: string;
    tokenPrefix: string;
    createdAt: number;
    expiresAt: number | null;
  }): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT INTO api_tokens
           (email, name, token_hash, token_prefix, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        row.email,
        row.name,
        row.tokenHash,
        row.tokenPrefix,
        row.createdAt,
        row.expiresAt,
      )
      .run();
    return Number(result.meta.last_row_id);
  }

  /**
   * Resolve a token hash to its owning user in one query. Returns null for an
   * unknown, revoked, or expired token.
   */
  async findUserByTokenHash(
    tokenHash: string,
    now: number,
  ): Promise<TokenUser | null> {
    const row = await this.db
      .prepare(
        `SELECT
           u.email AS u_email,
           u.login AS u_login,
           u.access_token AS u_access_token,
           u.access_expires AS u_access_expires,
           u.refresh_token AS u_refresh_token,
           u.refresh_expires AS u_refresh_expires,
           u.session_id AS u_session_id,
           t.id AS token_id
         FROM api_tokens t
         JOIN users u ON u.email = t.email
         WHERE t.token_hash = ?
           AND t.revoked_at IS NULL
           AND (t.expires_at IS NULL OR t.expires_at > ?)`,
      )
      .bind(tokenHash, now)
      .first<Record<string, unknown>>();

    if (!row) return null;

    return {
      user: {
        email: row.u_email as string,
        login: (row.u_login as string) ?? undefined,
        access_token: (row.u_access_token as string) ?? null,
        access_expires: (row.u_access_expires as number) ?? null,
        refresh_token: (row.u_refresh_token as string) ?? null,
        refresh_expires: (row.u_refresh_expires as number) ?? null,
        session_id: (row.u_session_id as string) ?? null,
      },
      tokenId: Number(row.token_id),
    };
  }

  async listActiveTokens(email: string, now: number): Promise<ApiTokenRow[]> {
    const rows = await this.db
      .prepare(
        `SELECT * FROM api_tokens
         WHERE email = ?
           AND revoked_at IS NULL
           AND (expires_at IS NULL OR expires_at > ?)
         ORDER BY created_at DESC`,
      )
      .bind(email, now)
      .all<ApiTokenRow>();
    return rows.results ?? [];
  }

  async revokeToken(email: string, id: number): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE api_tokens
         SET revoked_at = ?
         WHERE id = ? AND email = ?`,
      )
      .bind(Date.now(), id, email)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async touchToken(tokenId: number, now: number): Promise<void> {
    await this.db
      .prepare(`UPDATE api_tokens SET last_used_at = ? WHERE id = ?`)
      .bind(now, tokenId)
      .run();
  }
}

export default UsersDB;
export { ApiTokensDB };
