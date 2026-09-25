import { NextResponse } from "next/server";
import { todayInTokyo } from "@/lib/inventory/format";
import { MOVEMENT_CSV_HEADERS, movementsToCsv } from "@/lib/inventory/movement-csv";
import { listMovements, MOVEMENTS_PER_PAGE, type MovementFilters } from "@/lib/inventory/movements";

/** 入出庫台帳のCSV書き出し。入出庫画面の絞り込みをそのまま受け取る */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const stamp = todayInTokyo().replace(/-/g, "");

  if (url.searchParams.get("template")) {
    return csvResponse(`﻿${MOVEMENT_CSV_HEADERS.join(",")}\r\n`, "入出庫_テンプレート.csv");
  }

  const filters: MovementFilters = {
    q: url.searchParams.get("q") ?? "",
    kind: url.searchParams.get("kind") ?? "",
    destination: url.searchParams.get("destination") ?? "",
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
  };

  // 一覧は100件ずつだが、書き出しは条件に合うものを全部出す
  const rows = [];
  for (let page = 1; page <= 100; page++) {
    const result = await listMovements({ ...filters, page });
    rows.push(...result.rows);
    if (page >= result.pageCount || result.rows.length < MOVEMENTS_PER_PAGE) break;
  }

  return csvResponse(movementsToCsv(rows), `入出庫_${stamp}.csv`);
}

function csvResponse(body: string, filename: string): NextResponse {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movements.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
