import { COLUMNS } from "@/lib/inventory/columns";
import { MOVEMENT_CSV_HEADERS } from "@/lib/inventory/movement-csv";
import { ImportForm } from "./import-form";
import { MovementImportForm } from "./movement-import-form";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  const inputHeaders = COLUMNS.filter((c) => c.source === "input").map((c) => c.csvHeader);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">取込・書き出し</h1>
        <p className="mt-1 text-sm text-slate-500">
          旧スプレッドシートからの引っ越しと、日々の販売データ取込に使う。
        </p>
      </div>

      <h2 className="text-base font-semibold">商品CSV（42列）</h2>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h3 className="text-sm font-semibold">スプレッドシートから移すとき</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
          <li>旧シートを開き、ファイル → ダウンロード → カンマ区切り形式(.csv) で書き出す</li>
          <li>下の「CSVファイルを選ぶ」でそのファイルを指定する（見出しの並びは旧シートのままでよい）</li>
          <li>内容を確認してから取り込む。自動計算列（有効在庫・発注点・アラート区分など）は読み飛ばす</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          商品コードが一致する行は更新、無ければ新規追加。<strong>CSVに載っていない列は今の値のまま残る</strong>ので、
          「商品コード＋期間出庫数」だけのファイルを毎日流し込む使い方もできる。
        </p>
      </section>

      <ImportForm />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">入出庫CSV</h2>
          <p className="text-sm text-slate-500">
            販売管理・受発注システムから出した入出庫の明細を台帳に流し込む。
            取り込むと理論在庫数が増減し、期間出庫数もこの台帳から集計されるようになる。
          </p>
        </div>
        <MovementImportForm />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">入出庫CSVの見出し</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MOVEMENT_CSV_HEADERS.map((header) => (
              <span key={header} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                {header}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            必須は「日付」「区分」「商品コード」「数量」。区分は 入庫 / 出庫 / 調整（in / out / adjust も可）。
            減らす調整はマイナスの数量で書く。出荷先は出庫の行、入庫元は入庫の行にだけ書ける。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/movements/export" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              入出庫をCSVで書き出す
            </a>
            <a href="/api/movements/export?template=1" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              見出しだけのテンプレート
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h2 className="text-sm font-semibold">書き出し</h2>
        <p className="mt-1 text-xs text-slate-500">
          旧シートと同じ42列・同じ並びで出す。判定結果（アラート区分・理由・推奨アクション）も含まれる。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/items/export"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            全商品をCSVで書き出す
          </a>
          <a
            href="/api/items/export?priority=A%3A%E5%8D%B3%E6%97%A5%E5%AF%BE%E5%BF%9C"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            優先度Aだけ書き出す
          </a>
          <a
            href="/api/items/export?template=1"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            見出しだけのテンプレート
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">取り込める見出し（入力列）</h2>
        <p className="mt-1 text-xs text-slate-500">
          この名前の列だけを読み取る。順番は問わない。必須は「商品コード」と「商品名」。
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {inputHeaders.map((header) => (
            <span key={header} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              {header}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
