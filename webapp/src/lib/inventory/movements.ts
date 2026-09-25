import "server-only";
import { query, queryOne } from "@/lib/db";
import type { Destination, MovementKind, MovementRow } from "./types";

export const MOVEMENTS_PER_PAGE = 100;

const MOVEMENT_COLUMNS = `
  m.id, m.item_id, m.moved_on, m.kind, m.quantity, m.signed_qty,
  m.destination_id, m.source_name, m.slip_no, m.note,
  to_char(m.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  i.code as item_code, i.name as item_name, i.unit,
  dst.name as destination_name
`;

const MOVEMENT_FROM = `
  from inventory_movements m
  join inventory_items i on i.id = m.item_id
  left join inventory_destinations dst on dst.id = m.destination_id
`;

export type MovementFilters = {
  q?: string;
  kind?: string;
  destination?: string;
  from?: string;
  to?: string;
  itemId?: string;
  page?: number;
};

function buildWhere(filters: MovementFilters): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql.replace("?", `$${params.length}`));
  };

  if (filters.kind) add("m.kind = ?", filters.kind);
  if (filters.destination) add("m.destination_id = ?", filters.destination);
  if (filters.itemId) add("m.item_id = ?", filters.itemId);
  if (filters.from) add("m.moved_on >= ?", filters.from);
  if (filters.to) add("m.moved_on <= ?", filters.to);

  const keyword = (filters.q ?? "").trim();
  if (keyword) {
    params.push(`%${keyword}%`);
    const p = `$${params.length}`;
    clauses.push(
      `(i.code ilike ${p} or i.name ilike ${p} or m.slip_no ilike ${p} or dst.name ilike ${p} or m.source_name ilike ${p})`
    );
  }

  return { where: clauses.length ? `where ${clauses.join(" and ")}` : "", params };
}

export async function listMovements(filters: MovementFilters): Promise<{
  rows: MovementRow[];
  total: number;
  page: number;
  pageCount: number;
  totalIn: number;
  totalOut: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const { where, params } = buildWhere(filters);

  const [rows, totals] = await Promise.all([
    query<MovementRow & { total_count: number }>(
      `select ${MOVEMENT_COLUMNS}, count(*) over() as total_count
       ${MOVEMENT_FROM}
       ${where}
        order by m.moved_on desc, m.created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, MOVEMENTS_PER_PAGE, (page - 1) * MOVEMENTS_PER_PAGE]
    ),
    queryOne<{ total_in: number; total_out: number }>(
      `select coalesce(sum(m.quantity) filter (where m.kind = 'in'), 0)  as total_in,
              coalesce(sum(m.quantity) filter (where m.kind = 'out'), 0) as total_out
       ${MOVEMENT_FROM}
       ${where}`,
      params
    ),
  ]);

  const total = rows[0]?.total_count ?? 0;
  return {
    rows: rows as MovementRow[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / MOVEMENTS_PER_PAGE)),
    totalIn: Number(totals?.total_in ?? 0),
    totalOut: Number(totals?.total_out ?? 0),
  };
}

/** 商品詳細に出す、その商品の入出庫履歴 */
export async function listMovementsForItem(itemId: string, limit = 20): Promise<MovementRow[]> {
  return query<MovementRow>(
    `select ${MOVEMENT_COLUMNS}
     ${MOVEMENT_FROM}
      where m.item_id = $1
      order by m.moved_on desc, m.created_at desc
      limit $2`,
    [itemId, limit]
  );
}

/** 出荷先ごとの出荷実績。どこへ何がどれだけ出ているかを見る */
export async function getDestinationSummary(days: number): Promise<
  { destination_id: string | null; destination_name: string; qty: number; count: number; amount: number }[]
> {
  return query(
    `select m.destination_id,
            coalesce(dst.name, '（出荷先なし）') as destination_name,
            sum(m.quantity)::numeric as qty,
            count(*)::int as count,
            coalesce(sum(m.quantity * i.price), 0) as amount
       from inventory_movements m
       join inventory_items i on i.id = m.item_id
       left join inventory_destinations dst on dst.id = m.destination_id
      where m.kind = 'out'
        and m.moved_on > (now() at time zone 'Asia/Tokyo')::date - $1::integer
      group by m.destination_id, dst.name
      order by qty desc`,
    [days]
  );
}

export async function listDestinations(includeInactive = false): Promise<Destination[]> {
  return query<Destination>(
    `select id, code, name, kind, address, contact, phone, note, sort_order, is_active
       from inventory_destinations
      where ($1 or is_active)
      order by sort_order, name`,
    [includeInactive]
  );
}

/**
 * 入出庫で商品を選ぶとき用の一覧。
 * 品番で探して商品名で確かめる画面なので、現在庫と単位まで一緒に返す。
 */
export async function listItemChoices(): Promise<
  { id: string; code: string; name: string; unit: string | null; spec: string | null; book_qty: number }[]
> {
  return query(`select id, code, name, unit, spec, book_qty from inventory_items order by code`);
}

export const MOVEMENT_KIND_FILTERS: { value: MovementKind; label: string }[] = [
  { value: "in", label: "入庫" },
  { value: "out", label: "出庫" },
  { value: "adjust", label: "調整" },
];

/** 入庫元ごとの入庫実績。入庫の相手先はマスタを持たないので、実績から候補を出す */
export async function listSourceNames(limit = 50): Promise<string[]> {
  const rows = await query<{ source_name: string }>(
    `select source_name
       from inventory_movements
      where source_name is not null
      group by source_name
      order by count(*) desc, source_name
      limit $1`,
    [limit]
  );
  return rows.map((row) => row.source_name);
}

/** 出荷先ごとの出庫件数。削除してよいかの判断に使う */
export async function getDestinationUsage(): Promise<Map<string, number>> {
  const rows = await query<{ destination_id: string; n: number }>(
    `select destination_id, count(*)::int as n
       from inventory_movements
      where destination_id is not null
      group by destination_id`
  );
  return new Map(rows.map((row) => [row.destination_id, row.n]));
}
