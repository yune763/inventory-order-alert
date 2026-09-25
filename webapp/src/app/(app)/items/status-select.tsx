"use client";

import { useTransition } from "react";
import type { MasterOption } from "@/lib/inventory/types";
import { updateItemStatus } from "./actions";

/**
 * 対応状況をその場で変える。
 * スプレッドシートでA列のプルダウンを選ぶのと同じ操作を、一覧のまま出来るようにしたもの。
 */
export function StatusSelect({
  id,
  status,
  options,
}: {
  id: string;
  status: string | null;
  options: MasterOption[];
}) {
  const [pending, startTransition] = useTransition();
  const current = options.find((o) => o.label === status);

  return (
    <select
      value={status ?? ""}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          await updateItemStatus(id, next || null);
        });
      }}
      className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs font-semibold disabled:opacity-50"
      style={
        current?.color
          ? { backgroundColor: current.color, color: readableText(current.color) }
          : undefined
      }
    >
      <option value="">未設定</option>
      {options.map((option) => (
        <option key={option.id} value={option.label}>
          {option.label}
        </option>
      ))}
      {/* マスタから消された値が商品側に残っている場合も、選択肢として見せて取りこぼさない */}
      {status && !current && <option value={status}>{status}（マスタ外）</option>}
    </select>
  );
}

function readableText(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#334155";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#1f2937" : "#ffffff";
}
