import { COLUMNS, INPUT_COLUMNS } from "./columns";
import { buildAlertText } from "./alert-text";
import { fmtDate, fmtDateTime, parseDateLike, parseNumberLike } from "./format";
import type { EvaluatedItem, ItemInput, Settings } from "./types";

/* ══════════════════════════════════════════════════════════════════
   書き出し（スプレッドシートの1行目と同じ42列を、同じ並びで出す）
   ══════════════════════════════════════════════════════════════════ */

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function itemsToCsv(items: EvaluatedItem[], settings: Settings): string {
  const header = COLUMNS.map((c) => c.csvHeader);
  const lines = [header.map(csvCell).join(",")];

  for (const item of items) {
    const { reason, action } = buildAlertText(item, settings);
    const row = COLUMNS.map((column) => {
      if (column.key === "reason") return reason;
      if (column.key === "action") return action;
      // 入出庫台帳がある商品は、判定に使った値のほうを書き出す
      if (column.key === "out_qty_window") return String(item.out_qty_effective);
      if (column.key === "last_in_date") return fmtDate(item.last_in_effective, "");
      if (column.key === "last_out_date") return fmtDate(item.last_out_effective, "");

      const value = (item as unknown as Record<string, unknown>)[column.key];
      if (value === null || value === undefined) return "";
      if (column.type === "date") return fmtDate(String(value), "");
      if (column.type === "datetime") return fmtDateTime(String(value), "");
      return String(value);
    });
    lines.push(row.map(csvCell).join(","));
  }

  // BOM を付けないと Excel で開いたときに日本語が化ける
  return `﻿${lines.join("\r\n")}\r\n`;
}

/* ══════════════════════════════════════════════════════════════════
   取込（旧スプレッドシートからの移行と、日々の販売データ取込に使う）
   ══════════════════════════════════════════════════════════════════ */

/**
 * 区切り文字を推測する。
 * スプレッドシートの範囲をコピーして貼り付けるとタブ区切りになるため、
 * ファイル（カンマ）と貼り付け（タブ）の両方をそのまま受け取れるようにする。
 */
function detectDelimiter(text: string): "," | "\t" {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

/** RFC4180 のCSV/TSVを配列にする。引用符内の改行・区切り文字・""（エスケープ）に対応する */
export function parseCsv(text: string, delimiter?: "," | "\t"): string[][] {
  const src = text.replace(/^﻿/, "");
  const sep = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\r") {
      // CRLF の CR は読み飛ばす
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** 全角・半角や空白の揺れを吸収して見出しを突き合わせる */
function normalizeHeader(value: string): string {
  return value.normalize("NFKC").replace(/[\s　]/g, "").trim();
}

export type ImportIssue = { line: number; code: string; message: string };

/** エラー文に出す名前。内部のキー名ではなく、CSVの見出しで伝える */
const HEADER_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c.csvHeader]));
const headerName = (key: string) => HEADER_BY_KEY.get(key) ?? key;

export type ImportResult = {
  /** 取込できた行（商品コードで名寄せ済み） */
  records: ItemInput[];
  /** 取込を止める問題。この行は records に入らない */
  errors: ImportIssue[];
  /** 取り込むが、確認してほしい問題（マスタに無い値など） */
  warnings: ImportIssue[];
  /** CSVの見出しに実際にあった入力列のキー。既存商品はこの列だけを更新する */
  presentKeys: string[];
  /** 見出しに無く読み飛ばした列 */
  ignoredHeaders: string[];
  /** 見出しが1つも一致しなかったときに立つ */
  unrecognized: boolean;
};

type MasterLabels = {
  status: string[];
  category: string[];
  unit: string[];
  location: string[];
  supplier: string[];
};

/**
 * CSVを取込用のレコードに変換する。
 *
 * 自動計算列（有効在庫・発注点・アラート区分など）が入っていても読み飛ばす。
 * 旧シートのCSVをそのまま渡せるようにするため、余計な列でエラーにしない。
 * マスタに無い値は警告どまりにする（取込自体を止めると移行が進まない）。
 */
