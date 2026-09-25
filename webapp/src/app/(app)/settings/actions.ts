"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";

export type FormState = { error: string | null; ok?: string };

// GAS の CONFIG にあたる値。1つ動かすと全商品の判定が変わるので、範囲を絞っておく。
const settingsSchema = z.object({
  demand_window_days: z.coerce.number().int().min(1).max(365),
  default_safety_days: z.coerce.number().int().min(0).max(365),
  order_cycle_days: z.coerce.number().int().min(0).max(365),
  dead_stock_days: z.coerce.number().int().min(1).max(3650),
  count_diff_tolerance: z.coerce.number().min(0),
});

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = settingsSchema.safeParse({
    demand_window_days: formData.get("demand_window_days"),
    default_safety_days: formData.get("default_safety_days"),
    order_cycle_days: formData.get("order_cycle_days"),
    dead_stock_days: formData.get("dead_stock_days"),
    count_diff_tolerance: formData.get("count_diff_tolerance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" / ") };
  }

  const { demand_window_days, default_safety_days, order_cycle_days, dead_stock_days, count_diff_tolerance } =
    parsed.data;
  try {
    await query(
      `update inventory_settings
          set demand_window_days = $1, default_safety_days = $2, order_cycle_days = $3,
              dead_stock_days = $4, count_diff_tolerance = $5
        where id = 1`,
      [demand_window_days, default_safety_days, order_cycle_days, dead_stock_days, count_diff_tolerance]
    );
  } catch (error) {
    return { error: `保存できませんでした: ${error instanceof Error ? error.message : String(error)}` };
  }

  // 判定はこの値を使って毎回計算するので、全画面を作り直す
  revalidatePath("/", "layout");
  return { error: null, ok: "保存しました。全商品の判定に即反映されます。" };
}
