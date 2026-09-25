import Link from "next/link";
import { fmtDate, fmtMoney, fmtQty, todayInTokyo } from "@/lib/inventory/format";
import {
  getDestinationSummary,
  listDestinations,
  listItemChoices,
  listMovements,
  listSourceNames,
  type MovementFilters,
} from "@/lib/inventory/movements";
import { getMasterOptions, getSettings } from "@/lib/inventory/queries";
import { MOVEMENT_KIND_LABELS } from "@/lib/inventory/types";
import { MovementFilterBar } from "./filter-bar";
import { MovementForm } from "./movement-form";
import { DeleteMovementButton } from "./movement-row-actions";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const KIND_STYLES: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800",
  out: "bg-sky-100 text-sky-800",
  adjust: "bg-amber-100 text-amber-800",
};

export default async function MovementsPage(props: PageProps<"/movements">) {
  const sp = await props.searchParams;
  const filters: MovementFilters = {
    q: first(sp.q),
    kind: first(sp.kind),
    destination: first(sp.destination),
    from: first(sp.from),
    to: first(sp.to),
    page: Number(first(sp.page)) || 1,
  };

  const [{ rows, total, page, pageCount, totalIn, totalOut }, destinations, items, settings, masters, pastSources] =
    await Promise.all([
      listMovements(filters),
      listDestinations(),
      listItemChoices(),
      getSettings(),
      getMasterOptions(),
      listSourceNames(),
    ]);
  // 入庫元の候補＝仕入先マスタ ＋ これまでに入力された入庫元
  const sources = [...new Set([...masters.supplier.map((o) => o.label), ...pastSources])];
  const destinationSummary = await getDestinationSummary(settings.demand_window_days);

  const pageLink = (next: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value && key !== "page") params.set(key, String(value));
    }
    params.set("page", String(next));
    return `/movements?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold">
          入出庫
          <span className="ml-2 text-sm font-normal text-slate-500">{total.toLocaleString("ja-JP")} 件</span>
        </h1>
        <p className="text-xs text-slate-500">
          登録すると理論在庫数がその場で増減し、期間出庫数・最終入出庫日も台帳から計算されるようになる。
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">入出庫を登録する</h2>
        <MovementForm
          items={items}
          destinations={destinations}
          sources={sources}
          today={todayInTokyo()}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">
          出荷先別の実績
          <span className="ml-2 text-xs font-normal text-slate-500">
            直近{settings.demand_window_days}日の出庫
          </span>
        </h2>
        {destinationSummary.length === 0 ? (
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
                {destinationSummary.map((row) => (
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

      <MovementFilterBar
        values={{
          q: filters.q ?? "",
          kind: filters.kind ?? "",
          destination: filters.destination ?? "",
          from: filters.from ?? "",
          to: filters.to ?? "",
        }}
        destinations={destinations}
      />

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-4 py-2 text-sm">
          <span className="text-slate-500">絞り込み結果の合計</span>
          <span>
            入庫 <strong className="tabular-nums">{fmtQty(totalIn, 0)}</strong>
          </span>
          <span>
            出庫 <strong className="tabular-nums">{fmtQty(totalOut, 0)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">日付</th>
                <th className="px-3 py-2 font-medium">区分</th>
                <th className="px-3 py-2 font-medium">商品</th>
                <th className="px-3 py-2 text-right font-medium">数量</th>
                <th className="px-3 py-2 text-right font-medium">在庫への増減</th>
                <th className="px-3 py-2 font-medium">出荷先 / 入庫元</th>
                <th className="px-3 py-2 font-medium">伝票番号</th>
                <th className="px-3 py-2 font-medium">備考</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                    該当する入出庫がありません。
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-1.5">{fmtDate(row.moved_on)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${KIND_STYLES[row.kind]}`}>
                      {MOVEMENT_KIND_LABELS[row.kind]}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <Link href={`/items/${row.item_id}`} className="text-blue-600 hover:underline">
                      {row.item_code}
                    </Link>
                    <span className="ml-2 text-slate-700">{row.item_name}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmtQty(row.quantity)}
                    {row.unit && <span className="ml-1 text-xs text-slate-400">{row.unit}</span>}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      row.signed_qty < 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {row.signed_qty > 0 ? "+" : ""}
                    {fmtQty(row.signed_qty)}
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">
                    {row.destination_name ?? row.source_name ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{row.slip_no ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-500">{row.note ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right">
                    <DeleteMovementButton
                      id={row.id}
                      label={`${fmtDate(row.moved_on)} ${MOVEMENT_KIND_LABELS[row.kind]} ${fmtQty(row.quantity)}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={pageLink(page - 1)} className="rounded border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50">
              前へ
            </Link>
          )}
          <span className="text-slate-500">
            {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={pageLink(page + 1)} className="rounded border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50">
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
