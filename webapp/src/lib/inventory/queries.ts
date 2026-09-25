import "server-only";
import { query, queryOne } from "@/lib/db";
import type { EvaluatedItem, MasterKind, MasterOption, Settings } from "./types";
import { MASTER_KINDS } from "./types";

export const ITEMS_PER_PAGE = 100;

/**
 * 判定ビューから取る列。
 * timestamptz は to_char で ISO文字列にしてから渡す（JS側で時差の解釈を挟ませないため）。
 */
const ITEM_COLUMNS = `
  id, status, code, name, category, spec, unit, location,
  supplier_code, supplier_name, cost, price, lead_time_days, moq, lot,
  book_qty, count_qty, allocated_qty, on_order_qty, eta, out_qty_window, safety_days,
  last_in_date, last_out_date, last_count_date, note,
  to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at,
  today, safety_days_effective, count_diff, available_qty, stock_position, stock_value,
  daily_out, days_of_stock, stockout_date, safety_qty, rop, max_qty,
  order_qty, order_due_date, idle_days,
  alert_type, alert_rank, priority, priority_rank,
  out_qty_effective, out_move_count, in_move_count, last_in_effective, last_out_effective
`;

export async function getSettings(): Promise<Settings> {
  const row = await queryOne<Settings>(
    `select demand_window_days, default_safety_days, order_cycle_days,
            dead_stock_days, count_diff_tolerance, no_move_days,
            to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
       from inventory_settings where id = 1`
  );
  if (!row) throw new Error("判定パラメータが未作成です。node scripts/db.mjs migrate を実行してください。");
  return row;
}

/** マスタを kind ごとに束ねて返す。プルダウンの選択肢はここだけを見る */
export async function getMasterOptions(
  includeInactive = false
): Promise<Record<MasterKind, MasterOption[]>> {
  const rows = await query<MasterOption>(
    `select id, kind, label, code, color, sort_order, is_active
       from inventory_master_options
      where ($1 or is_active)
      order by sort_order, label`,
    [includeInactive]
  );

  const grouped = Object.fromEntries(MASTER_KINDS.map((k) => [k, [] as MasterOption[]])) as Record<
    MasterKind,
    MasterOption[]
  >;
  for (const row of rows) grouped[row.kind]?.push(row);
  return grouped;
}

export type ItemFilters = {
  q?: string;
  alert?: string;
  priority?: string;
  status?: string;
  category?: string;
  location?: string;
  supplier?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
};

/** 並べ替えに使える列。SQLへ文字列を埋めるので、必ずこの表を通す */
const SORTABLE: Record<string, string> = {
  priority: "priority_rank",
  code: "code",
  name: "name",
  available: "available_qty",
  days: "days_of_stock",
  due: "order_due_date",
  value: "stock_value",
  updated: "updated_at",
};

/** 絞り込み条件を where 句とパラメータに組み立てる（一覧と書き出しで共有する） */
function buildWhere(filters: ItemFilters): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql.replace("?", `$${params.length}`));
  };

  if (filters.alert) add("alert_type = ?", filters.alert);
  if (filters.priority) add("priority = ?", filters.priority);
  if (filters.status === "__empty__") clauses.push("status is null");
  else if (filters.status) add("status = ?", filters.status);
  if (filters.category) add("category = ?", filters.category);
  if (filters.location) add("location = ?", filters.location);
  if (filters.supplier) add("supplier_name = ?", filters.supplier);

  const keyword = (filters.q ?? "").trim();
  if (keyword) {
    params.push(`%${keyword}%`);
    const p = `$${params.length}`;
    clauses.push(`(code ilike ${p} or name ilike ${p} or spec ilike ${p} or supplier_name ilike ${p})`);
  }

  return { where: clauses.length ? `where ${clauses.join(" and ")}` : "", params };
}

