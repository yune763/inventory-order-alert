"use client";

import { useActionState, useState } from "react";
import { formatCode, type CodeRule } from "@/lib/inventory/types";
import { deleteCodeRule, updateCodeRule, type FormState } from "./actions";

export function CodeRuleRow({ rule }: { rule: CodeRule }) {
  const [saveState, saveAction, saving] = useActionState<FormState, FormData>(updateCodeRule, { error: null });
  const [deleteState, deleteAction, deleting] = useActionState<FormState, FormData>(deleteCodeRule, { error: null });

  // 入力しながら「次に出る番号」が見えるようにする
  const [draft, setDraft] = useState({
    prefix: rule.prefix,
    separator: rule.separator,
    digits: rule.digits,
    next_number: rule.next_number,
  });
  const preview = formatCode(draft, draft.next_number);

  return (
    <div className="border-b border-slate-100 px-3 py-2 last:border-b-0">
      <div className="flex flex-wrap items-end gap-2">
        <form action={saveAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={rule.id} />
          <Field label="カテゴリ" width="w-40">
            <input
              name="category"
              defaultValue={rule.category ?? ""}
              placeholder="（空欄＝既定）"
              list="master-category-rules"
              className={inputClass}
            />
          </Field>
          <Field label="接頭辞" width="w-24">
            <input
              name="prefix"
              value={draft.prefix}
              onChange={(e) => setDraft({ ...draft, prefix: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="区切り" width="w-16">
            <input
              name="separator"
              value={draft.separator}
              onChange={(e) => setDraft({ ...draft, separator: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="桁数" width="w-16">
            <input
              type="number"
              name="digits"
              min={1}
              max={10}
              value={draft.digits}
              onChange={(e) => setDraft({ ...draft, digits: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="次の番号" width="w-24">
            <input
              type="number"
              name="next_number"
              min={0}
              value={draft.next_number}
              onChange={(e) => setDraft({ ...draft, next_number: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-col gap-0.5 pb-0.5">
            <span className="text-[10px] text-slate-400">次に出る品番</span>
            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">{preview}</span>
          </div>
          <label className="flex items-center gap-1 pb-1.5 text-xs text-slate-600">
            <input type="checkbox" name="is_active" defaultChecked={rule.is_active} />
            使う
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </form>

        <form action={deleteAction} className="pb-0.5">
          <input type="hidden" name="id" value={rule.id} />
          <button
            type="submit"
            disabled={deleting}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            削除
          </button>
        </form>
      </div>

      {(saveState.error || deleteState.error) && (
        <p className="mt-1 text-xs text-red-600">{saveState.error ?? deleteState.error}</p>
      )}
    </div>
  );
}

const inputClass = "w-full rounded border border-slate-300 px-2 py-1 text-sm";

function Field({ label, width, children }: { label: string; width: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-0.5 ${width}`}>
      <span className="text-[10px] text-slate-400">{label}</span>
      {children}
    </label>
  );
}
