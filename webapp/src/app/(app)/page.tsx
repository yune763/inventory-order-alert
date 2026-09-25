import Link from "next/link";
import { AlertBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import { buildAlertText } from "@/lib/inventory/alert-text";
import { fmtDate, fmtMoney, fmtQty, todayInTokyo } from "@/lib/inventory/format";
import {
  getAlertSummary,
  getMasterOptions,
  getSettings,
  listActionableItems,
} from "@/lib/inventory/queries";
import { ALERT_TYPES, type AlertType } from "@/lib/inventory/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, actionable, settings, masters] = await Promise.all([
    getAlertSummary(),
    listActionableItems(50),
    getSettings(),
    getMasterOptions(),
  ]);

  const tiles = [
    { label: "A:即日対応", hint: "今日中に手を打たないと欠品する", key: "A:即日対応", tone: "bg-red-50 text-red-700 border-red-200" },
    { label: "B:3日以内", hint: "3日以内に発注する", key: "B:3日以内", tone: "bg-amber-50 text-amber-800 border-amber-200" },
    { label: "C:要確認", hint: "週次で棚卸しする", key: "C:要確認", tone: "bg-sky-50 text-sky-800 border-sky-200" },
    { label: "正常", hint: "対応不要", key: "-", tone: "bg-slate-50 text-slate-600 border-slate-200" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold">HOME</h1>
        <p className="text-xs text-slate-500">
          基準日 {fmtDate(todayInTokyo())}／全 {summary.total.toLocaleString("ja-JP")} 品目
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            href={`/items?priority=${encodeURIComponent(tile.key)}`}
            className={`rounded-lg border p-4 transition hover:brightness-95 ${tile.tone}`}
          >
            <p className="text-xs font-semibold">{tile.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {(summary.byPriority[tile.key] ?? 0).toLocaleString("ja-JP")}
              <span className="ml-1 text-sm font-normal">件</span>
            </p>
            <p className="mt-1 text-[11px] opacity-80">{tile.hint}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">在庫金額</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{fmtMoney(summary.stockValue)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">発注推奨数の合計</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {fmtQty(summary.orderQtyTotal, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">
            アラートが出ているが、対応状況で手当て済み（発注済み・廃盤・発注NG）
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.handled.toLocaleString("ja-JP")}
            <span className="ml-1 text-sm font-normal text-slate-500">件</span>
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">アラート区分の内訳</h2>
        <p className="mt-1 text-xs text-slate-500">
          上から重い順。1つの商品には、最初に当たった1区分だけが付く。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALERT_TYPES.map((alert: AlertType) => {
            const count = summary.byAlert[alert] ?? 0;
            return (
              <Link
                key={alert}
                href={`/items?alert=${encodeURIComponent(alert)}`}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-slate-50 ${
                  count === 0 ? "border-slate-200 opacity-50" : "border-slate-300"
                }`}
              >
                <AlertBadge alert={alert} />
                <span className="tabular-nums font-semibold">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">
            要対応リスト（優先度A・B）
            <span className="ml-2 text-xs font-normal text-slate-500">
              {actionable.length} 件
            </span>
          </h2>
          <Link href="/items?priority=A%3A%E5%8D%B3%E6%97%A5%E5%AF%BE%E5%BF%9C" className="text-xs text-blue-600 hover:underline">
            一覧で見る
          </Link>
        </div>

        {actionable.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            今日手を打つべき商品はありません。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">優先度</th>
                  <th className="px-3 py-2 font-medium">区分</th>
                  <th className="px-3 py-2 font-medium">商品</th>
                  <th className="px-3 py-2 text-right font-medium">有効在庫</th>
                  <th className="px-3 py-2 text-right font-medium">発注点</th>
                  <th className="px-3 py-2 text-right font-medium">発注推奨数</th>
                  <th className="px-3 py-2 font-medium">発注期限</th>
                  <th className="px-3 py-2 font-medium">仕入先</th>
                  <th className="px-3 py-2 font-medium">推奨アクション</th>
                  <th className="px-3 py-2 font-medium">対応状況</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionable.map((item) => {
                  const { action } = buildAlertText(item, settings);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-3 py-2">
                        <AlertBadge alert={item.alert_type} />
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/items/${item.id}`} className="text-blue-600 hover:underline">
                          {item.code}
                        </Link>
                        <span className="ml-2 text-slate-700">{item.name}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtQty(item.available_qty)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fmtQty(item.rop)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtQty(item.order_qty, 0)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(item.order_due_date)}</td>
                      <td className="px-3 py-2 text-slate-600">{item.supplier_name ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{action || "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={item.status} options={masters.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
