"use client";

import { useActionState } from "react";
import type { Settings } from "@/lib/inventory/types";
import { updateSettings, type FormState } from "./actions";

const FIELDS: {
  name: keyof Settings;
  label: string;
  unit: string;
  step?: string;
  bigger: string;
  smaller: string;
}[] = [
  {
    name: "demand_window_days",
    label: "消化傾向の集計期間",
    unit: "日",
    bigger: "判定が安定するが、需要の変化に鈍くなる",
    smaller: "季節変動に追従するが、数字がブレやすい",
  },
  {
    name: "default_safety_days",
    label: "安全在庫日数（既定値）",
    unit: "日",
    bigger: "欠品しにくくなるが、在庫が増える",
    smaller: "在庫は減るが、欠品リスクが上がる",
  },
  {
    name: "order_cycle_days",
    label: "発注サイクル",
    unit: "日",
    bigger: "発注回数は減るが、1回の量と在庫が増える",
    smaller: "こまめな発注になり、事務負荷が上がる",
  },
  {
    name: "dead_stock_days",
    label: "滞留とみなす日数",
    unit: "日",
    bigger: "滞留の警告が出にくくなる",
    smaller: "季節商品が滞留扱いされやすい",
  },
  {
    name: "count_diff_tolerance",
    label: "棚卸差異を見逃す範囲",
    unit: "",
    step: "0.01",
    bigger: "小さなズレを無視できる",
    smaller: "1個のズレも棚卸差異として出る",
  },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettings, { error: null });

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
      )}

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {FIELDS.map((field) => (
          <div key={field.name} className="grid gap-2 p-4 sm:grid-cols-[16rem_8rem_1fr] sm:items-center">
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </label>
            <div className="flex items-center gap-1">
              <input
                id={field.name}
                name={field.name}
                type="number"
                step={field.step ?? "1"}
                min="0"
                defaultValue={String(settings[field.name])}
                className="w-24 rounded border border-slate-300 px-2 py-1 text-sm tabular-nums"
              />
              <span className="text-xs text-slate-500">{field.unit}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              大きくすると：{field.bigger} ／ 小さくすると：{field.smaller}
            </p>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "保存中…" : "保存する"}
      </button>
    </form>
  );
}
