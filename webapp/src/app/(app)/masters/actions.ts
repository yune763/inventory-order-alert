"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { MASTER_KINDS, type MasterKind } from "@/lib/inventory/types";

export type FormState = { error: string | null; ok?: string };

/** マスタの kind と、商品側のどの列に入るか。使用中チェックに使う */
const ITEM_COLUMN: Record<MasterKind, string> = {
  status: "status",
  category: "category",
  unit: "unit",
  location: "location",
  supplier: "supplier_name",
};

const optionSchema = z.object({
  kind: z.enum(MASTER_KINDS),
  label: z.string().trim().min(1, "選択肢の名前を入力してください").max(64),
  code: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(64).nullable()),
  color: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().regex(/^#[0-9a-fA-F]{6}$/, "色は #rrggbb 形式で指定してください").nullable()
  ),
  sort_order: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? 0 : v), z.coerce.number().int()),
});

export async function createMasterOption(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = optionSchema.safeParse({
    kind: formData.get("kind"),
    label: formData.get("label"),
    code: formData.get("code") ?? "",
    color: formData.get("color") ?? "",
    sort_order: formData.get("sort_order") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const { kind, label, code, color, sort_order } = parsed.data;
  try {
    await query(
      `insert into inventory_master_options (kind, label, code, color, sort_order)
       values ($1, $2, $3, $4, $5)`,
      [kind, label, code, color, sort_order]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("inventory_master_options_kind_label_key") || message.includes("duplicate key")) {
      return { error: "同じ名前の選択肢が既にあります。" };
    }
    return { error: `追加できませんでした: ${message}` };
  }

  // 仕入先・保管場所・出荷先は専用ページと商品編集の候補にも出るので、まとめて作り直す
  revalidatePath("/", "layout");
  return { error: null, ok: "追加しました" };
}

export async function updateMasterOption(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "更新対象が指定されていません。" };

  const parsed = optionSchema.omit({ kind: true }).safeParse({
    label: formData.get("label"),
    code: formData.get("code") ?? "",
    color: formData.get("color") ?? "",
    sort_order: formData.get("sort_order") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const { label, code, color, sort_order } = parsed.data;
  try {
    await query(
      `update inventory_master_options
          set label = $1, code = $2, color = $3, sort_order = $4, is_active = $5
        where id = $6`,
      [label, code, color, sort_order, formData.get("is_active") === "on", id]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("inventory_master_options_kind_label_key") || message.includes("duplicate key")) {
      return { error: "同じ名前の選択肢が既にあります。" };
    }
    return { error: `更新できませんでした: ${message}` };
  }

  // 仕入先・保管場所・出荷先は専用ページと商品編集の候補にも出るので、まとめて作り直す
  revalidatePath("/", "layout");
  return { error: null, ok: "保存しました" };
}

/**
 * 選択肢を削除する。
 * 既に商品で使われている値は消さない（消すと、その商品の値だけがマスタ外の
 * 宙に浮いた文字列として残る）。使わなくなった選択肢は「表示しない」にする。
 */
export async function deleteMasterOption(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "") as MasterKind;
  const label = String(formData.get("label") ?? "");
  if (!id || !MASTER_KINDS.includes(kind)) return { error: "削除対象が指定されていません。" };

  const used = await queryOne<{ n: number }>(
    `select count(*)::int as n from inventory_items where ${ITEM_COLUMN[kind]} = $1`,
    [label]
  );
  if ((used?.n ?? 0) > 0) {
    return {
      error: `「${label}」は ${used?.n} 件の商品で使われているため削除できません。使わないなら「非表示」に切り替えてください。`,
    };
  }

  await query(`delete from inventory_master_options where id = $1`, [id]);

  // 仕入先・保管場所・出荷先は専用ページと商品編集の候補にも出るので、まとめて作り直す
  revalidatePath("/", "layout");
  return { error: null, ok: "削除しました" };
}

/* ══════════════════════════════════════════════════════════════════
   出荷先（inventory_destinations）
   仕入先と違い住所・担当者を持たせたいので、専用のテーブル・フォームにしてある。
   ══════════════════════════════════════════════════════════════════ */

const nullable = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(max).nullable());

const destinationSchema = z.object({
  name: z.string().trim().min(1, "出荷先名を入力してください").max(128),
  code: nullable(64),
  kind: nullable(32),
  address: nullable(255),
  contact: nullable(64),
  phone: nullable(32),
  note: nullable(500),
  sort_order: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? 0 : v), z.coerce.number().int()),
});

