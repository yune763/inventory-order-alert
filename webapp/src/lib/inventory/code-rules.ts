import "server-only";
import { query } from "@/lib/db";
import type { CodeRule } from "./types";

/**
 * 採番ルールの読み取り。
 * 型と整形関数（formatCode）は画面側でも使うので types.ts に置いてある
 * （このファイルは server-only なのでクライアントから import できない）。
 */
export async function listCodeRules(): Promise<CodeRule[]> {
  return query<CodeRule>(
    `select id, category, prefix, separator, digits, next_number, is_active
       from inventory_code_rules
      order by (category is not null), category`
  );
}
