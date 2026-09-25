"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { AlertBadge, PriorityBadge } from "@/components/badges";
import {
  COLUMNS,
  COLUMN_GROUPS,
  columnLabel,
  type ColumnDef,
  type ColumnGroup,
} from "@/lib/inventory/columns";
import { fmtDate, fmtDateTime, fmtMoney, fmtQty } from "@/lib/inventory/format";
import type { AlertType, EvaluatedItem, MasterKind, MasterOption, Priority, Settings } from "@/lib/inventory/types";
import { StatusSelect } from "./status-select";

type Row = EvaluatedItem & { reason: string; action: string };

/** 常に出す列。スプレッドシートの setFrozenColumns(3) と同じ3列を左に貼り付ける */
const PINNED: { key: string; width: number; left: number }[] = [
  { key: "status", width: 116, left: 0 },
  { key: "code", width: 128, left: 116 },
  { key: "name", width: 240, left: 244 },
];
const PINNED_KEYS = PINNED.map((p) => p.key);
const STORAGE_KEY = "inventory-visible-groups";

/** 見出しから並べ替えできる列（queries.ts の SORTABLE と対応） */
const SORT_KEYS: Record<string, string> = {
  priority: "priority",
  code: "code",
  name: "name",
  available_qty: "available",
  days_of_stock: "days",
  order_due_date: "due",
  stock_value: "value",
  updated_at: "updated",
};

