"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { ItemFilters } from "@/lib/inventory/queries";
import type { MasterKind, MasterOption } from "@/lib/inventory/types";

type Props = {
  filters: ItemFilters;
  alertTypes: string[];
  priorities: string[];
  masters: Record<MasterKind, MasterOption[]>;
};

export function FilterBar({ filters, alertTypes, priorities, masters }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // 絞り込みは GET のクエリ文字列に出す。URLをそのまま共有・ブックマークできるようにするため。
  const submit = () => formRef.current?.requestSubmit();

  const select = (
    name: keyof ItemFilters,
    label: string,
    options: { value: string; label: string }[]
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <select
        name={name}
        defaultValue={(filters[name] as string) ?? ""}
        onChange={submit}
        className="min-w-28 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        <option value="">すべて</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      ref={formRef}
      action="/items"
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">キーワード（商品コード・商品名・型番・仕入先）</span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="例: 銅管"
          className="w-64 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>

      {select("alert", "アラート区分", alertTypes.map((a) => ({ value: a, label: a })))}
      {select("priority", "優先度", priorities.map((p) => ({ value: p, label: p })))}
      {select("status", "対応状況", [
        { value: "__empty__", label: "未設定" },
        ...masters.status.map((o) => ({ value: o.label, label: o.label })),
      ])}
      {select("category", "カテゴリ", masters.category.map((o) => ({ value: o.label, label: o.label })))}
      {select("location", "保管場所", masters.location.map((o) => ({ value: o.label, label: o.label })))}
      {select("supplier", "仕入先", masters.supplier.map((o) => ({ value: o.label, label: o.label })))}

      {/* 並び順は表の見出しから変えるが、絞り込みを変えても維持したいので hidden で持ち回る */}
      <input type="hidden" name="sort" value={filters.sort ?? "priority"} />
      <input type="hidden" name="dir" value={filters.dir ?? "asc"} />

      <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
        絞り込む
      </button>
      <button
        type="button"
        onClick={() => router.push("/items")}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        条件をクリア
      </button>
    </form>
  );
}
