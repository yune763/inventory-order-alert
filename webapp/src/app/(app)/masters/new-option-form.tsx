"use client";

import { useActionState } from "react";
import type { MasterKind } from "@/lib/inventory/types";
import { createMasterOption, type FormState } from "./actions";

export function NewOptionForm({ kind }: { kind: MasterKind }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createMasterOption, { error: null });

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 bg-slate-50 px-3 py-2">
      <input type="hidden" name="kind" value={kind} />
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">追加する選択肢</span>
        <input name="label" required placeholder="名前" className="w-44 rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>
      {kind === "supplier" && (
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400">仕入先コード</span>
          <input name="code" placeholder="S-006" className="w-28 rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
      )}
      {kind === "status" && (
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400">色</span>
          <input type="color" name="color" defaultValue="#e2e8f0" className="h-8 w-12 rounded border border-slate-300" />
        </label>
      )}
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">並び順</span>
        <input type="number" name="sort_order" defaultValue={0} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "追加中…" : "追加"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
