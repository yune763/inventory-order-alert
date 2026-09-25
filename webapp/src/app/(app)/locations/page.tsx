import Link from "next/link";
import { MasterOptionList } from "@/components/master-option-list";
import { getMasterOptions, getMasterUsage } from "@/lib/inventory/queries";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const [masters, usage] = await Promise.all([getMasterOptions(true), getMasterUsage()]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">保管場所</h1>
        <p className="mt-1 text-sm text-slate-500">
          倉庫・棚番。棚卸とピッキングの単位になる。商品編集の「保管場所」の候補と、
          在庫一覧の絞り込みに使う。商品で使われている保管場所は削除できないので、
          使わなくなったものは「非表示」に切り替える。
        </p>
      </div>

      <MasterOptionList
        kind="location"
        options={masters.location}
        usage={Object.fromEntries(usage.location)}
        usageLabel="この場所の商品"
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
