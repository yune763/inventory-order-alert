"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";
import { MOVEMENT_KINDS } from "@/lib/inventory/types";

export type FormState = { error: string | null; ok?: string };

const toText = (v: unknown) => (typeof v === "string" ? v : "");

const movementSchema = z
  .object({
    // 未選択・未入力は null で届くので、文字列に寄せてから検証する
    // （そのまま渡すと「expected string, received null」という生のメッセージが画面に出る）
    item_id: z.preprocess(toText, z.string().uuid("商品を選んでください")),
    moved_on: z.preprocess(toText, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください")),
    kind: z.preprocess(toText, z.enum(MOVEMENT_KINDS, { error: "区分を選んでください" })),
    // 空欄は 0 ではなく「未入力」として扱う（0 に寄せると別のエラー文が2本出て読みにくい）
    quantity: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.coerce.number({ error: "数量を入力してください" }).refine((n) => n !== 0, "数量に0は入れられません")
    ),
    destination_id: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().uuid().nullable()
    ),
    source_name: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().trim().max(128).nullable()
    ),
    slip_no: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().max(64).nullable()),
    note: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().max(500).nullable()),
  })
  // 入庫・出庫は「何個動いたか」。マイナスを書きたくなる場面は区分の選び間違いなので弾く
  .refine((v) => v.kind === "adjust" || v.quantity > 0, {
    message: "入庫・出庫の数量は1以上で入力してください（減らすときは区分を「調整」にします）",
    path: ["quantity"],
  });

export async function createMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = movementSchema.safeParse({
    item_id: formData.get("item_id") ?? "",
    moved_on: formData.get("moved_on") ?? "",
    kind: formData.get("kind") ?? "",
    quantity: formData.get("quantity") ?? "",
    destination_id: formData.get("destination_id") ?? "",
    source_name: formData.get("source_name") ?? "",
    slip_no: formData.get("slip_no") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const { item_id, moved_on, kind, quantity, slip_no, note } = parsed.data;
  // 出荷先は出庫、入庫元は入庫のときだけ記録する（DB側にも同じ制約がある）
  const destination_id = kind === "out" ? parsed.data.destination_id : null;
  const source_name = kind === "in" ? parsed.data.source_name : null;

  try {
    await query(
      `insert into inventory_movements
         (item_id, moved_on, kind, quantity, destination_id, source_name, slip_no, note)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [item_id, moved_on, kind, quantity, destination_id, source_name, slip_no, note]
    );
  } catch (error) {
    return { error: `登録できませんでした: ${error instanceof Error ? error.message : String(error)}` };
  }

  // 理論在庫はトリガーが動かしているので、判定に関わる画面をまとめて作り直す
  revalidatePath("/", "layout");
  return { error: null, ok: "登録しました" };
}

/** 入出庫の取り消し。理論在庫はトリガーが元に戻す */
export async function deleteMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "削除対象が指定されていません。" };

  await query(`delete from inventory_movements where id = $1`, [id]);
  revalidatePath("/", "layout");
  return { error: null, ok: "取り消しました" };
}
