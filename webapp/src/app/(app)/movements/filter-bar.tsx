"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { Destination } from "@/lib/inventory/types";

export type MovementFilterValues = {
  q: string;
  kind: string;
  destination: string;
  from: string;
  to: string;
};

export function MovementFilterBar({
  values,
  destinations,
}: {
  values: MovementFilterValues;
  destinations: Destination[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  return (
    <form
      ref={formRef}
      action="/movements"
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">キーワード（商品・伝票番号・出荷先）</span>
        <input
          type="search"
          name="q"
          defaultValue={values.q}
          className="w-56 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">区分</span>
        <select
          name="kind"
          defaultValue={values.kind}
          onChange={submit}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">すべて</option>
          <option value="in">入庫</option>
          <option value="out">出庫</option>
          <option value="adjust">調整</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">出荷先</span>
        <select
          name="destination"
          defaultValue={values.destination}
          onChange={submit}
          className="min-w-44 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">すべて</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">期間（開始）</span>
        <input type="date" name="from" defaultValue={values.from} className="rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">期間（終了）</span>
        <input type="date" name="to" defaultValue={values.to} className="rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>

      <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
        絞り込む
      </button>
      <button
        type="button"
        onClick={() => router.push("/movements")}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        条件をクリア
      </button>
    </form>
  );
}
