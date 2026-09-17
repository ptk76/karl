export interface User {
  email: string;
  login: string;
  accessToken: string;
  accessExpires: number;
  refreshToken: string | null;
  refreshExpires: number | null;
}

interface NewUser {
  email: string;
  login: string;
  accessToken: string;
  accessExpires: number;
  refreshToken?: string | null;
  refreshExpires?: number | null;
}

interface TokenUpdate {
  accessToken: string;
  accessExpires: number;
  refreshToken?: string | null;
  refreshExpires?: number | null;
}

interface UsersTable {
  email: string;
  login: string;
  access_token: string;
  access_expires: number;
  refresh_token: string | null;
  refresh_expires: number | null;
}

class UsersDB {
  constructor(private readonly db: D1Database) {}

  /**
   * Fetch a user by email. Returns null if not found.
   */
  async getUser(email: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(email)
      .first<UsersTable>();

    if (!row) return null;

    return {
      email: row.email,
      login: row.login,
      accessToken: row.access_token,
      accessExpires: row.access_expires,
      refreshToken: row.refresh_token,
      refreshExpires: row.refresh_expires,
    };
  }

  /**
   * Insert a new user. Throws if the email or login already exists
   * (UNIQUE constraint violation).
   */
  async addUser(user: NewUser): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (email, login, access_token, access_expires, refresh_token, refresh_expires)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.email,
        user.login,
        user.accessToken,
        user.accessExpires,
        user.refreshToken ?? null,
        user.refreshExpires ?? null,
      )
      .run();
  }

  /**
   * Update tokens for an existing user. If refreshToken is omitted/null,
   * the existing refresh_token / refresh_expires are left untouched.
   */
  async updateUserTokens(email: string, update: TokenUpdate): Promise<void> {
    await this.db
      .prepare(
        `UPDATE users
         SET access_token = ?,
             access_expires = ?,
             refresh_token = COALESCE(?, refresh_token),
             refresh_expires = COALESCE(?, refresh_expires)
         WHERE email = ?`,
      )
      .bind(
        update.accessToken,
        update.accessExpires,
        update.refreshToken ?? null,
        update.refreshExpires ?? null,
        email,
      )
      .run();
  }
}

export default UsersDB;
