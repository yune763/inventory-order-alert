import { parseCsv } from "./csv";
import { parseDateLike, parseNumberLike } from "./format";
import type { MovementKind, MovementRow } from "./types";
import { MOVEMENT_KIND_LABELS } from "./types";

/**
 * 入出庫CSVの読み書き。
 *
 * 販売管理や受発注システムから出した明細を、そのまま台帳に流し込むための入口。
 * 商品CSV（42列）とは別物なので、見出しも別に定義している。
 */
export const MOVEMENT_CSV_HEADERS = [
  "日付",
  "区分",
  "商品コード",
  "商品名",
  "数量",
  "出荷先",
  "入庫元",
  "伝票番号",
  "備考",
] as const;

/** 見出し名 → 内部キー。商品名は照合に使わない（人が読むためだけの列） */
const HEADER_KEYS: Record<string, string> = {
  日付: "moved_on",
  計上日: "moved_on",
  区分: "kind",
  入出庫区分: "kind",
  商品コード: "code",
  商品名: "item_name",
  数量: "quantity",
  出荷先: "destination",
  納品先: "destination",
  入庫元: "source",
  入荷元: "source",
  仕入元: "source",
  伝票番号: "slip_no",
  備考: "note",
};

const KIND_BY_LABEL: Record<string, MovementKind> = {
  入庫: "in",
  入荷: "in",
  受入: "in",
  in: "in",
  出庫: "out",
  出荷: "out",
  払出: "out",
  out: "out",
  調整: "adjust",
  棚卸調整: "adjust",
  adjust: "adjust",
};

export type MovementImportRow = {
  line: number;
  moved_on: string;
  kind: MovementKind;
  code: string;
  quantity: number;
  destination: string | null;
  source: string | null;
  slip_no: string | null;
  note: string | null;
};

export type MovementImportIssue = { line: number; message: string };

export type MovementParseResult = {
  rows: MovementImportRow[];
  errors: MovementImportIssue[];
  /** CSVに出てきた出荷先名（マスタ照合はDB側で行う） */
  destinationNames: string[];
  ignoredHeaders: string[];
  unrecognized: boolean;
};

function normalizeHeader(value: string): string {
  return value.normalize("NFKC").replace(/[\s　]/g, "").trim();
}

export function parseMovementCsv(text: string): MovementParseResult {
  const result: MovementParseResult = {
    rows: [],
    errors: [],
    destinationNames: [],
    ignoredHeaders: [],
    unrecognized: false,
  };

  const grid = parseCsv(text);
  if (grid.length === 0) {
    result.errors.push({ line: 0, message: "CSVが空です。" });
    return result;
  }

  const mapping = grid[0].map((header) => {
    const key = HEADER_KEYS[normalizeHeader(header)];
    if (!key && normalizeHeader(header) !== "") result.ignoredHeaders.push(normalizeHeader(header));
    return key ?? null;
  });

  for (const required of ["moved_on", "kind", "code", "quantity"]) {
    if (!mapping.includes(required)) {
      result.unrecognized = true;
    }
  }
  if (result.unrecognized) {
    result.errors.push({
      line: 1,
      message: "見出し行に「日付」「区分」「商品コード」「数量」が必要です。",
    });
    return result;
  }

  const names = new Set<string>();

  for (let r = 1; r < grid.length; r++) {
    const line = r + 1;
    const raw: Record<string, string> = {};
    mapping.forEach((key, i) => {
      if (key) raw[key] = (grid[r][i] ?? "").trim();
    });
    if (!raw.code && !raw.quantity && !raw.moved_on) continue; // 空行

    const problems: string[] = [];

    const movedOn = parseDateLike(raw.moved_on);
    if (!movedOn) problems.push(`日付「${raw.moved_on}」を読めません`);

    const kind = KIND_BY_LABEL[(raw.kind ?? "").normalize("NFKC").trim()];
    if (!kind) problems.push(`区分「${raw.kind}」は 入庫 / 出庫 / 調整 のいずれかにしてください`);

    if (!raw.code) problems.push("商品コードが空です");

    const quantity = parseNumberLike(raw.quantity);
    if (quantity === null) problems.push(`数量「${raw.quantity}」を読めません`);
    else if (quantity === 0) problems.push("数量に0は入れられません");
    else if (kind !== "adjust" && quantity < 0) {
      problems.push("入庫・出庫の数量はマイナスにできません（減らすときは区分を「調整」に）");
    }

    const destination = raw.destination || null;
    if (destination && kind !== "out") {
      problems.push("出荷先は出庫の行にだけ書けます");
    }
    const source = raw.source || null;
    if (source && kind !== "in") {
      problems.push("入庫元は入庫の行にだけ書けます");
    }

    if (problems.length > 0) {
      result.errors.push({ line, message: problems.join(" / ") });
      continue;
    }

    if (destination) names.add(destination);
    result.rows.push({
      line,
      moved_on: movedOn!,
      kind: kind!,
      code: raw.code,
      quantity: quantity!,
      destination,
      source,
      slip_no: raw.slip_no || null,
      note: raw.note || null,
    });
  }

  result.destinationNames = [...names];
  result.ignoredHeaders = [...new Set(result.ignoredHeaders)];
  return result;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function movementsToCsv(rows: MovementRow[]): string {
  const lines = [MOVEMENT_CSV_HEADERS.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.moved_on.slice(0, 10).replace(/-/g, "/"),
        MOVEMENT_KIND_LABELS[row.kind],
        row.item_code,
        row.item_name,
        String(row.quantity),
        row.destination_name ?? "",
        row.source_name ?? "",
        row.slip_no ?? "",
        row.note ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // BOM を付けないと Excel で開いたときに日本語が化ける
  return `﻿${lines.join("\r\n")}\r\n`;
}
