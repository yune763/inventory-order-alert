"use client";

import { useActionState } from "react";
import { createCodeRule, type FormState } from "./actions";

export function NewCodeRuleForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCodeRule, { error: null });

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 bg-slate-50 px-3 py-2">
      <label className="flex w-40 flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">追加するカテゴリ</span>
        <input name="category" placeholder="（空欄＝既定）" list="master-category-rules" className={inputClass} />
      </label>
      <label className="flex w-24 flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">接頭辞</span>
        <input name="prefix" required placeholder="AC" className={inputClass} />
      </label>
      <label className="flex w-16 flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">区切り</span>
        <input name="separator" defaultValue="-" className={inputClass} />
      </label>
      <label className="flex w-16 flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">桁数</span>
        <input type="number" name="digits" min={1} max={10} defaultValue={4} className={inputClass} />
      </label>
      <label className="flex w-24 flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">次の番号</span>
        <input type="number" name="next_number" min={0} defaultValue={1} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "追加中…" : "追加"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

const inputClass = "w-full rounded border border-slate-300 px-2 py-1 text-sm";
