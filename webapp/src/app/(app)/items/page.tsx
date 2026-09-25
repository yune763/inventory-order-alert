import Link from "next/link";
import { buildAlertText } from "@/lib/inventory/alert-text";
import { getMasterOptions, getSettings, listItems, type ItemFilters } from "@/lib/inventory/queries";
import { ALERT_TYPES, PRIORITIES } from "@/lib/inventory/types";
import { FilterBar } from "./filter-bar";
import { ItemsTable } from "./items-table";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ItemsPage(props: PageProps<"/items">) {
  const sp = await props.searchParams;
  const filters: ItemFilters = {
    q: first(sp.q),
    alert: first(sp.alert),
    priority: first(sp.priority),
    status: first(sp.status),
    category: first(sp.category),
    location: first(sp.location),
    supplier: first(sp.supplier),
    sort: first(sp.sort) || "priority",
    dir: first(sp.dir) === "desc" ? "desc" : "asc",
    page: Number(first(sp.page)) || 1,
  };

  const [{ items, total, page, pageCount }, settings, masters] = await Promise.all([
    listItems(filters),
    getSettings(),
    getMasterOptions(),
  ]);

  const rows = items.map((item) => ({ ...item, ...buildAlertText(item, settings) }));

  // 書き出しは今の絞り込みをそのまま引き継ぐ（見えているものがそのまま出る）
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "page") exportParams.set(key, String(value));
  }

  const pageLink = (next: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value && key !== "page") params.set(key, String(value));
    }
    params.set("page", String(next));
    return `/items?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          在庫一覧
          <span className="ml-2 text-sm font-normal text-slate-500">
            {total.toLocaleString("ja-JP")} 件
          </span>
        </h1>
        <div className="flex gap-2">
          <a
            href={`/api/items/export?${exportParams.toString()}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            CSVで書き出す
          </a>
          <Link
            href="/items/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            商品を追加
          </Link>
        </div>
      </div>

      <FilterBar
        filters={filters}
        alertTypes={[...ALERT_TYPES]}
        priorities={[...PRIORITIES]}
        masters={masters}
      />

      <ItemsTable rows={rows} settings={settings} masters={masters} sort={filters.sort ?? "priority"} dir={filters.dir ?? "asc"} />

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
