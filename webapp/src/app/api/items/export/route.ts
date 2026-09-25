import { NextResponse } from "next/server";
import { COLUMNS } from "@/lib/inventory/columns";
import { itemsToCsv } from "@/lib/inventory/csv";
import { todayInTokyo } from "@/lib/inventory/format";
import { exportItems, getSettings, type ItemFilters } from "@/lib/inventory/queries";

/**
 * CSV書き出し。旧スプレッドシートと同じ42列・同じ並びで出す。
 * 一覧画面の絞り込み（クエリ文字列）をそのまま受け取るので、見えているものがそのまま出る。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const stamp = todayInTokyo().replace(/-/g, "");

  // 見出しだけのテンプレート（新規に作り始めるとき用）
  if (url.searchParams.get("template")) {
    const header = `﻿${COLUMNS.map((c) => c.csvHeader).join(",")}\r\n`;
    return csvResponse(header, `在庫・発注アラート_テンプレート.csv`);
  }

  const filters: ItemFilters = {
    q: url.searchParams.get("q") ?? "",
    alert: url.searchParams.get("alert") ?? "",
    priority: url.searchParams.get("priority") ?? "",
    status: url.searchParams.get("status") ?? "",
    category: url.searchParams.get("category") ?? "",
    location: url.searchParams.get("location") ?? "",
    supplier: url.searchParams.get("supplier") ?? "",
    sort: url.searchParams.get("sort") ?? "priority",
    dir: url.searchParams.get("dir") === "desc" ? "desc" : "asc",
  };

  const [items, settings] = await Promise.all([exportItems(filters), getSettings()]);
  return csvResponse(itemsToCsv(items, settings), `在庫・発注アラート_${stamp}.csv`);
}

function csvResponse(body: string, filename: string): NextResponse {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // 日本語のファイル名は RFC 5987 形式でないと文字化けする
      "Content-Disposition": `attachment; filename="export.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
