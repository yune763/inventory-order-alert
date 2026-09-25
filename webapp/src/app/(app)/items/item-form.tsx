"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { ItemInput, MasterKind, MasterOption, Settings } from "@/lib/inventory/types";
import { generateItemCode, saveItem, type FormState } from "./actions";

type Props = {
  id?: string;
  item?: ItemInput | null;
  masters: Record<MasterKind, MasterOption[]>;
  settings: Settings;
};

/**
 * 商品の入力フォーム。並びと区分はスプレッドシートの列構成に合わせてある。
 * ここに出るのは「入力列」だけ。自動計算列は保存しないので入力欄も無い。
 */
export function ItemForm({ id, item, masters, settings }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveItem, { error: null });
  const [supplierName, setSupplierName] = useState(item?.supplier_name ?? "");
  const [supplierCode, setSupplierCode] = useState(item?.supplier_code ?? "");
  const [code, setCode] = useState(item?.code ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [numbering, startNumbering] = useTransition();

  // 採番はカテゴリごとのルールを使う。押した時点で番号を確保するので、
  // 登録をやめると欠番になる（二人が同時に登録して同じ番号が出るのを防ぐため）。
  const numberIt = () => {
    setCodeError(null);
    startNumbering(async () => {
      const result = await generateItemCode(category || null);
      if (result.error) setCodeError(result.error);
      else if (result.code) setCode(result.code);
    });
  };

  // 仕入先名をマスタから選んだら、仕入先コードも一緒に埋める（二重入力を避ける）
  const onSupplierName = (value: string) => {
    setSupplierName(value);
    const hit = masters.supplier.find((o) => o.label === value);
    if (hit?.code) setSupplierCode(hit.code);
  };

  return (
    <form action={formAction} className="space-y-5">
      {id && <input type="hidden" name="id" value={id} />}

      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Section title="対応状況" color="#263238" note="人が決める列。計算では絶対に上書きされない。">
        <Field label="対応状況" hint="表記ゆれを防ぐため、マスタの選択肢から選ぶ">
          <select name="status" defaultValue={item?.status ?? ""} className={inputClass}>
            <option value="">未設定</option>
            {masters.status.map((o) => (
              <option key={o.id} value={o.label}>
                {o.label}
              </option>
            ))}
            {item?.status && !masters.status.some((o) => o.label === item.status) && (
              <option value={item.status}>{item.status}（マスタ外）</option>
            )}
          </select>
        </Field>
      </Section>

      <Section title="基本情報" color="#37474f">
        <Field
          label="商品コード"
          required
          hint={id ? "全処理のキー。重複できない" : "全処理のキー。採番ルールから発番できる"}
        >
          <div className="flex items-center gap-2">
            <input
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className={inputClass}
            />
            {!id && (
              <button
                type="button"
                onClick={numberIt}
                disabled={numbering}
                title="カテゴリの採番ルールに従って発番します"
                className="whitespace-nowrap rounded border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                {numbering ? "採番中…" : "採番"}
              </button>
            )}
          </div>
          {codeError && <span className="text-[11px] text-red-600">{codeError}</span>}
        </Field>
        <Field label="商品名" required>
          <input name="name" defaultValue={item?.name ?? ""} required className={inputClass} />
        </Field>
        <Field label="カテゴリ" hint={id ? undefined : "採番ルールはカテゴリごとに切り替わる"}>
          <input
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="master-category"
            className={inputClass}
          />
        </Field>
        <Field label="規格・型番">
          <input name="spec" defaultValue={item?.spec ?? ""} className={inputClass} />
        </Field>
        <Field label="単位">
          <input name="unit" defaultValue={item?.unit ?? ""} list="master-unit" className={inputClass} />
        </Field>
        <Field label="保管場所">
          <input name="location" defaultValue={item?.location ?? ""} list="master-location" className={inputClass} />
        </Field>
      </Section>

      <Section title="仕入先・発注条件" color="#00695c" note="リードタイムが発注点計算の中核。">
        <Field label="仕入先名">
          <input
            name="supplier_name"
            value={supplierName}
            onChange={(e) => onSupplierName(e.target.value)}
            list="master-supplier"
            className={inputClass}
          />
        </Field>
        <Field label="仕入先コード">
          <input
            name="supplier_code"
            value={supplierCode}
            onChange={(e) => setSupplierCode(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="仕入単価" hint="在庫金額の計算に使う">
          <input type="number" name="cost" step="0.01" min="0" defaultValue={item?.cost ?? 0} className={inputClass} />
        </Field>
        <Field label="販売単価" hint="欠品時の機会損失の試算用">
          <input type="number" name="price" step="0.01" min="0" defaultValue={item?.price ?? 0} className={inputClass} />
        </Field>
        <Field label="発注リードタイム日数" hint="発注してから入荷するまでの日数">
          <input type="number" name="lead_time_days" min="0" step="1" defaultValue={item?.lead_time_days ?? 0} className={inputClass} />
        </Field>
        <Field label="最小発注数(MOQ)">
          <input type="number" name="moq" min="0" step="0.01" defaultValue={item?.moq ?? 0} className={inputClass} />
        </Field>
        <Field label="発注ロット単位" hint="ケース入数など。発注推奨数はこの倍数に切り上がる">
          <input type="number" name="lot" min="0.01" step="0.01" defaultValue={item?.lot ?? 1} className={inputClass} />
        </Field>
      </Section>

      <Section title="在庫状況" color="#1565c0" note="実棚在庫数が入っていれば、そちらを現物として扱う。">
        <Field label="理論在庫数" hint="帳簿上の在庫">
          <input type="number" name="book_qty" step="0.01" defaultValue={item?.book_qty ?? 0} className={inputClass} />
        </Field>
        <Field label="実棚在庫数" hint="空欄なら「棚卸していない」扱い">
          <input type="number" name="count_qty" step="0.01" defaultValue={item?.count_qty ?? ""} className={inputClass} />
        </Field>
        <Field label="引当数(受注残)" hint="受注済みで出荷待ちの数">
          <input type="number" name="allocated_qty" min="0" step="0.01" defaultValue={item?.allocated_qty ?? 0} className={inputClass} />
        </Field>
        <Field label="発注残数(入荷予定)" hint="発注済みで未入荷の数。重複発注を防ぐ要">
          <input type="number" name="on_order_qty" min="0" step="0.01" defaultValue={item?.on_order_qty ?? 0} className={inputClass} />
        </Field>
        <Field label="入荷予定日" hint="過ぎていると入荷遅延として出る">
          <input type="date" name="eta" defaultValue={item?.eta ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="消化傾向・発注判定" color="#ef6c00">
        <Field label={`期間出庫数（直近${settings.demand_window_days}日）`} hint="販売データから取り込む数">
          <input type="number" name="out_qty_window" min="0" step="0.01" defaultValue={item?.out_qty_window ?? 0} className={inputClass} />
        </Field>
        <Field label="安全在庫日数" hint={`空欄なら既定値 ${settings.default_safety_days} 日を使う`}>
          <input type="number" name="safety_days" min="0" step="1" defaultValue={item?.safety_days ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="履歴・管理" color="#546e7a">
        <Field label="最終入庫日">
          <input type="date" name="last_in_date" defaultValue={item?.last_in_date ?? ""} className={inputClass} />
        </Field>
        <Field label="最終出庫日" hint="滞留日数の起点">
          <input type="date" name="last_out_date" defaultValue={item?.last_out_date ?? ""} className={inputClass} />
        </Field>
        <Field label="最終棚卸日">
          <input type="date" name="last_count_date" defaultValue={item?.last_count_date ?? ""} className={inputClass} />
        </Field>
        <Field label="備考" wide>
          <input name="note" defaultValue={item?.note ?? ""} className={inputClass} />
        </Field>
      </Section>

      {/* カテゴリ・単位・保管場所・仕入先は候補を出すだけで、マスタ外の値も受け付ける
          （CSV取込で新しい値が来たときに止めないため、という運用をそのまま踏襲する） */}
      <datalist id="master-category">
        {masters.category.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
      <datalist id="master-unit">
        {masters.unit.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
      <datalist id="master-location">
        {masters.location.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
      <datalist id="master-supplier">
        {masters.supplier.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存する"}
        </button>
        <Link href="/items" className="text-sm text-slate-500 hover:underline">
          一覧へ戻る
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

function Section({
  title,
  color,
  note,
  children,
}: {
  title: string;
  color: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-baseline gap-2 border-b border-slate-200 px-4 py-2" style={{ borderTop: `3px solid ${color}` }}>
        <h2 className="text-sm font-semibold">{title}</h2>
        {note && <p className="text-[11px] text-slate-500">{note}</p>}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
