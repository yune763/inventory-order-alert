"use server";

import { revalidatePath } from "next/cache";
import { csvToItems, type ImportIssue } from "@/lib/inventory/csv";
import { getMasterOptions } from "@/lib/inventory/queries";
import { query } from "@/lib/db";
import { INPUT_COLUMNS } from "@/lib/inventory/columns";

export type ImportPreview = {
  text: string;
  presentKeys: string[];
  creates: number;
  updates: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  ignoredHeaders: string[];
  sample: { code: string; name: string; kind: "新規" | "更新" }[];
};

export type ImportState = {
  error: string | null;
  preview?: ImportPreview;
  done?: { created: number; updated: number };
};

const CHUNK = 500;

/** 商品コードのうち、既にDBにあるものを返す */
async function findExistingCodes(codes: string[]): Promise<Set<string>> {
  if (codes.length === 0) return new Set();
  const rows = await query<{ code: string }>(
    `select code from inventory_items where code = any($1::text[])`,
    [codes]
  );
  return new Set(rows.map((row) => row.code));
}

async function readCsvText(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) return await file.text();
  return String(formData.get("text") ?? "");
}

async function masterLabels() {
  const masters = await getMasterOptions(true);
  return {
    status: masters.status.map((o) => o.label),
    category: masters.category.map((o) => o.label),
    unit: masters.unit.map((o) => o.label),
    location: masters.location.map((o) => o.label),
    supplier: masters.supplier.map((o) => o.label),
  };
}

/** ① 取り込む前に中身を確かめる。この時点ではDBに何も書かない */
export async function analyzeCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const text = await readCsvText(formData);
  if (!text.trim()) return { error: "CSVファイルを選ぶか、内容を貼り付けてください。" };

  const parsed = csvToItems(text, await masterLabels());
  if (parsed.unrecognized) {
    return { error: parsed.errors.map((e) => e.message).join(" / ") };
  }
  if (parsed.records.length === 0 && parsed.errors.length === 0) {
    return { error: "取り込める行がありませんでした。" };
  }

  const existing = await findExistingCodes(parsed.records.map((r) => r.code));
  const sample = parsed.records.slice(0, 20).map((r) => ({
    code: r.code,
    name: r.name,
    kind: (existing.has(r.code) ? "更新" : "新規") as "新規" | "更新",
  }));

  return {
    error: null,
    preview: {
      text,
      presentKeys: parsed.presentKeys,
      creates: parsed.records.filter((r) => !existing.has(r.code)).length,
      updates: parsed.records.filter((r) => existing.has(r.code)).length,
      errors: parsed.errors,
      warnings: parsed.warnings,
      ignoredHeaders: parsed.ignoredHeaders,
      sample,
    },
  };
}

/**
 * ② 実際に書き込む。
 *
 * CSVに載っていた列だけを更新する（載っていない列は今の値のまま）。
 * 「商品コード＋期間出庫数」だけの販売データを毎日流し込んでも、
 * 単価やリードタイムが 0 に戻らないようにするため。
 */
export async function commitCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const text = String(formData.get("text") ?? "");
  if (!text.trim()) return { error: "取り込む内容がありません。もう一度やり直してください。" };

  const parsed = csvToItems(text, await masterLabels());
  if (parsed.records.length === 0) {
    return { error: "取り込める行がありませんでした。" };
  }

  const existing = await findExistingCodes(parsed.records.map((r) => r.code));
  const created = parsed.records.filter((r) => !existing.has(r.code)).length;
  const updated = parsed.records.length - created;

  // CSVにあった列だけを書き込む。載っていない列は既存の値のまま残す。
  // on conflict do update で、insert に渡した列だけを更新対象にしている。
  const keys = INPUT_COLUMNS.map((c) => c.key).filter((key) => parsed.presentKeys.includes(key));
  const updatable = keys.filter((key) => key !== "code");
  // 商品コードしか無いCSVなら、既存行に対しては何もしない（新規行の追加だけ行う）
  const onConflict =
    updatable.length > 0
      ? `do update set ${updatable.map((key) => `${key} = excluded.${key}`).join(", ")}`
      : "do nothing";

  for (let i = 0; i < parsed.records.length; i += CHUNK) {
    const chunk = parsed.records.slice(i, i + CHUNK);
    const params: unknown[] = [];
    const rows = chunk.map((record) => {
      const placeholders = keys.map((key) => {
        params.push((record as Record<string, unknown>)[key] ?? null);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    try {
      await query(
        `insert into inventory_items (${keys.join(", ")}) values ${rows.join(", ")}
         on conflict (code) ${onConflict}`,
        params
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: `${i + 1}件目以降の書き込みに失敗しました: ${message}（それ以前の行は取り込み済みです）`,
      };
    }
  }

  revalidatePath("/", "layout");
  return { error: null, done: { created, updated } };
}
