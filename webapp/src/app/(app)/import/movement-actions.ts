"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { parseMovementCsv, type MovementImportIssue } from "@/lib/inventory/movement-csv";

export type MovementImportPreview = {
  text: string;
  createDestinations: boolean;
  total: number;
  inCount: number;
  outCount: number;
  adjustCount: number;
  errors: MovementImportIssue[];
  unknownCodes: string[];
  unknownDestinations: string[];
  ignoredHeaders: string[];
  sample: {
    line: number;
    moved_on: string;
    kind: string;
    code: string;
    quantity: number;
    destination: string | null;
    source: string | null;
  }[];
};

export type MovementImportState = {
  error: string | null;
  preview?: MovementImportPreview;
  done?: { inserted: number; createdDestinations: number };
};

const CHUNK = 500;

async function readText(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) return await file.text();
  return String(formData.get("text") ?? "");
}

async function lookupCodes(codes: string[]): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map();
  const rows = await query<{ id: string; code: string }>(
    `select id, code from inventory_items where code = any($1::text[])`,
    [codes]
  );
  return new Map(rows.map((row) => [row.code, row.id]));
}

async function lookupDestinations(names: string[]): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();
  const rows = await query<{ id: string; name: string }>(
    `select id, name from inventory_destinations where name = any($1::text[])`,
    [names]
  );
  return new Map(rows.map((row) => [row.name, row.id]));
}

/** ① 取り込む前に中身を確かめる。この時点では何も書かない */
export async function analyzeMovementCsv(
  _prev: MovementImportState,
  formData: FormData
): Promise<MovementImportState> {
  const text = await readText(formData);
  const createDestinations = formData.get("createDestinations") === "on";
  if (!text.trim()) return { error: "CSVファイルを選ぶか、内容を貼り付けてください。" };

  const parsed = parseMovementCsv(text);
  if (parsed.unrecognized) return { error: parsed.errors.map((e) => e.message).join(" / ") };

  const [items, destinations] = await Promise.all([
    lookupCodes([...new Set(parsed.rows.map((r) => r.code))]),
    lookupDestinations(parsed.destinationNames),
  ]);

  const unknownCodes = [...new Set(parsed.rows.filter((r) => !items.has(r.code)).map((r) => r.code))];
  const unknownDestinations = parsed.destinationNames.filter((name) => !destinations.has(name));

  return {
    error: null,
    preview: {
      text,
      createDestinations,
      total: parsed.rows.length,
      inCount: parsed.rows.filter((r) => r.kind === "in").length,
      outCount: parsed.rows.filter((r) => r.kind === "out").length,
      adjustCount: parsed.rows.filter((r) => r.kind === "adjust").length,
      errors: parsed.errors,
      unknownCodes,
      unknownDestinations,
      ignoredHeaders: parsed.ignoredHeaders,
      sample: parsed.rows.slice(0, 20).map((r) => ({
        line: r.line,
        moved_on: r.moved_on,
        kind: r.kind,
        code: r.code,
        quantity: r.quantity,
        destination: r.destination,
        source: r.source,
      })),
    },
  };
}

/**
 * ② 台帳へ書き込む。
 *
 * 1行でも問題があれば1件も入れない。在庫を動かす台帳なので、
 * 「半分だけ入った」状態は理論在庫が合わなくなり、後から追うのが難しいため。
 */
export async function commitMovementCsv(
  _prev: MovementImportState,
  formData: FormData
): Promise<MovementImportState> {
  const text = String(formData.get("text") ?? "");
  const createDestinations = formData.get("createDestinations") === "on";
  if (!text.trim()) return { error: "取り込む内容がありません。もう一度やり直してください。" };

  const parsed = parseMovementCsv(text);
  if (parsed.errors.length > 0) {
    return { error: `読み取れない行が ${parsed.errors.length} 件あります。修正してから取り込んでください。` };
  }
  if (parsed.rows.length === 0) return { error: "取り込める行がありませんでした。" };

  const items = await lookupCodes([...new Set(parsed.rows.map((r) => r.code))]);
  const unknownCodes = [...new Set(parsed.rows.filter((r) => !items.has(r.code)).map((r) => r.code))];
  if (unknownCodes.length > 0) {
    return {
      error: `登録されていない商品コードがあります: ${unknownCodes.slice(0, 10).join("、")}${
        unknownCodes.length > 10 ? ` ほか${unknownCodes.length - 10}件` : ""
      }`,
    };
  }

  let destinations = await lookupDestinations(parsed.destinationNames);
  let createdDestinations = 0;
  const missing = parsed.destinationNames.filter((name) => !destinations.has(name));
  if (missing.length > 0) {
    if (!createDestinations) {
      return {
        error: `マスタに無い出荷先があります: ${missing.slice(0, 10).join("、")}。先に出荷先を登録するか、「無い出荷先を自動で追加する」にチェックしてください。`,
      };
    }
    const placeholders = missing.map((_, i) => `($${i + 1})`).join(", ");
    await query(
      `insert into inventory_destinations (name) values ${placeholders} on conflict (name) do nothing`,
      missing
    );
    createdDestinations = missing.length;
    destinations = await lookupDestinations(parsed.destinationNames);
  }

  for (let i = 0; i < parsed.rows.length; i += CHUNK) {
    const chunk = parsed.rows.slice(i, i + CHUNK);
    const params: unknown[] = [];
    const values = chunk.map((row) => {
      params.push(
        items.get(row.code),
        row.moved_on,
        row.kind,
        row.quantity,
        row.destination ? destinations.get(row.destination) ?? null : null,
        row.source,
        row.slip_no,
        row.note
      );
      const base = params.length - 8;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    });

    try {
      await query(
        `insert into inventory_movements
           (item_id, moved_on, kind, quantity, destination_id, source_name, slip_no, note)
         values ${values.join(", ")}`,
        params
      );
    } catch (error) {
      return {
        error: `${i + 1}件目以降の書き込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }（それ以前の行は取り込み済みです）`,
      };
    }
  }

  revalidatePath("/", "layout");
  return { error: null, done: { inserted: parsed.rows.length, createdDestinations } };
}
