import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertBadge, PriorityBadge } from "@/components/badges";
import { buildAlertText } from "@/lib/inventory/alert-text";
import { fmtDate, fmtMoney, fmtQty, plainNum, todayInTokyo } from "@/lib/inventory/format";
import { getItemById, getMasterOptions, getSettings } from "@/lib/inventory/queries";
import { listDestinations, listMovementsForItem, listSourceNames } from "@/lib/inventory/movements";
import { MOVEMENT_KIND_LABELS } from "@/lib/inventory/types";
import { MovementForm } from "../../movements/movement-form";
import { DeleteMovementButton } from "../../movements/movement-row-actions";
import { DeleteButton } from "./delete-button";
import { ItemForm } from "../item-form";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage(props: PageProps<"/items/[id]">) {
  const { id } = await props.params;
  const [item, masters, settings, movements, destinations, pastSources] = await Promise.all([
    getItemById(id),
    getMasterOptions(),
    getSettings(),
    listMovementsForItem(id, 20),
    listDestinations(),
    listSourceNames(),
  ]);
  if (!item) notFound();

  // 入庫元の候補＝仕入先マスタ ＋ これまでに入力された入庫元
  const sources = [...new Set([...masters.supplier.map((o) => o.label), ...pastSources])];

  const { reason, action } = buildAlertText(item, settings);
  const physical = item.count_qty ?? item.book_qty;

  // 判定の内訳。数式と、その式に入った実際の数値を並べて出す。
  // スプレッドシートでは列を左右に見比べるしかなかった部分。
  const breakdown: { label: string; value: string; formula: string }[] = [
    {
      label: "有効在庫数",
      value: fmtQty(item.available_qty),
      formula: `${item.count_qty === null ? "理論在庫" : "実棚在庫"} ${plainNum(physical)} − 引当 ${plainNum(item.allocated_qty)}`,
    },
    {
      label: "在庫ポジション",
      value: fmtQty(item.stock_position),
      formula: `有効在庫 ${plainNum(item.available_qty)} + 発注残 ${plainNum(item.on_order_qty)}（発注判定はこの値で行う）`,
    },
    {
      label: "在庫金額",
      value: fmtMoney(item.stock_value),
      formula: `有効在庫 ${plainNum(item.available_qty)} × 仕入単価 ${plainNum(item.cost)}`,
    },
    {
      label: "平均日次出庫数",
      value: fmtQty(item.daily_out, 2),
      formula:
        item.out_move_count > 0
          ? `直近${settings.demand_window_days}日の出庫 ${plainNum(item.out_qty_effective)}（入出庫台帳から集計）÷ ${settings.demand_window_days}日`
          : `期間出庫数 ${plainNum(item.out_qty_effective)}（手入力）÷ ${settings.demand_window_days}日`,
    },
    {
      label: "在庫日数",
      value: item.daily_out > 0 ? `${fmtQty(item.days_of_stock)} 日` : "—（出庫実績なし）",
      formula: `有効在庫 ${plainNum(item.available_qty)} ÷ 平均日次出庫 ${plainNum(item.daily_out)}`,
    },
    {
      label: "欠品予測日",
      value: fmtDate(item.stockout_date),
      formula: `今日 ${fmtDate(item.today)} + 在庫日数`,
    },
    {
      label: "安全在庫数",
      value: fmtQty(item.safety_qty),
      formula: `平均日次出庫 ${plainNum(item.daily_out)} × 安全在庫日数 ${item.safety_days_effective}日${item.safety_days === null ? "（既定値）" : ""}`,
    },
    {
      label: "発注点",
      value: fmtQty(item.rop),
      formula: `平均日次出庫 ${plainNum(item.daily_out)} × リードタイム ${item.lead_time_days}日 + 安全在庫 ${plainNum(item.safety_qty)}`,
    },
    {
      label: "適正在庫上限",
      value: fmtQty(item.max_qty),
      formula: `平均日次出庫 ${plainNum(item.daily_out)} ×（リードタイム ${item.lead_time_days} + 安全在庫 ${item.safety_days_effective} + 発注サイクル ${settings.order_cycle_days}）日`,
    },
    {
      label: "発注推奨数",
      value: fmtQty(item.order_qty, 0),
      formula:
        item.order_qty > 0
          ? `（適正上限 ${plainNum(item.max_qty)} − 在庫ポジション ${plainNum(item.stock_position)}）を MOQ ${plainNum(item.moq)} とロット ${plainNum(item.lot)} に丸めた数`
          : "発注点を割っていないので0",
    },
    {
      label: "発注期限日",
      value: fmtDate(item.order_due_date),
      formula: `欠品予測日 ${fmtDate(item.stockout_date)} − リードタイム ${item.lead_time_days}日`,
    },
    {
      label: "棚卸差異",
      value: item.count_diff === null ? "—（未棚卸）" : fmtQty(item.count_diff),
      formula:
        item.count_diff === null
          ? "実棚在庫数が未入力"
          : `実棚 ${plainNum(item.count_qty)} − 理論 ${plainNum(item.book_qty)}`,
    },
    {
      label: "滞留日数",
      value: item.idle_days === null ? "—" : `${item.idle_days} 日`,
      formula: `今日 ${fmtDate(item.today)} − 最終出庫日 ${fmtDate(item.last_out_effective, "未入力")}${
        item.out_move_count > 0 ? "（入出庫台帳）" : ""
      }`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            <Link href="/items" className="hover:underline">
              在庫一覧
            </Link>
            {" / "}
            {item.code}
          </p>
          <h1 className="text-lg font-semibold">{item.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <AlertBadge alert={item.alert_type} />
          <PriorityBadge priority={item.priority} />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2" style={{ borderTop: "3px solid #c62828" }}>
          <h2 className="text-sm font-semibold">いまの判定</h2>
        </div>
        <dl className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">アラート理由</dt>
            <dd className="text-sm">{reason || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">推奨アクション</dt>
            <dd className="text-sm font-medium">{action || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-baseline gap-2 border-b border-slate-200 px-4 py-2" style={{ borderTop: "3px solid #6a1b9a" }}>
          <h2 className="text-sm font-semibold">判定の内訳</h2>
          <p className="text-[11px] text-slate-500">基準日 {fmtDate(item.today)}。保存はされず、開くたびに計算し直される。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {breakdown.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="w-40 px-4 py-2 text-left font-medium text-slate-600">
                    {row.label}
                  </th>
                  <td className="w-40 px-4 py-2 text-right font-semibold tabular-nums">{row.value}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{row.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-baseline gap-2 border-b border-slate-200 px-4 py-2" style={{ borderTop: "3px solid #00695c" }}>
          <h2 className="text-sm font-semibold">入出庫</h2>
          <p className="text-[11px] text-slate-500">
            登録すると理論在庫数（現在 {fmtQty(item.book_qty)}）がその場で増減する。
            {item.out_move_count > 0
              ? `期間出庫数もこの台帳から集計している（直近${settings.demand_window_days}日で ${fmtQty(item.out_qty_effective)}）。`
              : "出庫を1件でも登録すると、期間出庫数は手入力値ではなく台帳の集計に切り替わる。"}
          </p>
        </div>

        <div className="border-b border-slate-100 p-4">
          <MovementForm
            items={[]}
            destinations={destinations}
            sources={sources}
            today={todayInTokyo()}
            fixedItem={{ id: item.id, code: item.code, name: item.name, unit: item.unit }}
            defaultSource={item.supplier_name}
          />
        </div>

        {movements.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">まだ入出庫の登録がありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-1.5 font-medium">日付</th>
                  <th className="px-3 py-1.5 font-medium">区分</th>
                  <th className="px-3 py-1.5 text-right font-medium">数量</th>
                  <th className="px-3 py-1.5 text-right font-medium">増減</th>
                  <th className="px-3 py-1.5 font-medium">出荷先 / 入庫元</th>
                  <th className="px-3 py-1.5 font-medium">伝票番号</th>
                  <th className="px-3 py-1.5 font-medium">備考</th>
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap px-3 py-1.5">{fmtDate(movement.moved_on)}</td>
                    <td className="px-3 py-1.5">{MOVEMENT_KIND_LABELS[movement.kind]}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmtQty(movement.quantity)}</td>
                    <td
                      className={`px-3 py-1.5 text-right tabular-nums ${
                        movement.signed_qty < 0 ? "text-red-600" : "text-emerald-700"
                      }`}
                    >
                      {movement.signed_qty > 0 ? "+" : ""}
                      {fmtQty(movement.signed_qty)}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {movement.destination_name ?? movement.source_name ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{movement.slip_no ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-500">{movement.note ?? "—"}</td>
                    <td className="px-3 py-1.5 text-right">
                      <DeleteMovementButton
                        id={movement.id}
                        label={`${fmtDate(movement.moved_on)} ${MOVEMENT_KIND_LABELS[movement.kind]} ${fmtQty(movement.quantity)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-[11px] text-slate-400">
              直近20件を表示。全件は
              <Link href={`/movements?q=${encodeURIComponent(item.code)}`} className="mx-1 text-blue-600 hover:underline">
                入出庫
              </Link>
              から。
            </p>
          </div>
        )}
      </section>

      <ItemForm id={item.id} item={item} masters={masters} settings={settings} />

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <DeleteButton id={item.id} code={item.code} />
      </div>
    </div>
  );
}
