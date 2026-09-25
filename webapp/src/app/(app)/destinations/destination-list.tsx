"use client";

import { useActionState, useState } from "react";
import {
  createDestination,
  deleteDestination,
  updateDestination,
  type FormState,
} from "@/app/(app)/masters/actions";
import type { Destination } from "@/lib/inventory/types";

/**
 * 出荷先の一覧。
 * 住所・担当者まで持つので項目が多い。常に入力欄を並べると一覧が読めなくなるため、
 * 追加は「新規登録」、編集は行ごとの「編集」を押したときだけフォームを出す。
 */
export function DestinationList({
  destinations,
  usage,
}: {
  destinations: Destination[];
  /** 出荷先ごとの出庫件数 */
  usage: Record<string, number>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{destinations.length.toLocaleString("ja-JP")} 件</p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          {adding ? "閉じる" : "＋ 新規登録"}
        </button>
      </div>

      {adding && (
        <DestinationForm
          mode="create"
          nextSortOrder={(destinations.at(-1)?.sort_order ?? 0) + 10}
          onDone={() => setAdding(false)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">出荷先名</th>
              <th className="px-3 py-2 font-medium">コード</th>
              <th className="px-3 py-2 font-medium">区分</th>
              <th className="px-3 py-2 font-medium">住所</th>
              <th className="px-3 py-2 font-medium">担当者</th>
              <th className="px-3 py-2 font-medium">電話</th>
              <th className="px-3 py-2 font-medium">表示</th>
              <th className="px-3 py-2 text-right font-medium">出庫実績</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {destinations.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                  まだ登録がありません。「新規登録」から追加してください。
                </td>
              </tr>
            )}
            {destinations.map((destination) =>
              editingId === destination.id ? (
                <tr key={destination.id} className="bg-amber-50/50">
                  <td colSpan={9} className="px-3 py-3">
                    <DestinationForm
                      mode="edit"
                      destination={destination}
                      onDone={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              ) : (
                <ViewRow
                  key={destination.id}
                  destination={destination}
                  usage={usage[destination.id] ?? 0}
                  onEdit={() => setEditingId(destination.id)}
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
  destination,
  usage,
  onEdit,
}: {
  destination: Destination;
  usage: number;
  onEdit: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteDestination, { error: null });

  return (
    <tr className={destination.is_active ? "" : "bg-slate-50 text-slate-400"}>
      <td className="px-3 py-2 font-medium">{destination.name}</td>
      <td className="px-3 py-2 font-mono text-xs text-slate-500">{destination.code ?? "—"}</td>
      <td className="px-3 py-2">
        {destination.kind ? (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{destination.kind}</span>
        ) : (
          "—"
        )}
      </td>
      <td className="max-w-64 truncate px-3 py-2 text-slate-600" title={destination.address ?? ""}>
        {destination.address ?? "—"}
      </td>
      <td className="px-3 py-2 text-slate-600">{destination.contact ?? "—"}</td>
      <td className="px-3 py-2 text-slate-600">{destination.phone ?? "—"}</td>
      <td className="px-3 py-2">
        {destination.is_active ? (
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
            <input type="hidden" name="id" value={destination.id} />
            <input type="hidden" name="name" value={destination.name} />
            <button
              type="submit"
              disabled={pending || usage > 0}
              title={usage > 0 ? "出庫実績があるため削除できません（非表示に切り替えてください）" : "削除する"}
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

function DestinationForm({
  mode,
  destination,
  nextSortOrder,
  onDone,
}: {
  mode: "create" | "edit";
  destination?: Destination;
  nextSortOrder?: number;
  onDone: () => void;
}) {
  // 成功したら閉じる。描画の途中で親のstateを変えないよう、アクションの中で伝える
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = mode === "create"
      ? await createDestination(prev, formData)
      : await updateDestination(prev, formData);
    if (!result.error) onDone();
    return result;
  }, { error: null });

  return (
    <form
      action={action}
      className={`flex flex-wrap items-end gap-3 ${
        mode === "create" ? "rounded-lg border border-slate-300 bg-white p-4" : ""
      }`}
    >
      {destination && <input type="hidden" name="id" value={destination.id} />}
      <Field label="出荷先名" width="w-56" required>
        <input name="name" defaultValue={destination?.name ?? ""} required autoFocus className={inputClass} />
      </Field>
      <Field label="コード" width="w-28">
        <input name="code" defaultValue={destination?.code ?? ""} placeholder="D-006" className={inputClass} />
      </Field>
      <Field label="区分" width="w-28">
        <input
          name="kind"
          defaultValue={destination?.kind ?? ""}
          list="destination-kinds"
          placeholder="得意先"
          className={inputClass}
        />
      </Field>
      <Field label="住所" width="w-72">
        <input name="address" defaultValue={destination?.address ?? ""} className={inputClass} />
      </Field>
      <Field label="担当者" width="w-32">
        <input name="contact" defaultValue={destination?.contact ?? ""} className={inputClass} />
      </Field>
      <Field label="電話" width="w-36">
        <input name="phone" defaultValue={destination?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="備考" width="w-48">
        <input name="note" defaultValue={destination?.note ?? ""} className={inputClass} />
      </Field>
      <Field label="並び順" width="w-20">
        <input
          type="number"
          name="sort_order"
          defaultValue={destination?.sort_order ?? nextSortOrder ?? 0}
          className={inputClass}
        />
      </Field>
      {mode === "edit" && (
        <label className="flex items-center gap-1 pb-2 text-xs text-slate-600">
          <input type="checkbox" name="is_active" defaultChecked={destination?.is_active ?? true} />
          一覧・プルダウンに出す
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "保存中…" : mode === "create" ? "登録する" : "保存"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
      >
        キャンセル
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}

      <datalist id="destination-kinds">
        <option value="得意先" />
        <option value="現場" />
        <option value="自社拠点" />
      </datalist>
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
