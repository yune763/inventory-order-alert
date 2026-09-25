import { fmtDateTime } from "@/lib/inventory/format";
import { getSettings } from "@/lib/inventory/queries";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">判定パラメータ</h1>
        <p className="mt-1 text-sm text-slate-500">
          スプレッドシート版で <code className="rounded bg-slate-100 px-1">在庫アラート.gs</code> の
          CONFIG に書いていた値。ここを変えると、全商品の発注点・適正在庫上限・アラート区分が
          その場で計算し直される（保存済みの判定を書き換えるのではなく、毎回この値で計算している）。
        </p>
        <p className="mt-1 text-xs text-slate-400">最終更新 {fmtDateTime(settings.updated_at)}</p>
      </div>

      <SettingsForm settings={settings} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h2 className="text-sm font-semibold">計算式</h2>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
{`有効在庫       = (実棚在庫 があれば実棚 / 無ければ理論在庫) − 引当数
在庫ポジション  = 有効在庫 + 発注残数        ← 発注判定はこの値で行う
平均日次出庫    = 期間出庫数 ÷ 集計期間(${settings.demand_window_days}日)
在庫日数       = 有効在庫 ÷ 平均日次出庫
安全在庫       = 平均日次出庫 × 安全在庫日数(既定${settings.default_safety_days}日)
発注点         = 平均日次出庫 × リードタイム + 安全在庫
適正在庫上限    = 平均日次出庫 × (リードタイム + 安全在庫日数 + 発注サイクル${settings.order_cycle_days}日)
発注推奨数      = ceil( max(適正在庫上限 − 在庫ポジション, MOQ) ÷ ロット ) × ロット
発注期限日      = 欠品予測日 − リードタイム`}
        </pre>
        <p className="mt-2 text-xs text-slate-500">
          発注判定を「有効在庫」ではなく「有効在庫＋発注残」で行うのが要点。これをしないと、
          発注済みの商品に毎日同じアラートが出続けて誰も見なくなる。
        </p>
      </section>
    </div>
  );
}
