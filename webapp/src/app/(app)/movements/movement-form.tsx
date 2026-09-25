"use client";

import { useActionState, useState } from "react";
import type { Destination, MovementKind } from "@/lib/inventory/types";
import { createMovement, type FormState } from "./actions";
import { ItemPicker, type ItemChoice } from "./item-picker";

/**
 * 入出庫の登録。
 * 出荷先は出庫のときだけ出す（入庫元は商品側の仕入先で足りるため持たせていない）。
 */
export function MovementForm({
  items,
  destinations,
  sources,
  today,
  fixedItem,
  defaultSource,
}: {
  items: ItemChoice[];
  destinations: Destination[];
  /** 入庫元の候補。仕入先マスタと、これまでの入庫実績から作る */
  sources: string[];
  today: string;
  /** 商品詳細から使うときは、その商品に固定する */
  fixedItem?: Pick<ItemChoice, "id" | "code" | "name" | "unit">;
  /** 商品詳細から使うときの入庫元の初期値（その商品の仕入先） */
  defaultSource?: string | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createMovement, { error: null });
  const [kind, setKind] = useState<MovementKind>("out");
  const [picked, setPicked] = useState<ItemChoice | null>(null);

  // 数量の単位は、選んだ商品のものを出す（商品詳細から使うときは固定の商品）
  const unit = fixedItem?.unit ?? picked?.unit ?? undefined;

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {fixedItem ? (
          <input type="hidden" name="item_id" value={fixedItem.id} />
        ) : (
          <Field label="商品（品番・商品名で検索）" required>
            <ItemPicker items={items} onSelect={setPicked} />
          </Field>
        )}

        <Field label="日付" required>
          <input type="date" name="moved_on" required defaultValue={today} className={inputClass} />
        </Field>

        <Field label="区分" required>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as MovementKind)}
            className={inputClass}
          >
            <option value="out">出庫</option>
            <option value="in">入庫</option>
            <option value="adjust">調整</option>
          </select>
        </Field>

        <Field label="数量" required suffix={unit}>
          <input
            type="number"
            name="quantity"
            step="0.01"
            required
            placeholder={kind === "adjust" ? "-10" : "100"}
            title={kind === "adjust" ? "増やす＝＋ / 減らす＝−" : undefined}
            className={inputClass + " w-32"}
          />
        </Field>

        {kind === "in" && (
          <Field label="入庫元">
            <input
              name="source_name"
              list="movement-sources"
              defaultValue={defaultSource ?? ""}
              placeholder="仕入先・他倉庫など"
              className={inputClass + " w-56"}
            />
          </Field>
        )}

        {kind === "out" && (
          <Field label="出荷先">
            <select name="destination_id" defaultValue="" className={inputClass + " min-w-56"}>
              <option value="">未指定</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                  {destination.kind ? `（${destination.kind}）` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="伝票番号">
          <input name="slip_no" placeholder="OUT-2005" className={inputClass + " w-36"} />
        </Field>

        <Field label="備考">
          <input name="note" className={inputClass + " w-52"} />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "登録中…" : "登録する"}
        </button>
      </div>

      {/* 入庫元はマスタを持たず文字列で受けるので、候補を出すだけにしてある
          （他倉庫からの移管や現場からの返却など、マスタに無い相手も書けるように） */}
      <datalist id="movement-sources">
        {sources.map((source) => (
          <option key={source} value={source} />
        ))}
      </datalist>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">{state.ok}（理論在庫に反映しました）</p>}
    </form>
  );
}

const inputClass =
  "rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

/**
 * 1項目＝「ラベル行」＋「入力行」の2段で固定する。
 * 補足を入力欄の下に置くと、その項目だけ入力欄が1段上にずれて並びが崩れるため、
 * 単位などは suffix として入力欄の右に出す。
 */
function Field({
  label,
  suffix,
  required,
  children,
}: {
  label: string;
  suffix?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="h-4 whitespace-nowrap text-[11px] leading-4 text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <span className="flex items-center gap-1">
        {children}
        {suffix && <span className="whitespace-nowrap text-xs text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}
