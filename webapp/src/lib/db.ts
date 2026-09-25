import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * DBへの唯一の入口。
 *
 * 既定では webapp/.pglite/ に置いたローカルDB（PostgreSQL本体のWASM版）を使う。
 * 外部サービスの契約もDockerも要らず、npm run dev だけで動く。
 *
 * DATABASE_URL を設定すると、そのPostgres（Supabase など）に接続する。
 * どちらも同じSQLがそのまま動くので、ローカルで作ったものを後から載せ替えられる。
 *
 * ローカルDBは1プロセスからしか開けない。開発サーバーを2つ起動すると
 * 後から起動したほうが接続できないので、その場合は片方を止めること。
 */

/** Postgres の型OIDごとの受け取り方 */
const PARSERS: Record<number, (value: string) => unknown> = {
  20: Number, // int8（count など）。既定だと精度保持のため文字列で返る
  1700: Number, // numeric。同上
  1082: (v) => v, // date は "YYYY-MM-DD" の文字列のまま扱う（Date にすると時差で1日ずれる）
};

export type Db = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
};

declare global {
  // 開発中のホットリロードで接続が増え続けないよう、グローバルに1つだけ持つ
  var __inventoryDb: Promise<Db> | undefined;
}

export function getDb(): Promise<Db> {
  if (!globalThis.__inventoryDb) {
    globalThis.__inventoryDb = connect();
  }
  return globalThis.__inventoryDb;
}

/** 使い回す薄いラッパを返す。呼び出し側は query / exec しか知らない */
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: pg } = await import("pg");
    for (const [oid, parser] of Object.entries(PARSERS)) {
      pg.types.setTypeParser(Number(oid), parser as (v: string) => never);
    }
    const pool = new pg.Pool({ connectionString: url, max: 5, ssl: sslOptionFor(url) });
    return {
      query: async (sql, params) => (await pool.query(sql, params as unknown[])).rows,
      exec: async (sql) => {
        await pool.query(sql);
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const pglite = await PGlite.create({
    dataDir: path.join(process.cwd(), ".pglite"),
    parsers: PARSERS,
  });
  const db: Db = {
    query: async (sql, params) => (await pglite.query(sql, params as unknown[])).rows as never,
    exec: async (sql) => {
      await pglite.exec(sql);
    },
  };

  // ローカルDBは初回に空なので、ここでテーブルを用意する。
  // マイグレーションは全て「あれば作らない」書き方なので、毎回流しても害はない。
  await migrate(db);
  return db;
}

/**
 * 外部のPostgresはSSLを求めることが多い（Render・Supabase など）。
 * localhost と sslmode=disable のときだけSSL無し、それ以外は暗号化して繋ぐ。
 *
 * rejectUnauthorized を false にしているのは、これらのサービスが中間CA入りの証明書を使い、
 * 既定のルート証明書だけでは検証できないため。通信は暗号化されるが、サーバー証明書の
 * 検証まで必要な場合は CA を渡す設定に差し替えること。
 */
function sslOptionFor(url: string): false | { rejectUnauthorized: boolean } {
  const lower = url.toLowerCase();
  if (lower.includes("sslmode=disable")) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(lower)) return false;
  return { rejectUnauthorized: false };
}

/** supabase/migrations/*.sql をファイル名順に流す */
export async function migrate(db: Db): Promise<void> {
  const dir = path.resolve(process.cwd(), "..", "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
}

/** 単発の問い合わせ。ほとんどの呼び出しはこれで足りる */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(sql, params);
}

/** 1行だけ取る。無ければ null */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
