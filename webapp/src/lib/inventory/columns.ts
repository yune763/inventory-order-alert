import type { Settings } from "./types";

/**
 * スプレッドシート版42列（A〜AP）の定義。
 *
 * 画面の一覧表・CSV書き出し・CSV取込の3つが、この1つの並びを共有する。
 * csvHeader はスプシの1行目と完全に同じ文字列にしてあり、
 * 旧シートからエクスポートしたCSVをそのまま取り込める（＝移行できる）。
 *
 * source が "input" の列だけが inventory_items に保存される。
 * "auto" は inventory_items_evaluated ビューが毎回計算する（保存しない）。
 */
export type ColumnGroup =
  | "status"
  | "basic"
  | "supply"
  | "stock"
  | "demand"
  | "order"
  | "alert"
  | "history";

export type ColumnType = "text" | "int" | "number" | "money" | "decimal" | "date" | "datetime";

export type ColumnDef = {
  key: string;
  csvHeader: string;
  label: string;
  group: ColumnGroup;
  source: "input" | "auto";
  type: ColumnType;
  /** 一覧表で右寄せにするか（数値列） */
  numeric?: boolean;
};

export const COLUMN_GROUPS: { key: ColumnGroup; label: string; color: string }[] = [
  { key: "status", label: "対応状況", color: "#263238" },
  { key: "basic", label: "基本情報", color: "#37474f" },
  { key: "supply", label: "仕入先・発注条件", color: "#00695c" },
  { key: "stock", label: "在庫状況", color: "#1565c0" },
  { key: "demand", label: "消化傾向", color: "#6a1b9a" },
  { key: "order", label: "発注判定", color: "#ef6c00" },
  { key: "alert", label: "アラート", color: "#c62828" },
  { key: "history", label: "履歴・管理", color: "#546e7a" },
];

