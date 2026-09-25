import { getMasterOptions, getMasterUsage } from "@/lib/inventory/queries";
import { listCodeRules } from "@/lib/inventory/code-rules";
import Link from "next/link";
import { CodeRuleRow } from "./code-rule-row";
import { NewCodeRuleForm } from "./new-code-rule-form";
import { MASTER_KINDS, MASTER_KIND_LABELS, type MasterKind } from "@/lib/inventory/types";
import { MasterRow } from "./master-row";
import { NewOptionForm } from "./new-option-form";

export const dynamic = "force-dynamic";

const KIND_NOTES: Record<MasterKind, string> = {
  status:
    "人が選ぶ列。ここに無い値は選べない（表記ゆれが絞り込みを壊すため）。色は一覧の対応状況に出る。",
  category: "商品の分類。商品編集では候補として出るだけで、マスタ外の値も入力できる。",
  unit: "個・箱・本 など。",
  location: "倉庫・棚番。棚卸とピッキングの単位。",
  supplier: "発注書の宛先。仕入先コードを入れておくと、商品編集で名前を選んだときに一緒に入る。",
};

export default async function MastersPage() {
  // 使用件数は選択肢を消してよいかの判断材料になるので、一覧と一緒に出す
  const [masters, usage, codeRules] = await Promise.all([
    getMasterOptions(true),
    getMasterUsage(),
    listCodeRules(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">マスタ</h1>
        <p className="mt-1 text-sm text-slate-500">
          スプレッドシートの「マスタ」シートにあたる画面。ここに1行足せば、商品編集のプルダウンと
          一覧の絞り込みに即反映される。
        </p>
        <p className="mt-2 text-sm text-slate-500">
          仕入先・保管場所・出荷先は、それぞれ
          <Link href="/suppliers" className="mx-1 text-blue-600 hover:underline">仕入先</Link>
          <Link href="/locations" className="mx-1 text-blue-600 hover:underline">保管場所</Link>
          <Link href="/destinations" className="mx-1 text-blue-600 hover:underline">出荷先</Link>
          のページで管理する。
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2">
          <h2 className="text-sm font-semibold">品番（商品コードの採番ルール）</h2>
          <p className="text-[11px] text-slate-500">
            商品を新規登録するときに「採番」を押すと、ここのルールで品番を発番する。
            カテゴリごとにルールを作れて、そのカテゴリ専用のルールが無ければ
            カテゴリ空欄の既定ルールを使う。押した時点で番号を確保するので、登録をやめると欠番になる。
          </p>
        </div>
        <div>
          {codeRules.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              採番ルールがありません。追加すると「採番」ボタンが使えるようになります。
            </p>
          )}
          {codeRules.map((rule) => (
            <CodeRuleRow key={rule.id} rule={rule} />
          ))}
        </div>
        <NewCodeRuleForm />
        <datalist id="master-category-rules">
          {masters.category.map((option) => (
            <option key={option.id} value={option.label} />
          ))}
        </datalist>
      </section>

      {/* 仕入先・保管場所・出荷先は項目が多く、一覧で扱いたいので専用ページに分けてある */}
      {MASTER_KINDS.filter((kind) => kind !== "supplier" && kind !== "location").map((kind) => (
        <section key={kind} className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-2">
            <h2 className="text-sm font-semibold">{MASTER_KIND_LABELS[kind]}</h2>
            <p className="text-[11px] text-slate-500">{KIND_NOTES[kind]}</p>
          </div>
          <div>
            {masters[kind].length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">まだ選択肢がありません。</p>
            )}
            {masters[kind].map((option) => (
              <MasterRow
                key={option.id}
                option={option}
                kind={kind}
                usage={usage[kind].get(option.label) ?? 0}
              />
            ))}
          </div>
          <NewOptionForm kind={kind} />
        </section>
      ))}
    </div>
  );
}
