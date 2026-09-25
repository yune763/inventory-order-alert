"use client";

import { useActionState } from "react";
import { MOVEMENT_KIND_LABELS, type MovementKind } from "@/lib/inventory/types";
import { analyzeMovementCsv, commitMovementCsv, type MovementImportState } from "./movement-actions";

export function MovementImportForm() {
  const [state, analyze, analyzing] = useActionState<MovementImportState, FormData>(analyzeMovementCsv, {
    error: null,
  });
  const [commitState, commit, committing] = useActionState<MovementImportState, FormData>(commitMovementCsv, {
    error: null,
  });

  const preview = state.preview;
  const done = commitState.done;
  const blocked =
    preview && (preview.errors.length > 0 || preview.unknownCodes.length > 0 ||
      (preview.unknownDestinations.length > 0 && !preview.createDestinations));

  return (
    <div className="space-y-4">
      <form action={analyze} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="text-sm font-medium" htmlFor="movement-file">
            入出庫CSVを選ぶ
          </label>
          <p className="text-[11px] text-slate-500">
            見出しは「日付 / 区分 / 商品コード / 数量」が必須。出荷先（出庫）・入庫元（入庫）・
            伝票番号・備考・商品名は任意。区分は 入庫 / 出庫 / 調整。
          </p>
          <input
            id="movement-file"
            type="file"
            name="file"
            accept=".csv,.tsv,.txt,text/csv"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="movement-text">
            または貼り付ける
          </label>
          <textarea
            id="movement-text"
            name="text"
            rows={5}
            placeholder="日付,区分,商品コード,数量,出荷先,入庫元,伝票番号&#10;2026/09/25,出庫,DEMO-010,20,株式会社山田工務店,,OUT-2005&#10;2026/09/25,入庫,DEMO-010,300,,株式会社ミドリ資材,IN-1002"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="createDestinations" />
          マスタに無い出荷先を自動で追加する
        </label>

        <button
          type="submit"
          disabled={analyzing}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {analyzing ? "確認中…" : "内容を確認する"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>

      {done && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          入出庫を {done.inserted} 件 取り込みました（理論在庫に反映済み）。
          {done.createdDestinations > 0 && ` 出荷先を ${done.createdDestinations} 件 新しく追加しました。`}
        </p>
      )}
      {commitState.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {commitState.error}
        </p>
      )}

      {preview && !done && (
        <section className="space-y-3 rounded-lg border border-slate-300 bg-white p-4">
          <h3 className="text-sm font-semibold">取り込み内容の確認</h3>

          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="入庫" value={preview.inCount} tone="text-emerald-700" />
            <Stat label="出庫" value={preview.outCount} tone="text-sky-700" />
            <Stat label="調整" value={preview.adjustCount} tone="text-amber-700" />
            <Stat label="読み取れない行" value={preview.errors.length} tone="text-red-700" />
          </div>

          {preview.ignoredHeaders.length > 0 && (
            <p className="text-xs text-slate-500">読み飛ばした見出し: {preview.ignoredHeaders.join("、")}</p>
          )}

          {preview.errors.length > 0 && (
            <Issues
              title="読み取れない行（1行でもあると取り込めません）"
              items={preview.errors.map((e) => `${e.line}行目 ${e.message}`)}
              tone="red"
            />
          )}
          {preview.unknownCodes.length > 0 && (
            <Issues
              title="登録されていない商品コード（先に商品を登録してください）"
              items={preview.unknownCodes}
              tone="red"
            />
          )}
          {preview.unknownDestinations.length > 0 && (
            <Issues
              title={
                preview.createDestinations
                  ? "マスタに無い出荷先（取り込み時に自動で追加します）"
                  : "マスタに無い出荷先（「自動で追加する」にチェックするか、先に登録してください）"
              }
              items={preview.unknownDestinations}
              tone={preview.createDestinations ? "amber" : "red"}
            />
          )}

          {preview.sample.length > 0 && (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">日付</th>
                    <th className="px-3 py-1.5 font-medium">区分</th>
                    <th className="px-3 py-1.5 font-medium">商品コード</th>
                    <th className="px-3 py-1.5 text-right font-medium">数量</th>
                    <th className="px-3 py-1.5 font-medium">出荷先 / 入庫元</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.sample.map((row) => (
                    <tr key={row.line}>
                      <td className="px-3 py-1.5">{row.moved_on.replace(/-/g, "/")}</td>
                      <td className="px-3 py-1.5">{MOVEMENT_KIND_LABELS[row.kind as MovementKind]}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{row.code}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{row.quantity}</td>
                      <td className="px-3 py-1.5">{row.destination ?? row.source ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.total > preview.sample.length && (
            <p className="text-xs text-slate-400">
              先頭 {preview.sample.length} 件だけ表示しています（全 {preview.total} 件）。
            </p>
          )}

          <form action={commit}>
            <input type="hidden" name="text" value={preview.text} />
            {preview.createDestinations && <input type="hidden" name="createDestinations" value="on" />}
            <button
              type="submit"
              disabled={committing || preview.total === 0 || blocked}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {committing ? "取り込み中…" : `${preview.total} 件を台帳に入れる`}
            </button>
            {blocked && (
              <p className="mt-1 text-xs text-red-600">
                上の問題を直してから、もう一度「内容を確認する」を押してください。
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded border border-slate-200 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function Issues({ title, items, tone }: { title: string; items: string[]; tone: "red" | "amber" }) {
  const color =
    tone === "red" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`rounded border px-3 py-2 text-xs ${color}`}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
        {items.slice(0, 50).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {items.length > 50 && <p className="mt-1">ほか {items.length - 50} 件</p>}
    </div>
  );
}