function readDestination(formData: FormData) {
  return {
    name: formData.get("name"),
    code: formData.get("code") ?? "",
    kind: formData.get("kind") ?? "",
    address: formData.get("address") ?? "",
    contact: formData.get("contact") ?? "",
    phone: formData.get("phone") ?? "",
    note: formData.get("note") ?? "",
    sort_order: formData.get("sort_order") ?? "",
  };
}

function describeDestinationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("inventory_destinations_name_key")) return "同じ名前の出荷先が既にあります。";
  if (message.includes("inventory_destinations_code_key")) return "同じ出荷先コードが既にあります。";
  return message;
}

export async function createDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = destinationSchema.safeParse(readDestination(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const d = parsed.data;
  try {
    await query(
      `insert into inventory_destinations (name, code, kind, address, contact, phone, note, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [d.name, d.code, d.kind, d.address, d.contact, d.phone, d.note, d.sort_order]
    );
  } catch (error) {
    return { error: `追加できませんでした: ${describeDestinationError(error)}` };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: "追加しました" };
}

export async function updateDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "更新対象が指定されていません。" };

  const parsed = destinationSchema.safeParse(readDestination(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const d = parsed.data;
  try {
    await query(
      `update inventory_destinations
          set name = $1, code = $2, kind = $3, address = $4, contact = $5,
              phone = $6, note = $7, sort_order = $8, is_active = $9
        where id = $10`,
      [
        d.name, d.code, d.kind, d.address, d.contact, d.phone, d.note, d.sort_order,
        formData.get("is_active") === "on",
        id,
      ]
    );
  } catch (error) {
    return { error: `更新できませんでした: ${describeDestinationError(error)}` };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: "保存しました" };
}

/**
 * 出荷先を削除する。
 * 出庫実績が1件でもあれば消さない（消すと、その出庫がどこへ行ったのか分からなくなる）。
 */
export async function deleteDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!id) return { error: "削除対象が指定されていません。" };

  const used = await queryOne<{ n: number }>(
    `select count(*)::int as n from inventory_movements where destination_id = $1`,
    [id]
  );
  if ((used?.n ?? 0) > 0) {
    return {
      error: `「${name}」には ${used?.n} 件の出庫実績があるため削除できません。使わないなら「非表示」に切り替えてください。`,
    };
  }

  await query(`delete from inventory_destinations where id = $1`, [id]);
  revalidatePath("/", "layout");
  return { error: null, ok: "削除しました" };
}

/* ══════════════════════════════════════════════════════════════════
   品番（商品コード）の採番ルール
   ══════════════════════════════════════════════════════════════════ */

const codeRuleSchema = z.object({
  // 空欄＝既定ルール（そのカテゴリ専用のルールが無いときに使われる）
  category: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(64).nullable()
  ),
  prefix: z.string().trim().min(1, "接頭辞を入力してください").max(16),
  separator: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(4)),
  digits: z.coerce.number().int().min(1, "桁数は1〜10です").max(10, "桁数は1〜10です"),
  next_number: z.coerce.number().int().min(0, "次の番号は0以上です"),
});

function readCodeRule(formData: FormData) {
  return {
    category: formData.get("category") ?? "",
    prefix: formData.get("prefix"),
    separator: formData.get("separator") ?? "",
    digits: formData.get("digits"),
    next_number: formData.get("next_number"),
  };
}

export async function createCodeRule(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = codeRuleSchema.safeParse(readCodeRule(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const r = parsed.data;
  try {
    await query(
      `insert into inventory_code_rules (category, prefix, separator, digits, next_number)
       values ($1, $2, $3, $4, $5)`,
      [r.category, r.prefix, r.separator, r.digits, r.next_number]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("inventory_code_rules_category_key") || message.includes("duplicate key")) {
      return { error: "そのカテゴリの採番ルールは既にあります（1カテゴリにつき1本）。" };
    }
    return { error: `追加できませんでした: ${message}` };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: "追加しました" };
}

export async function updateCodeRule(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "更新対象が指定されていません。" };

  const parsed = codeRuleSchema.safeParse(readCodeRule(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" / ") };

  const r = parsed.data;
  try {
    await query(
      `update inventory_code_rules
          set category = $1, prefix = $2, separator = $3, digits = $4, next_number = $5, is_active = $6
        where id = $7`,
      [r.category, r.prefix, r.separator, r.digits, r.next_number, formData.get("is_active") === "on", id]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("inventory_code_rules_category_key") || message.includes("duplicate key")) {
      return { error: "そのカテゴリの採番ルールは既にあります（1カテゴリにつき1本）。" };
    }
    return { error: `更新できませんでした: ${message}` };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: "保存しました" };
}

export async function deleteCodeRule(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "削除対象が指定されていません。" };

  await query(`delete from inventory_code_rules where id = $1`, [id]);
  revalidatePath("/", "layout");
  return { error: null, ok: "削除しました" };
}