export const COLUMNS: ColumnDef[] = [
  { key: "status", csvHeader: "対応状況", label: "対応状況", group: "status", source: "input", type: "text" },

  { key: "code", csvHeader: "商品コード", label: "商品コード", group: "basic", source: "input", type: "text" },
  { key: "name", csvHeader: "商品名", label: "商品名", group: "basic", source: "input", type: "text" },
  { key: "category", csvHeader: "カテゴリ", label: "カテゴリ", group: "basic", source: "input", type: "text" },
  { key: "spec", csvHeader: "規格・型番", label: "規格・型番", group: "basic", source: "input", type: "text" },
  { key: "unit", csvHeader: "単位", label: "単位", group: "basic", source: "input", type: "text" },
  { key: "location", csvHeader: "保管場所", label: "保管場所", group: "basic", source: "input", type: "text" },

  { key: "supplier_code", csvHeader: "仕入先コード", label: "仕入先コード", group: "supply", source: "input", type: "text" },
  { key: "supplier_name", csvHeader: "仕入先名", label: "仕入先名", group: "supply", source: "input", type: "text" },
  { key: "cost", csvHeader: "仕入単価", label: "仕入単価", group: "supply", source: "input", type: "money", numeric: true },
  { key: "price", csvHeader: "販売単価", label: "販売単価", group: "supply", source: "input", type: "money", numeric: true },
  { key: "lead_time_days", csvHeader: "発注リードタイム日数", label: "リードタイム日数", group: "supply", source: "input", type: "int", numeric: true },
  { key: "moq", csvHeader: "最小発注数(MOQ)", label: "最小発注数(MOQ)", group: "supply", source: "input", type: "number", numeric: true },
  { key: "lot", csvHeader: "発注ロット単位", label: "発注ロット単位", group: "supply", source: "input", type: "number", numeric: true },

  { key: "book_qty", csvHeader: "理論在庫数", label: "理論在庫数", group: "stock", source: "input", type: "number", numeric: true },
  { key: "count_qty", csvHeader: "実棚在庫数", label: "実棚在庫数", group: "stock", source: "input", type: "number", numeric: true },
  { key: "count_diff", csvHeader: "棚卸差異", label: "棚卸差異", group: "stock", source: "auto", type: "number", numeric: true },
  { key: "allocated_qty", csvHeader: "引当数(受注残)", label: "引当数(受注残)", group: "stock", source: "input", type: "number", numeric: true },
  { key: "on_order_qty", csvHeader: "発注残数(入荷予定)", label: "発注残数(入荷予定)", group: "stock", source: "input", type: "number", numeric: true },
  { key: "available_qty", csvHeader: "有効在庫数", label: "有効在庫数", group: "stock", source: "auto", type: "number", numeric: true },
  { key: "eta", csvHeader: "入荷予定日", label: "入荷予定日", group: "stock", source: "input", type: "date" },
  { key: "stock_value", csvHeader: "在庫金額", label: "在庫金額", group: "stock", source: "auto", type: "money", numeric: true },

  { key: "out_qty_window", csvHeader: "期間出庫数(直近30日)", label: "期間出庫数", group: "demand", source: "input", type: "number", numeric: true },
  { key: "daily_out", csvHeader: "平均日次出庫数", label: "平均日次出庫数", group: "demand", source: "auto", type: "decimal", numeric: true },
  { key: "days_of_stock", csvHeader: "在庫日数", label: "在庫日数", group: "demand", source: "auto", type: "decimal", numeric: true },
  { key: "stockout_date", csvHeader: "欠品予測日", label: "欠品予測日", group: "demand", source: "auto", type: "date" },

  { key: "safety_days", csvHeader: "安全在庫日数", label: "安全在庫日数", group: "order", source: "input", type: "int", numeric: true },
  { key: "safety_qty", csvHeader: "安全在庫数", label: "安全在庫数", group: "order", source: "auto", type: "number", numeric: true },
  { key: "rop", csvHeader: "発注点", label: "発注点", group: "order", source: "auto", type: "number", numeric: true },
  { key: "max_qty", csvHeader: "適正在庫上限", label: "適正在庫上限", group: "order", source: "auto", type: "number", numeric: true },
  { key: "order_qty", csvHeader: "発注推奨数", label: "発注推奨数", group: "order", source: "auto", type: "number", numeric: true },
  { key: "order_due_date", csvHeader: "発注期限日", label: "発注期限日", group: "order", source: "auto", type: "date" },

  { key: "alert_type", csvHeader: "アラート区分", label: "アラート区分", group: "alert", source: "auto", type: "text" },
  { key: "priority", csvHeader: "優先度", label: "優先度", group: "alert", source: "auto", type: "text" },
  { key: "reason", csvHeader: "アラート理由", label: "アラート理由", group: "alert", source: "auto", type: "text" },
  { key: "action", csvHeader: "推奨アクション", label: "推奨アクション", group: "alert", source: "auto", type: "text" },

  { key: "last_in_date", csvHeader: "最終入庫日", label: "最終入庫日", group: "history", source: "input", type: "date" },
  { key: "last_out_date", csvHeader: "最終出庫日", label: "最終出庫日", group: "history", source: "input", type: "date" },
  { key: "last_count_date", csvHeader: "最終棚卸日", label: "最終棚卸日", group: "history", source: "input", type: "date" },
  { key: "idle_days", csvHeader: "滞留日数", label: "滞留日数", group: "history", source: "auto", type: "int", numeric: true },
  { key: "note", csvHeader: "備考", label: "備考", group: "history", source: "input", type: "text" },
  { key: "updated_at", csvHeader: "更新日時", label: "更新日時", group: "history", source: "auto", type: "datetime" },
];

export const INPUT_COLUMNS = COLUMNS.filter((c) => c.source === "input");

/**
 * 「期間出庫数(直近30日)」の 30 は調整できるパラメータなので、画面では実際の設定値を出す。
 * CSVヘッダは旧シートと突き合わせるために固定文字列のままにしてある。
 */
export function columnLabel(column: ColumnDef, settings: Settings): string {
  if (column.key === "out_qty_window") {
    return `期間出庫数(直近${settings.demand_window_days}日)`;
  }
  if (column.key === "safety_days") {
    return `安全在庫日数(既定${settings.default_safety_days})`;
  }
  return column.label;
}
