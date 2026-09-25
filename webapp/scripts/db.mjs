/**
 * DBの用意と点検をするコマンド。
 *
 *   node scripts/db.mjs deploy    migrate ＋（SEED_SAMPLE_DATA=true のときだけ）seed
 *   node scripts/db.mjs migrate   テーブル・判定ビュー・マスタ初期値を作る
 *   node scripts/db.mjs seed      動作確認用のサンプル商品9件を入れる
 *   node scripts/db.mjs check     判定結果を表で出す（9区分が出そろうか確認する）
 *   node scripts/db.mjs reset     ローカルDBを消してから migrate + seed
 *
 * 既定ではローカルDB（webapp/.pglite/ に置くPostgres本体のWASM版）を使う。
 * DATABASE_URL を渡すと、そちらのPostgres（Supabaseなど）に同じSQLを適用する。
 *
 *   DATABASE_URL="postgresql://..." node scripts/db.mjs migrate
 */

import { readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SQL_DIR = path.resolve(here, "..", "..", "supabase");
const DATA_DIR = path.resolve(here, "..", ".pglite");

const command = process.argv[2] ?? "migrate";
const url = process.env.DATABASE_URL;

/** 接続先に関わらず「SQLを流す」「問い合わせる」だけを提供する薄い層 */

/**
 * 外部のPostgresはSSLを求めることが多い（Render・Supabase など）。
 * localhost と sslmode=disable のときだけSSL無し、それ以外は暗号化して繋ぐ。
 *
 * rejectUnauthorized を false にしているのは、これらのサービスが中間CA入りの証明書を使い、
 * 既定のルート証明書だけでは検証できないため。通信は暗号化されるが、サーバー証明書の
 * 検証まで必要な場合は PGSSLROOTCERT でCAを渡すこと。
 */
export function sslOptionFor(url) {
  const lower = url.toLowerCase();
  if (lower.includes("sslmode=disable")) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(lower)) return false;
  return { rejectUnauthorized: false };
}

async function connect() {
  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url, ssl: sslOptionFor(url) });
    await client.connect();
    return {
      label: url.replace(/:[^:@/]+@/, ":****@"),
      exec: (sql) => client.query(sql),
      query: (sql) => client.query(sql).then((r) => r.rows),
      close: () => client.end(),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create({ dataDir: DATA_DIR });
  return {
    label: `ローカルDB (${path.relative(process.cwd(), DATA_DIR)})`,
    exec: (sql) => db.exec(sql),
    query: (sql) => db.query(sql).then((r) => r.rows),
    close: () => db.close(),
  };
}

function migrationFiles() {
  const dir = path.join(SQL_DIR, "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(path.join(dir, f), "utf8") }));
}

async function migrate(db) {
  for (const file of migrationFiles()) {
    await db.exec(file.sql);
    console.log("  適用:", file.name);
  }
}

async function seed(db) {
  const dir = path.join(SQL_DIR, "seed");
  // 商品 → 入出庫 の順に流す必要があるので、ファイル名順に実行する
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
    console.log("  適用: seed/" + file);
  }
}

async function check(db) {
  const rows = await db.query(`
    select code, name, alert_type, priority, available_qty, stock_position, rop, max_qty,
           order_qty, days_of_stock, order_due_date, count_diff, idle_days
    from inventory_items_evaluated
    order by alert_rank, code
  `);
  if (rows.length === 0) {
    console.log("  商品が登録されていません（node scripts/db.mjs seed でサンプルを入れられます）");
    return;
  }
  console.table(
    rows.map((r) => ({
      商品コード: r.code,
      アラート: r.alert_type,
      優先度: r.priority,
      有効在庫: r.available_qty,
      在庫ポジション: r.stock_position,
      発注点: r.rop,
      適正上限: r.max_qty,
      発注推奨: r.order_qty,
      在庫日数: r.days_of_stock,
      発注期限: r.order_due_date,
      棚卸差異: r.count_diff,
    }))
  );
  const kinds = new Set(rows.map((r) => r.alert_type));
  console.log(`  区分: ${[...kinds].join(" / ")}（${kinds.size}種類）`);

  const masters = await db.query(
    "select kind, count(*)::int as n from inventory_master_options group by kind order by kind"
  );
  console.log("  マスタ:", masters.map((m) => `${m.kind}=${m.n}`).join(" "));
}

const db0 = command === "reset" && !url ? null : await connect();
if (command === "reset") {
  if (url) {
    console.error("reset はローカルDBだけの操作です（DATABASE_URL を外して実行してください）");
    process.exit(1);
  }
  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
    console.log("ローカルDBを削除しました:", DATA_DIR);
  }
}

const db = db0 ?? (await connect());
console.log("接続先:", db.label);

try {
  switch (command) {
    case "migrate":
      await migrate(db);
      break;
    case "seed":
      await seed(db);
      break;
    case "check":
      await check(db);
      break;
    case "deploy":
      // 公開先の起動前に走らせる用。マイグレーションは毎回、
      // サンプル投入は SEED_SAMPLE_DATA を入れたときだけ。
      // どちらも何度流しても結果が変わらない書き方にしてある。
      await migrate(db);
      if (/^(1|true|yes|on)$/i.test(process.env.SEED_SAMPLE_DATA ?? "")) {
        console.log("SEED_SAMPLE_DATA が設定されているので、サンプルデータも入れます");
        await seed(db);
      }
      break;
    case "reset":
      await migrate(db);
      await seed(db);
      await check(db);
      break;
    default:
      console.error(`不明なコマンド: ${command}（deploy / migrate / seed / check / reset）`);
      process.exit(1);
  }
  console.log("完了");
} finally {
  await db.close();
}