export function ItemsTable({
  rows,
  settings,
  masters,
  sort,
  dir,
}: {
  rows: Row[];
  settings: Settings;
  masters: Record<MasterKind, MasterOption[]>;
  sort: string;
  dir: "asc" | "desc";
}) {
  const searchParams = useSearchParams();
  const toggleable = COLUMN_GROUPS.filter((g) => g.key !== "status");
  const { hidden, toggleGroup } = useHiddenGroups();

  const visible = COLUMNS.filter((c) => PINNED_KEYS.includes(c.key) || !hidden.has(c.group));

  const sortHref = (column: ColumnDef) => {
    const key = SORT_KEYS[column.key];
    if (!key) return null;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    params.delete("page");
    return `/items?${params.toString()}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">表示する区分:</span>
        {toggleable.map((group) => {
          const on = !hidden.has(group.key);
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition ${
                on ? "border-slate-300 bg-white text-slate-700" : "border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: on ? group.color : "#cbd5e1" }}
              />
              {group.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {visible.map((column) => {
                const group = COLUMN_GROUPS.find((g) => g.key === column.group);
                const pinned = PINNED.find((p) => p.key === column.key);
                const href = sortHref(column);
                const active = SORT_KEYS[column.key] === sort;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`whitespace-nowrap border-b border-slate-200 px-2 py-2 text-left align-bottom text-xs font-semibold text-slate-600 ${
                      pinned ? "sticky z-20 bg-slate-50" : ""
                    } ${column.numeric ? "text-right" : ""}`}
                    style={{
                      borderTop: `3px solid ${group?.color ?? "#cbd5e1"}`,
                      ...(pinned ? { left: pinned.left, minWidth: pinned.width, width: pinned.width } : {}),
                    }}
                    title={column.source === "auto" ? "自動計算列" : "入力列"}
                  >
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {columnLabel(column, settings)}
                        {active && <span className="ml-0.5">{dir === "asc" ? "▲" : "▼"}</span>}
                      </Link>
                    ) : (
                      columnLabel(column, settings)
                    )}
                    {column.source === "auto" && <span className="ml-1 text-[10px] text-slate-400">自動</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={visible.length} className="px-4 py-10 text-center text-sm text-slate-500">
                  該当する商品がありません。
                </td>
              </tr>
            )}
            {rows.map((row) => {
              // 発注漏れ（＝発注点を割ったまま期限を過ぎている）は行ごと目立たせる。
              // スプレッドシートのカスタム数式 =$AG2="発注漏れ" と同じ扱い。
              const rowBg = row.alert_type === "発注漏れ" ? "bg-red-50" : "bg-white";
              return (
                <tr key={row.id} className={`${rowBg} border-b border-slate-100 hover:brightness-95`}>
                  {visible.map((column) => {
                    const pinned = PINNED.find((p) => p.key === column.key);
                    return (
                      <td
                        key={column.key}
                        className={`whitespace-nowrap px-2 py-1.5 align-middle ${
                          pinned ? `sticky z-10 ${rowBg}` : ""
                        } ${column.numeric ? "text-right tabular-nums" : ""}`}
                        style={pinned ? { left: pinned.left, minWidth: pinned.width, width: pinned.width } : undefined}
                      >
                        <Cell column={column} row={row} masters={masters} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">
        「自動」の付いた列は保存されず、開くたびに今日の日付で計算し直されます（在庫数を直せば判定もその場で変わります）。
      </p>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────────
   表示する区分の記憶（ブラウザごとの好み）
   localStorage は React の外にある状態なので useSyncExternalStore で読む。
   effect で setState すると初期表示が二度描画になるため。
   ────────────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
let snapshot = "[]";

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): string {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
    // 同じ内容なら同じ参照を返す（違う値を返し続けると無限再描画になる）
    if (raw !== snapshot) snapshot = raw;
  } catch {
    // プライベートモードなどで読めないときは既定（全表示）のまま
  }
  return snapshot;
}

function getServerSnapshot(): string {
  return "[]";
}

function useHiddenGroups() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hidden = useMemo(() => {
    try {
      return new Set(JSON.parse(raw) as ColumnGroup[]);
    } catch {
      return new Set<ColumnGroup>();
    }
  }, [raw]);

  const toggleGroup = (group: ColumnGroup) => {
    const next = new Set(hidden);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    snapshot = JSON.stringify([...next]);
    try {
      window.localStorage.setItem(STORAGE_KEY, snapshot);
    } catch {
      // 保存できなくても、この画面の表示は切り替える
    }
    listeners.forEach((listener) => listener());
  };

  return { hidden, toggleGroup };
}

function Cell({
  column,
  row,
  masters,
}: {
  column: ColumnDef;
  row: Row;
  masters: Record<MasterKind, MasterOption[]>;
}) {
  if (column.key === "status") {
    return <StatusSelect id={row.id} status={row.status} options={masters.status} />;
  }
  if (column.key === "code") {
    return (
      <Link href={`/items/${row.id}`} className="font-medium text-blue-600 hover:underline">
        {row.code}
      </Link>
    );
  }
  if (column.key === "alert_type") return <AlertBadge alert={row.alert_type as AlertType} />;
  if (column.key === "priority") return <PriorityBadge priority={row.priority as Priority} />;

  // 入出庫を登録している商品は、手入力値ではなく台帳から集計した値で判定している。
  // 一覧にも「判定に使った値」のほうを出す（見ている数字と判定がずれないように）。
  if (column.key === "out_qty_window") {
    const fromLedger = row.out_move_count > 0;
    return (
      <span title={fromLedger ? "入出庫台帳から集計した値" : "手入力の値"}>
        {fmtQty(Number(row.out_qty_effective), 1)}
        {fromLedger && <span className="ml-1 text-[10px] text-sky-600">台帳</span>}
      </span>
    );
  }
  if (column.key === "last_in_date") return <>{fmtDate(row.last_in_effective, "—")}</>;
  if (column.key === "last_out_date") return <>{fmtDate(row.last_out_effective, "—")}</>;

  const value = (row as unknown as Record<string, unknown>)[column.key];
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-300">—</span>;
  }

  switch (column.type) {
    case "money":
      return <>{fmtMoney(Number(value))}</>;
    case "decimal":
      return <>{fmtQty(Number(value), 2)}</>;
    case "number":
      return <>{fmtQty(Number(value), 1)}</>;
    case "int":
      return <>{fmtQty(Number(value), 0)}</>;
    case "date":
      return <>{fmtDate(String(value), "—")}</>;
    case "datetime":
      return <>{fmtDateTime(String(value))}</>;
    default:
      return (
        <span className="inline-block max-w-[28rem] truncate align-middle" title={String(value)}>
          {String(value)}
        </span>
      );
  }
}
