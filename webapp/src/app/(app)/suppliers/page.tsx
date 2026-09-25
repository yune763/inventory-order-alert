import Link from "next/link";
import { MasterOptionList } from "@/components/master-option-list";
import { getMasterOptions, getMasterUsage } from "@/lib/inventory/queries";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [masters, usage] = await Promise.all([getMasterOptions(true), getMasterUsage()]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">仕入先</h1>
        <p className="mt-1 text-sm text-slate-500">
          発注書の宛先。商品編集の「仕入先名」の候補になり、選ぶと仕入先コードも一緒に入る。
          入出庫の「入庫元」の候補にもなる。商品で使われている仕入先は削除できないので、
          使わなくなったものは「非表示」に切り替える。
        </p>
      </div>

      <MasterOptionList
        kind="supplier"
        options={masters.supplier}
        usage={Object.fromEntries(usage.supplier)}
        showCode
        codeLabel="仕入先コード"
        usageLabel="この仕入先の商品"
      />

      <p className="text-xs text-slate-400">
        対応状況・カテゴリ・単位の選択肢は
        <Link href="/masters" className="mx-1 text-blue-600 hover:underline">
          マスタ
        </Link>
        にあります。
      </p>
    </div>
  );
}
