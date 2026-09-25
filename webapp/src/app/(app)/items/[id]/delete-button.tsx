"use client";

import { useState, useTransition } from "react";
import { deleteItem } from "../actions";

/**
 * 削除は2段階にする。confirm() などのネイティブダイアログは使わない
 * （押し間違いを防ぎつつ、画面の中で取り消せるようにするため）。
 */
export function DeleteButton({ id, code }: { id: string; code: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
      >
        この商品を削除
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm">
      <span className="text-red-800">{code} を削除します。元に戻せません。</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await deleteItem(id); })}
        className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "削除中…" : "削除する"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
      >
        やめる
      </button>
    </div>
  );
}
