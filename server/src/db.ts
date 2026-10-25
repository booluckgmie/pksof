import mysql from "mysql2/promise";

/** One shared connection pool for the whole process — every route imports this, same convention
 * as the frontend's single `getSupabase()` client it replaces. */
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "pksof",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "pksof",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL columns come back as JS numbers, not strings — matches the Postgres driver's own behavior this app's code already assumes.
  dateStrings: true, // DATETIME columns come back as 'YYYY-MM-DD HH:MM:SS' strings, not Date objects — matches Postgres's timestamptz-as-ISO-string shape closely enough for this app's existing `new Date(row.created_at)` call sites.
});

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** For INSERT/UPDATE/DELETE, where the result is one ResultSetHeader (affectedRows/insertId),
 * not an array of rows the way a SELECT's result is — using `query()` for a write and reading
 * `.affectedRows` off what you get back would silently read it off an array instead. */
export async function execute(sql: string, params: unknown[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.query<mysql.ResultSetHeader>(sql, params);
  return result;
}

/** Runs `fn` inside a single transaction — commits on success, rolls back on any thrown error. */
export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