export async function listItems(
  filters: ItemFilters
): Promise<{ items: EvaluatedItem[]; total: number; page: number; pageCount: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const sortColumn = SORTABLE[filters.sort ?? "priority"] ?? "priority_rank";
  const direction = filters.dir === "desc" ? "desc" : "asc";
  const { where, params } = buildWhere(filters);

  const rows = await query<EvaluatedItem & { total_count: number }>(
    `select ${ITEM_COLUMNS}, count(*) over() as total_count
       from inventory_items_evaluated
       ${where}
      order by ${sortColumn} ${direction} nulls last, code asc
      limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE]
  );

  const total = rows[0]?.total_count ?? 0;
  return {
    items: rows as EvaluatedItem[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)),
  };
}

/**
 * CSV書き出し用。一覧と同じ絞り込みで、ページ分割せずに返す。
 * 画面は100件ずつだが、書き出しは「その条件のもの全部」でないと使えないため。
 */
export async function exportItems(filters: ItemFilters, max = 5000): Promise<EvaluatedItem[]> {
  const sortColumn = SORTABLE[filters.sort ?? "priority"] ?? "priority_rank";
  const direction = filters.dir === "desc" ? "desc" : "asc";
  const { where, params } = buildWhere(filters);

  return query<EvaluatedItem>(
    `select ${ITEM_COLUMNS}
       from inventory_items_evaluated
       ${where}
      order by ${sortColumn} ${direction} nulls last, code asc
      limit $${params.length + 1}`,
    [...params, max]
  );
}

export async function getItemById(id: string): Promise<EvaluatedItem | null> {
  return queryOne<EvaluatedItem>(
    `select ${ITEM_COLUMNS} from inventory_items_evaluated where id = $1`,
    [id]
  );
}

/**
 * 優先度A・Bの行（＝今日と3日以内に手を打つ行）。
 * HOME画面の要対応リストと、日次アラート（/api/alerts/daily）が共有する。
 */
export async function listActionableItems(limit = 200): Promise<EvaluatedItem[]> {
  return query<EvaluatedItem>(
    `select ${ITEM_COLUMNS}
       from inventory_items_evaluated
      where priority_rank <= 2
      order by priority_rank, alert_rank, order_due_date nulls last, code
      limit $1`,
    [limit]
  );
}

export type AlertSummary = {
  total: number;
  byAlert: Record<string, number>;
  byPriority: Record<string, number>;
  /** アラートが出ているが、対応状況で人の手当てが済んでいる件数 */
  handled: number;
  stockValue: number;
  orderQtyTotal: number;
};

/** HOME画面の集計。件数と合計だけなのでDB側で畳んでから受け取る */
export async function getAlertSummary(): Promise<AlertSummary> {
  const [totals, byAlert, byPriority] = await Promise.all([
    queryOne<{ total: number; stock_value: number; order_qty: number; handled: number }>(
      `select count(*)::int as total,
              coalesce(sum(stock_value), 0) as stock_value,
              coalesce(sum(order_qty), 0) as order_qty,
              count(*) filter (
                where priority <> '-' and status in ('発注済み', '発注NG', '廃盤')
              )::int as handled
         from inventory_items_evaluated`
    ),
    query<{ alert_type: string; n: number }>(
      `select alert_type, count(*)::int as n from inventory_items_evaluated group by alert_type`
    ),
    query<{ priority: string; n: number }>(
      `select priority, count(*)::int as n from inventory_items_evaluated group by priority`
    ),
  ]);

  return {
    total: totals?.total ?? 0,
    stockValue: Number(totals?.stock_value ?? 0),
    orderQtyTotal: Number(totals?.order_qty ?? 0),
    handled: totals?.handled ?? 0,
    byAlert: Object.fromEntries(byAlert.map((r) => [r.alert_type, r.n])),
    byPriority: Object.fromEntries(byPriority.map((r) => [r.priority, r.n])),
  };
}

/** マスタの選択肢が商品で何件使われているか（削除してよいかの判断に使う） */
export async function getMasterUsage(): Promise<Record<MasterKind, Map<string, number>>> {
  const rows = await query<{ kind: MasterKind; label: string; n: number }>(
    `select 'status'   as kind, status        as label, count(*)::int as n from inventory_items where status        is not null group by status
     union all
     select 'category' as kind, category      as label, count(*)::int as n from inventory_items where category      is not null group by category
     union all
     select 'unit'     as kind, unit          as label, count(*)::int as n from inventory_items where unit          is not null group by unit
     union all
     select 'location' as kind, location      as label, count(*)::int as n from inventory_items where location      is not null group by location
     union all
     select 'supplier' as kind, supplier_name as label, count(*)::int as n from inventory_items where supplier_name is not null group by supplier_name`
  );

  const usage = Object.fromEntries(MASTER_KINDS.map((k) => [k, new Map<string, number>()])) as Record<
    MasterKind,
    Map<string, number>
  >;
  for (const row of rows) usage[row.kind]?.set(row.label, row.n);
  return usage;
}
