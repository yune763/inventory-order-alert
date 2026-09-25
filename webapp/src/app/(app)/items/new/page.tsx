import { getMasterOptions, getSettings } from "@/lib/inventory/queries";
import { ItemForm } from "../item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const [masters, settings] = await Promise.all([getMasterOptions(), getSettings()]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-lg font-semibold">商品を追加</h1>
      <ItemForm masters={masters} settings={settings} />
    </div>
  );
}
