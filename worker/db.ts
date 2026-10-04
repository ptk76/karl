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
        user.login,
        user.access_token,
        user.access_expires,
        user.refresh_token,
        user.refresh_expires,
        user.session_id,
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
        user.access_token,
        user.access_expires,
        user.refresh_token,
        user.refresh_expires,
        user.session_id,
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

export default UsersDB;
