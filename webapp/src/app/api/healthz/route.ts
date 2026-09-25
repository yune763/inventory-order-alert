import { NextResponse } from "next/server";

/** 公開先（Render など）の死活監視用。DBには触らないので、DBが落ちていても200を返す */
export async function GET() {
  return NextResponse.json({ ok: true });
}
