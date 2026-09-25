import { fmtDate, plainNum } from "./format";
import type { EvaluatedItem, Settings } from "./types";

/**
 * アラート理由（判定根拠の数値）と推奨アクション（次に取る行動）の文面。
 *
 * 区分そのものの判定はDBのビューが持ち、ここは文章化だけを担当する。
 * 文面は GAS 版 evaluateRow_ の出力をそのまま移植したもの。
 * 一覧・詳細・CSV書き出し・日次アラートの4箇所が同じ文を使う。
 */
export function buildAlertText(
  item: EvaluatedItem,
  settings: Settings
): { reason: string; action: string } {
  const reasons: string[] = [];
  let action = "";

  switch (item.alert_type) {
    case "欠品":
      reasons.push(`有効在庫が0以下（引当済${plainNum(item.allocated_qty)}）`);
      action =
        item.on_order_qty > 0
          ? `入荷予定(${fmtDate(item.eta)})を前倒し依頼／代替品を手配`
          : `至急 ${plainNum(Math.max(item.order_qty, item.moq))} 発注`;
      break;

    case "発注漏れ":
      reasons.push(
        `発注点割れなのに発注残0、発注期限(${fmtDate(item.order_due_date)})超過`
      );
      action = `本日中に ${plainNum(item.order_qty)} 発注（リードタイム${plainNum(item.lead_time_days)}日）`;
      break;

    case "欠品リスク":
      reasons.push(
        `在庫日数${plainNum(item.days_of_stock)}日 ≦ リードタイム${plainNum(item.lead_time_days)}日`
      );
      action = item.order_qty > 0 ? `${plainNum(item.order_qty)} を即発注` : "入荷予定を前倒し確認";
      break;

    case "入荷遅延":
      reasons.push(`入荷予定日(${fmtDate(item.eta)})超過、未入庫${plainNum(item.on_order_qty)}`);
      action = "仕入先へ納期照会";
      break;

    case "発注推奨":
      reasons.push(`在庫ポジション${plainNum(item.stock_position)} ≦ 発注点${plainNum(item.rop)}`);
      action = `${plainNum(item.order_qty)} を発注（期限 ${fmtDate(item.order_due_date)}）`;
      break;

    case "過剰在庫":
      reasons.push(
        `有効在庫${plainNum(item.available_qty)} > 適正上限${plainNum(item.max_qty)}（${plainNum(item.days_of_stock)}日分）`
      );
      action = "発注停止・販促／他拠点へ移管";
      break;

    case "滞留在庫":
      reasons.push(`${plainNum(item.idle_days)}日間 出庫なし`);
      action = "処分・値下げ・返品を検討";
      break;

    case "棚卸差異":
      reasons.push(
        `理論${plainNum(item.book_qty)} / 実棚${plainNum(item.count_qty)}（差異${plainNum(item.count_diff)}）`
      );
      action = "入出庫履歴を照合し理論在庫を修正";
      break;

    default:
      break;
  }

  // 別の重いアラートが出ている行でも、棚卸差異があることは理由に残す（在庫精度の追跡用）
  if (
    item.alert_type !== "棚卸差異" &&
    item.count_diff !== null &&
    Math.abs(item.count_diff) > settings.count_diff_tolerance
  ) {
    reasons.push(`棚卸差異${plainNum(item.count_diff)}`);
  }

  return { reason: reasons.join(" / "), action };
}
