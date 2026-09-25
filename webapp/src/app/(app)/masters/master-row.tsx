"use client";

import { useActionState } from "react";
import type { MasterKind, MasterOption } from "@/lib/inventory/types";
import { deleteMasterOption, updateMasterOption, type FormState } from "./actions";

export function MasterRow({
  option,
  kind,
  usage,
}: {
  option: MasterOption;
  kind: MasterKind;
  usage: number;
}) {
  const [saveState, saveAction, saving] = useActionState<FormState, FormData>(updateMasterOption, { error: null });
  const [deleteState, deleteAction, deleting] = useActionState<FormState, FormData>(deleteMasterOption, { error: null });

  return (
    <div className="border-b border-slate-100 px-3 py-2 last:border-b-0">
      <div className="flex flex-wrap items-end gap-2">
        <form action={saveAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={option.id} />
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">名前</span>
            <input name="label" defaultValue={option.label} className="w-44 rounded border border-slate-300 px-2 py-1 text-sm" />
          </label>

          {kind === "supplier" && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400">仕入先コード</span>
              <input name="code" defaultValue={option.code ?? ""} className="w-28 rounded border border-slate-300 px-2 py-1 text-sm" />
            </label>
          )}
          {kind !== "supplier" && <input type="hidden" name="code" value={option.code ?? ""} />}

          {kind === "status" && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400">色</span>
              <input type="color" name="color" defaultValue={option.color ?? "#e2e8f0"} className="h-8 w-12 rounded border border-slate-300" />
            </label>
          )}
          {kind !== "status" && <input type="hidden" name="color" value={option.color ?? ""} />}

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">並び順</span>
            <input type="number" name="sort_order" defaultValue={option.sort_order} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
          </label>

          <label className="flex items-center gap-1 pb-1.5 text-xs text-slate-600">
            <input type="checkbox" name="is_active" defaultChecked={option.is_active} />
            表示する
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </form>

        <span className="pb-1.5 text-[11px] text-slate-400">
          {usage > 0 ? `${usage} 件で使用中` : "未使用"}
        </span>

        <form action={deleteAction} className="pb-0.5">
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="label" value={option.label} />
          <button
            type="submit"
            disabled={deleting || usage > 0}
            title={usage > 0 ? "使用中のため削除できません" : "削除する"}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
