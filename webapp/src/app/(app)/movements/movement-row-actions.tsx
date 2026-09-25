"use client";

import { useActionState, useState } from "react";
import { deleteMovement, type FormState } from "./actions";

/** 入出庫の取り消し。誤って在庫を動かしたときに戻すためのもの */
export function DeleteMovementButton({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteMovement, { error: null });
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
      >
        取消
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <span className="text-[11px] text-red-700">{label} を取り消す？</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "取消中…" : "はい"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded border border-slate-300 px-2 py-0.5 text-xs"
      >
        いいえ
      </button>
      {state.error && <span className="text-[11px] text-red-600">{state.error}</span>}
    </form>
  );
}
