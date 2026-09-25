"use client";

import { useActionState, useState } from "react";
import {
  createMasterOption,
  deleteMasterOption,
  updateMasterOption,
  type FormState,
} from "@/app/(app)/masters/actions";
import type { MasterKind, MasterOption } from "@/lib/inventory/types";

/**
 * マスタ（仕入先・保管場所）の一覧画面。
 *
 * 一覧は表で見せ、追加は「新規登録」を押したときだけフォームを出す。
 * 入力欄を常に並べておくと、登録済みの一覧が読み取りにくくなるため。
 * 編集も同じ考えで、行ごとに「編集」を押したときだけ入力欄に変わる。
 */
export function MasterOptionList({
  kind,
  options,
  usage,
  showCode = false,
  codeLabel = "コード",
  usageLabel,
}: {
  kind: MasterKind;
  options: MasterOption[];
  /** 選択肢ごとの使用件数（商品側で使われている数） */
  usage: Record<string, number>;
  showCode?: boolean;
  codeLabel?: string;
  usageLabel: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {options.length.toLocaleString("ja-JP")} 件
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          {adding ? "閉じる" : "＋ 新規登録"}
        </button>
      </div>

      {adding && (
        <NewForm
          kind={kind}
          showCode={showCode}
          codeLabel={codeLabel}
          nextSortOrder={(options.at(-1)?.sort_order ?? 0) + 10}
          onDone={() => setAdding(false)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">名前</th>
              {showCode && <th className="px-3 py-2 font-medium">{codeLabel}</th>}
              <th className="px-3 py-2 text-right font-medium">並び順</th>
              <th className="px-3 py-2 font-medium">表示</th>
              <th className="px-3 py-2 text-right font-medium">{usageLabel}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {options.length === 0 && (
              <tr>
                <td colSpan={showCode ? 6 : 5} className="px-4 py-10 text-center text-sm text-slate-500">
                  まだ登録がありません。「新規登録」から追加してください。
                </td>
              </tr>
            )}
            {options.map((option) =>
              editingId === option.id ? (
                <EditRow
                  key={option.id}
                  option={option}
                  showCode={showCode}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <ViewRow
                  key={option.id}
                  kind={kind}
                  option={option}
                  showCode={showCode}
                  usage={usage[option.label] ?? 0}
                  onEdit={() => setEditingId(option.id)}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewRow({
  kind,
  option,
  showCode,
  usage,
  onEdit,
}: {
  kind: MasterKind;
  option: MasterOption;
  showCode: boolean;
  usage: number;
  onEdit: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteMasterOption, { error: null });

  return (
    <tr className={option.is_active ? "" : "bg-slate-50 text-slate-400"}>
      <td className="px-3 py-2 font-medium">{option.label}</td>
      {showCode && <td className="px-3 py-2 font-mono text-xs text-slate-500">{option.code ?? "—"}</td>}
      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{option.sort_order}</td>
      <td className="px-3 py-2">
        {option.is_active ? (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">表示</span>
        ) : (
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">非表示</span>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
        {usage > 0 ? `${usage} 件` : "—"}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            編集
          </button>
          <form action={action}>
            <input type="hidden" name="id" value={option.id} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="label" value={option.label} />
            <button
              type="submit"
              disabled={pending || usage > 0}
              title={usage > 0 ? "使用中のため削除できません（非表示に切り替えてください）" : "削除する"}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              削除
            </button>
          </form>
        </div>
        {state.error && <p className="mt-1 text-right text-xs text-red-600">{state.error}</p>}
      </td>
    </tr>
  );
}

function EditRow({
  option,
  showCode,
  onDone,
}: {
  option: MasterOption;
  showCode: boolean;
  onDone: () => void;
}) {
  // 成功したら閉じる。レンダリング中ではなくアクションの中で親に伝える
  // （描画の途中で親のstateを変えると React に怒られるため）
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updateMasterOption(prev, formData);
    if (!result.error) onDone();
    return result;
  }, { error: null });

  return (
    <tr className="bg-amber-50/50">
      <td colSpan={showCode ? 6 : 5} className="px-3 py-2">
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="color" value={option.color ?? ""} />
          {!showCode && <input type="hidden" name="code" value={option.code ?? ""} />}
          <Field label="名前" width="w-56">
            <input name="label" defaultValue={option.label} required className={inputClass} />
          </Field>
          {showCode && (
            <Field label="コード" width="w-32">
              <input name="code" defaultValue={option.code ?? ""} className={inputClass} />
            </Field>
          )}
          <Field label="並び順" width="w-20">
            <input type="number" name="sort_order" defaultValue={option.sort_order} className={inputClass} />
          </Field>
          <label className="flex items-center gap-1 pb-1.5 text-xs text-slate-600">
            <input type="checkbox" name="is_active" defaultChecked={option.is_active} />
            一覧・プルダウンに出す
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "保存中…" : "保存"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-white"
          >
            キャンセル
          </button>
          {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}

function NewForm({
  kind,
  showCode,
  codeLabel,
  nextSortOrder,
  onDone,
}: {
  kind: MasterKind;
  showCode: boolean;
  codeLabel: string;
  nextSortOrder: number;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await createMasterOption(prev, formData);
    if (!result.error) onDone();
    return result;
  }, { error: null });

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-300 bg-white p-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="color" value="" />
      {!showCode && <input type="hidden" name="code" value="" />}
      <Field label="名前" width="w-64" required>
        <input name="label" required autoFocus className={inputClass} />
      </Field>
      {showCode && (
        <Field label={codeLabel} width="w-36">
          <input name="code" className={inputClass} />
        </Field>
      )}
      <Field label="並び順" width="w-24">
        <input type="number" name="sort_order" defaultValue={nextSortOrder} className={inputClass} />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "登録中…" : "登録する"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
      >
        キャンセル
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

const inputClass = "w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

function Field({
  label,
  width,
  required,
  children,
}: {
  label: string;
  width: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${width}`}>
      <span className="text-[11px] text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
