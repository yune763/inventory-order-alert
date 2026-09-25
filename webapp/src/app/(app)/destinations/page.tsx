import Link from "next/link";
import { fmtMoney, fmtQty } from "@/lib/inventory/format";
import { getDestinationSummary, getDestinationUsage, listDestinations } from "@/lib/inventory/movements";
import { getSettings } from "@/lib/inventory/queries";
import { DestinationList } from "./destination-list";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const [destinations, usage, settings] = await Promise.all([
    listDestinations(true),
    getDestinationUsage(),
    getSettings(),
  ]);
  const summary = await getDestinationSummary(settings.demand_window_days);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">出荷先</h1>
        <p className="mt-1 text-sm text-slate-500">
          出庫を登録するときに選ぶ先。得意先・現場・自社拠点などを入れておくと、
          「どこへいくつ出たか」を集計できる。出庫実績のある出荷先は削除できないので、
          使わなくなったものは「非表示」に切り替える。
        </p>
      </div>

      <DestinationList destinations={destinations} usage={Object.fromEntries(usage)} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">
          直近{settings.demand_window_days}日の出荷実績
        </h2>
        {summary.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">この期間の出庫はまだありません。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-1.5 font-medium">出荷先</th>
                  <th className="px-3 py-1.5 text-right font-medium">出庫数</th>
                  <th className="px-3 py-1.5 text-right font-medium">件数</th>
                  <th className="px-3 py-1.5 text-right font-medium">金額</th>
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map((row) => (
                  <tr key={row.destination_id ?? "none"}>
                    <td className="px-3 py-1.5">{row.destination_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmtQty(row.qty)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{row.count}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmtMoney(row.amount)}</td>
                    <td className="px-3 py-1.5 text-right">
                      {row.destination_id && (
                        <Link
                          href={`/movements?destination=${row.destination_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          明細
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
