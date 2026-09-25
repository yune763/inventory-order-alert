"use client";

import { useActionState } from "react";
import { analyzeCsv, commitCsv, type ImportState } from "./actions";

export function ImportForm() {
  const [state, analyze, analyzing] = useActionState<ImportState, FormData>(analyzeCsv, { error: null });
  const [commitState, commit, committing] = useActionState<ImportState, FormData>(commitCsv, { error: null });

  const preview = state.preview;
  const done = commitState.done;

  return (
    <div className="space-y-4">
      <form action={analyze} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="text-sm font-medium" htmlFor="file">
            CSVファイルを選ぶ
          </label>
          <input
            id="file"
            type="file"
            name="file"
            accept=".csv,.tsv,.txt,text/csv"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="text">
            または、スプレッドシートの範囲をそのまま貼り付ける
          </label>
          <p className="text-[11px] text-slate-500">
            1行目は見出し。タブ区切り（シートからのコピー）でもそのまま読み取れる。
          </p>
          <textarea
            id="text"
            name="text"
            rows={6}
            placeholder="対応状況	商品コード	商品名	…"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
          />
        </div>

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
          取り込みました。新規 {done.created} 件 / 更新 {done.updated} 件。
        </p>
      )}
      {commitState.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {commitState.error}
        </p>
      )}

      {preview && !done && (
        <section className="space-y-3 rounded-lg border border-slate-300 bg-white p-4">
          <h2 className="text-sm font-semibold">取り込み内容の確認</h2>

          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="新規に追加" value={preview.creates} tone="text-emerald-700" />
            <Stat label="既存を更新" value={preview.updates} tone="text-blue-700" />
            <Stat label="取り込めない行" value={preview.errors.length} tone="text-red-700" />
            <Stat label="確認が必要" value={preview.warnings.length} tone="text-amber-700" />
          </div>

          <p className="text-xs text-slate-500">
            更新する列: {preview.presentKeys.length} 列（CSVに無い列は今の値のまま残る）
            {preview.ignoredHeaders.length > 0 && (
              <> ／ 読み飛ばした見出し: {preview.ignoredHeaders.join("、")}</>
            )}
          </p>

          {preview.errors.length > 0 && (
            <IssueList title="取り込めない行（この行だけ飛ばして続行します）" issues={preview.errors} tone="red" />
          )}
          {preview.warnings.length > 0 && (
            <IssueList title="確認が必要（取り込みは行います）" issues={preview.warnings} tone="amber" />
          )}

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-1.5 font-medium">区分</th>
                  <th className="px-3 py-1.5 font-medium">商品コード</th>
                  <th className="px-3 py-1.5 font-medium">商品名</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.sample.map((row) => (
                  <tr key={row.code}>
                    <td className="px-3 py-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          row.kind === "新規" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {row.kind}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs">{row.code}</td>
                    <td className="px-3 py-1.5">{row.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.creates + preview.updates > preview.sample.length && (
            <p className="text-xs text-slate-400">
              先頭 {preview.sample.length} 件だけ表示しています（全 {preview.creates + preview.updates} 件）。
            </p>
          )}

          <form action={commit}>
            <input type="hidden" name="text" value={preview.text} />
            <button
              type="submit"
              disabled={committing || preview.creates + preview.updates === 0}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {committing ? "取り込み中…" : `${preview.creates + preview.updates} 件を取り込む`}
            </button>
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

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: { line: number; code: string; message: string }[];
  tone: "red" | "amber";
}) {
  const color = tone === "red" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`rounded border px-3 py-2 text-xs ${color}`}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto">
        {issues.slice(0, 100).map((issue, index) => (
          <li key={`${issue.line}-${index}`}>
            {issue.line}行目 {issue.code && `[${issue.code}] `}
            {issue.message}
          </li>
        ))}
      </ul>
      {issues.length > 100 && <p className="mt-1">ほか {issues.length - 100} 件</p>}
    </div>
  );
}
