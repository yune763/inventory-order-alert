"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { INPUT_COLUMNS } from "@/lib/inventory/columns";
import { formatCode, type CodeRule } from "@/lib/inventory/types";

export type FormState = { error: string | null };

/** 空文字を null に寄せる（フォームの未入力は「値なし」であって 0 ではない） */
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
/** 空文字を 0 に寄せる（在庫数・単価など、未入力なら 0 として扱う列） */
const emptyToZero = (v: unknown) => (typeof v === "string" && v.trim() === "" ? 0 : v);

const itemSchema = z.object({
  code: z.string().trim().min(1, "商品コードは必須です").max(64),
  name: z.string().trim().min(1, "商品名は必須です").max(255),
  status: z.preprocess(emptyToNull, z.string().trim().max(32).nullable()),
  category: z.preprocess(emptyToNull, z.string().trim().max(64).nullable()),
  spec: z.preprocess(emptyToNull, z.string().trim().max(128).nullable()),
  unit: z.preprocess(emptyToNull, z.string().trim().max(32).nullable()),
  location: z.preprocess(emptyToNull, z.string().trim().max(64).nullable()),
  supplier_code: z.preprocess(emptyToNull, z.string().trim().max(64).nullable()),
  supplier_name: z.preprocess(emptyToNull, z.string().trim().max(128).nullable()),
  cost: z.preprocess(emptyToZero, z.coerce.number().min(0, "仕入単価は0以上で入力してください")),
  price: z.preprocess(emptyToZero, z.coerce.number().min(0, "販売単価は0以上で入力してください")),
  lead_time_days: z.preprocess(emptyToZero, z.coerce.number().int().min(0, "リードタイムは0以上の整数です")),
  moq: z.preprocess(emptyToZero, z.coerce.number().min(0, "最小発注数は0以上です")),
  // ロットは「何個単位で発注するか」。0 だと丸めで割れなくなるため 1 を下限にする
  lot: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? 1 : v), z.coerce.number().positive("発注ロット単位は1以上です")),
  book_qty: z.preprocess(emptyToZero, z.coerce.number()),
  count_qty: z.preprocess(emptyToNull, z.coerce.number().nullable()),
  allocated_qty: z.preprocess(emptyToZero, z.coerce.number().min(0, "引当数は0以上です")),
  on_order_qty: z.preprocess(emptyToZero, z.coerce.number().min(0, "発注残数は0以上です")),
  eta: z.preprocess(emptyToNull, z.string().nullable()),
  out_qty_window: z.preprocess(emptyToZero, z.coerce.number().min(0, "期間出庫数は0以上です")),
  safety_days: z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullable()),
  last_in_date: z.preprocess(emptyToNull, z.string().nullable()),
  last_out_date: z.preprocess(emptyToNull, z.string().nullable()),
  last_count_date: z.preprocess(emptyToNull, z.string().nullable()),
  note: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable()),
});

function readForm(formData: FormData) {
  return Object.fromEntries(
    Object.keys(itemSchema.shape).map((key) => [key, formData.get(key) ?? ""])
  );
}

/** 保存する列。スプレッドシートの並び（columns.ts）をそのまま使う */
const INPUT_KEYS = INPUT_COLUMNS.map((c) => c.key);

export async function saveItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const parsed = itemSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const values = INPUT_KEYS.map((key) => (parsed.data as Record<string, unknown>)[key] ?? null);

  // redirect() は例外を投げて画面遷移を起こす仕組みなので、try の外で呼ぶ。
  // 中で呼ぶと catch が拾ってしまい、遷移がエラー表示に化ける。
  let createdId: string | null = null;
  try {
    if (id) {
      const assignments = INPUT_KEYS.map((key, i) => `${key} = $${i + 1}`).join(", ");
      await query(`update inventory_items set ${assignments} where id = $${INPUT_KEYS.length + 1}`, [
        ...values,
        id,
      ]);
    } else {
      const placeholders = INPUT_KEYS.map((_, i) => `$${i + 1}`).join(", ");
      const created = await queryOne<{ id: string }>(
        `insert into inventory_items (${INPUT_KEYS.join(", ")}) values (${placeholders}) returning id`,
        values
      );
      createdId = created?.id ?? null;
    }
  } catch (error) {
    return { error: describe(error) };
  }

  revalidatePath("/items");
  revalidatePath("/");
  if (createdId) redirect(`/items/${createdId}`);

  revalidatePath(`/items/${id}`);
  return { error: null };
}

/**
 * 対応状況だけを更新する。一覧の行から直接変えられるようにするため独立させている。
 * 「アラートは機械が出し、対応は人が決める」— この列だけは計算で上書きされない。
 */
export async function updateItemStatus(id: string, status: string | null): Promise<void> {
  await query(`update inventory_items set status = $1 where id = $2`, [status || null, id]);
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  revalidatePath("/");
}

export async function deleteItem(id: string): Promise<void> {
  await query(`delete from inventory_items where id = $1`, [id]);
  revalidatePath("/items");
  revalidatePath("/");
  redirect("/items");
}

function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("inventory_items_code_key") || message.includes("duplicate key")) {
    return "同じ商品コードが既に登録されています。商品コードは重複できません。";
  }
  return `保存に失敗しました: ${message}`;
}


/* ══════════════════════════════════════════════════════════════════
   品番（商品コード）の採番
   ══════════════════════════════════════════════════════════════════ */

export type CodeState = { code: string | null; error: string | null };

/**
 * 採番ルールに従って次の商品コードを発番する。
 *
 * 押した時点で番号を確保する（＝登録をやめると欠番になる）。
 * 確保せずに候補だけ見せると、二人が同時に登録したときに同じ番号が出るため。
 *
 * カテゴリ専用のルールがあればそれを、無ければ既定ルール（category is null）を使う。
 */
export async function generateItemCode(category: string | null): Promise<CodeState> {
  const target = (category ?? "").trim();

  const rules = await query<CodeRule>(
    `select id, category, prefix, separator, digits, next_number, is_active
       from inventory_code_rules
      where is_active and (category = $1 or category is null)
      order by (category is null)
      limit 1`,
    [target]
  );
  const rule = rules[0];
  if (!rule) {
    return { code: null, error: "採番ルールがありません。マスタ画面で追加してください。" };
  }

  // 取込済みのデータと番号がぶつかることがあるので、空いている番号まで進める
  for (let attempt = 0; attempt < 100; attempt++) {
    const reserved = await queryOne<{ used: number }>(
      `update inventory_code_rules
          set next_number = next_number + 1
        where id = $1
        returning next_number - 1 as used`,
      [rule.id]
    );
    if (!reserved) return { code: null, error: "採番ルールを更新できませんでした。" };

    const code = formatCode(rule, reserved.used);
    const exists = await queryOne<{ id: string }>(`select id from inventory_items where code = $1`, [code]);
    if (!exists) {
      revalidatePath("/masters");
      return { code, error: null };
    }
  }

  return { code: null, error: "空いている番号が見つかりませんでした。採番ルールの次の番号を見直してください。" };
}
