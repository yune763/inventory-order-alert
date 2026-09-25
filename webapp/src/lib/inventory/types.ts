/** GAS の CONFIG にあたる調整パラメータ（DBの inventory_settings 1行） */
export type Settings = {
  demand_window_days: number;
  default_safety_days: number;
  order_cycle_days: number;
  dead_stock_days: number;
  count_diff_tolerance: number;
  no_move_days: number;
  updated_at: string;
};

export const MASTER_KINDS = ["status", "category", "unit", "location", "supplier"] as const;
export type MasterKind = (typeof MASTER_KINDS)[number];

/** スプレッドシートの「マスタ」シートの1セルにあたる */
export type MasterOption = {
  id: string;
  kind: MasterKind;
  label: string;
  code: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
};

export const MASTER_KIND_LABELS: Record<MasterKind, string> = {
  status: "対応状況",
  category: "カテゴリ",
  unit: "単位",
  location: "保管場所",
  supplier: "仕入先",
};

/** 人／CSV取込が埋める列だけを持つ、inventory_items そのもの */
export type ItemInput = {
  status: string | null;
  code: string;
  name: string;
  category: string | null;
  spec: string | null;
  unit: string | null;
  location: string | null;
  supplier_code: string | null;
  supplier_name: string | null;
  cost: number;
  price: number;
  lead_time_days: number;
  moq: number;
  lot: number;
  book_qty: number;
  count_qty: number | null;
  allocated_qty: number;
  on_order_qty: number;
  eta: string | null;
  out_qty_window: number;
  safety_days: number | null;
  last_in_date: string | null;
  last_out_date: string | null;
  last_count_date: string | null;
  note: string | null;
};

export const ALERT_TYPES = [
  "欠品",
  "発注漏れ",
  "欠品リスク",
  "入荷遅延",
  "発注推奨",
  "過剰在庫",
  "滞留在庫",
  "棚卸差異",
  "正常",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const PRIORITIES = ["A:即日対応", "B:3日以内", "C:要確認", "-"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** 出荷先。仕入先と違って住所・担当者まで持たせるので独立したテーブルにしてある */
export type Destination = {
  id: string;
  code: string | null;
  name: string;
  kind: string | null;
  address: string | null;
  contact: string | null;
  phone: string | null;
  note: string | null;
  sort_order: number;
  is_active: boolean;
};

export const MOVEMENT_KINDS = ["in", "out", "adjust"] as const;
export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  in: "入庫",
  out: "出庫",
  adjust: "調整",
};

/** 入出庫1件。出荷先は出庫のときだけ入る */
export type Movement = {
  id: string;
  item_id: string;
  moved_on: string;
  kind: MovementKind;
  quantity: number;
  signed_qty: number;
  destination_id: string | null;
  /** 入庫元。入庫のときだけ入る（出荷先と対になる項目） */
  source_name: string | null;
  slip_no: string | null;
  note: string | null;
  created_at: string;
};

/** 一覧に出すときの、商品名・出荷先名を添えた入出庫 */
export type MovementRow = Movement & {
  item_code: string;
  item_name: string;
  unit: string | null;
  destination_name: string | null;
};

/** inventory_items_evaluated ビューの1行。自動計算列はDB側で毎回出している */
export type EvaluatedItem = ItemInput & {
  id: string;
  created_at: string;
  updated_at: string;
  today: string;
  safety_days_effective: number;
  count_diff: number | null;
  available_qty: number;
  stock_position: number;
  stock_value: number;
  daily_out: number;
  days_of_stock: number;
  stockout_date: string | null;
  safety_qty: number;
  rop: number;
  max_qty: number;
  order_qty: number;
  order_due_date: string | null;
  idle_days: number | null;
  alert_type: AlertType;
  alert_rank: number;
  priority: Priority;
  priority_rank: number;
  /** 判定に実際に使った期間出庫数（台帳があれば台帳の合計） */
  out_qty_effective: number;
  out_move_count: number;
  in_move_count: number;
  last_in_effective: string | null;
  last_out_effective: string | null;
};

/** 画面の色。スプレッドシートの条件付き書式をそのまま持ち込んでいる */
export const ALERT_STYLES: Record<AlertType, { bg: string; fg: string }> = {
  欠品: { bg: "#b71c1c", fg: "#ffffff" },
  発注漏れ: { bg: "#d32f2f", fg: "#ffffff" },
  欠品リスク: { bg: "#ef6c00", fg: "#ffffff" },
  入荷遅延: { bg: "#7b1fa2", fg: "#ffffff" },
  発注推奨: { bg: "#f9a825", fg: "#000000" },
  過剰在庫: { bg: "#0277bd", fg: "#ffffff" },
  滞留在庫: { bg: "#455a64", fg: "#ffffff" },
  棚卸差異: { bg: "#5d4037", fg: "#ffffff" },
  正常: { bg: "#e8f5e9", fg: "#1b5e20" },
};

export const PRIORITY_STYLES: Record<Priority, { bg: string; fg: string }> = {
  "A:即日対応": { bg: "#f4cccc", fg: "#990000" },
  "B:3日以内": { bg: "#ffedc2", fg: "#7f6000" },
  "C:要確認": { bg: "#d8e6f4", fg: "#1c4587" },
  "-": { bg: "#f1f5f9", fg: "#64748b" },
};

/**
 * 品番（商品コード）の採番ルール。
 * 商品コードは全処理のキーなので、付け方がばらつくと同じ物に別コードが立ち、
 * CSV取込でも名寄せできなくなる。「接頭辞＋連番」を決めておく。
 */
export type CodeRule = {
  id: string;
  /** null = 既定ルール。そのカテゴリ専用のルールが無いときに使う */
  category: string | null;
  prefix: string;
  separator: string;
  digits: number;
  next_number: number;
  is_active: boolean;
};

export function formatCode(
  rule: Pick<CodeRule, "prefix" | "separator" | "digits">,
  n: number
): string {
  return `${rule.prefix}${rule.separator}${String(n).padStart(rule.digits, "0")}`;
}