export function csvToItems(text: string, masters: MasterLabels): ImportResult {
  const rows = parseCsv(text);
  const result: ImportResult = {
    records: [],
    errors: [],
    warnings: [],
    presentKeys: [],
    ignoredHeaders: [],
    unrecognized: false,
  };
  if (rows.length === 0) {
    result.errors.push({ line: 0, code: "", message: "CSVが空です。" });
    return result;
  }

  // 見出し → 列定義の対応を作る
  const headerRow = rows[0].map(normalizeHeader);
  const inputByHeader = new Map(INPUT_COLUMNS.map((c) => [normalizeHeader(c.csvHeader), c]));
  const autoHeaders = new Set(
    COLUMNS.filter((c) => c.source === "auto").map((c) => normalizeHeader(c.csvHeader))
  );

  const mapping: ({ key: string; type: string } | null)[] = headerRow.map((header) => {
    const column = inputByHeader.get(header);
    if (column) return { key: column.key, type: column.type };
    // 「期間出庫数(直近30日)」は集計期間を変えると見出しも変わるので前方一致で拾う
    if (header.startsWith("期間出庫数")) return { key: "out_qty_window", type: "number" };
    if (header.startsWith("安全在庫日数")) return { key: "safety_days", type: "int" };
    if (!autoHeaders.has(header) && header !== "") result.ignoredHeaders.push(header);
    return null;
  });

  const mapped = mapping.filter(Boolean) as { key: string; type: string }[];
  result.presentKeys = [...new Set(mapped.map((m) => m.key))];
  if (!mapped.some((m) => m.key === "code") || !mapped.some((m) => m.key === "name")) {
    result.unrecognized = true;
    result.errors.push({
      line: 1,
      code: "",
      message:
        "見出し行に「商品コード」と「商品名」が見つかりません。1行目が見出しのCSVを指定してください。",
    });
    return result;
  }

  const seen = new Map<string, number>();

  for (let r = 1; r < rows.length; r++) {
    const line = r + 1; // 画面に出す行番号は1始まり（見出しが1行目）
    const cells = rows[r];
    const raw: Record<string, string> = {};
    mapping.forEach((m, i) => {
      if (m) raw[m.key] = (cells[i] ?? "").trim();
    });

    const code = raw.code ?? "";
    const name = raw.name ?? "";
    if (!code && !name) continue; // 空行

    const rowErrors: string[] = [];
    if (!code) rowErrors.push("商品コードが空です");
    if (!name) rowErrors.push("商品名が空です");

    const num = (key: string, fallback: number | null): number | null => {
      const text = raw[key];
      if (text === undefined || text === "") return fallback;
      const parsed = parseNumberLike(text);
      if (parsed === null) {
        rowErrors.push(`${headerName(key)} の数値「${text}」を読めません`);
        return fallback;
      }
      return parsed;
    };
    const date = (key: string): string | null => {
      const text = raw[key];
      if (!text) return null;
      const parsed = parseDateLike(text);
      if (parsed === null) rowErrors.push(`${headerName(key)} の日付「${text}」を読めません`);
      return parsed;
    };
    const str = (key: string): string | null => (raw[key] ? raw[key] : null);

    const record: ItemInput = {
      status: str("status"),
      code,
      name,
      category: str("category"),
      spec: str("spec"),
      unit: str("unit"),
      location: str("location"),
      supplier_code: str("supplier_code"),
      supplier_name: str("supplier_name"),
      cost: num("cost", 0) ?? 0,
      price: num("price", 0) ?? 0,
      lead_time_days: Math.round(num("lead_time_days", 0) ?? 0),
      moq: num("moq", 0) ?? 0,
      // ロットは 0 や空欄だと「1個単位」の意味なので 1 に寄せる（0 だと丸めで割れなくなる）
      lot: (() => {
        const v = num("lot", 1) ?? 1;
        return v > 0 ? v : 1;
      })(),
      book_qty: num("book_qty", 0) ?? 0,
      count_qty: raw.count_qty ? num("count_qty", null) : null,
      allocated_qty: num("allocated_qty", 0) ?? 0,
      on_order_qty: num("on_order_qty", 0) ?? 0,
      eta: date("eta"),
      out_qty_window: num("out_qty_window", 0) ?? 0,
      safety_days: raw.safety_days ? Math.round(num("safety_days", 0) ?? 0) : null,
      last_in_date: date("last_in_date"),
      last_out_date: date("last_out_date"),
      last_count_date: date("last_count_date"),
      note: str("note"),
    };

    for (const [key, label] of [
      ["cost", "仕入単価"],
      ["price", "販売単価"],
      ["moq", "最小発注数(MOQ)"],
      ["book_qty", "理論在庫数"],
      ["allocated_qty", "引当数(受注残)"],
      ["on_order_qty", "発注残数(入荷予定)"],
      ["out_qty_window", "期間出庫数"],
    ] as const) {
      const value = record[key] as number;
      if (value < 0) rowErrors.push(`${label} が負の数です`);
    }

    const duplicatedAt = seen.get(code);
    if (duplicatedAt) {
      rowErrors.push(`商品コードが ${duplicatedAt} 行目と重複しています`);
    }

    if (rowErrors.length > 0) {
      result.errors.push({ line, code, message: rowErrors.join(" / ") });
      continue;
    }

    seen.set(code, line);

    // マスタに無い値は取り込んだうえで知らせる（対応状況だけは表記ゆれが致命的なので強めに出す）
    const checkMaster = (value: string | null, list: string[], label: string) => {
      if (value && !list.includes(value)) {
        result.warnings.push({ line, code, message: `${label}「${value}」はマスタにありません` });
      }
    };
    checkMaster(record.status, masters.status, "対応状況");
    checkMaster(record.category, masters.category, "カテゴリ");
    checkMaster(record.unit, masters.unit, "単位");
    checkMaster(record.location, masters.location, "保管場所");
    checkMaster(record.supplier_name, masters.supplier, "仕入先名");

    result.records.push(record);
  }

  result.ignoredHeaders = [...new Set(result.ignoredHeaders)];
  return result;
}
