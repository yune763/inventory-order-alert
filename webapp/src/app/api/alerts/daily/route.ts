import { NextResponse } from "next/server";
import { buildAlertText } from "@/lib/inventory/alert-text";
import { fmtDate, fmtQty, todayInTokyo } from "@/lib/inventory/format";
import { getSettings, listActionableItems } from "@/lib/inventory/queries";

/**
 * 日次アラート（優先度A・B）。
 *
 * スプレッドシート版の sendAlertMail + 毎朝8時のトリガーにあたる入口。
 * cron（Vercel Cron / Render Cron / GitHub Actions など）から
 *   GET /api/alerts/daily?token=...&send=1
 * を叩く想定。send を付けなければ本文を返すだけなので、まず中身だけ確認できる。
 *
 * 公開URLに置く以上、トークンが無い状態では動かさない（在庫と仕入先が丸ごと出るため）。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.ALERT_API_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "ALERT_API_TOKEN が設定されていないため、この入口は無効です。" },
      { status: 503 }
    );
  }
  const given = request.headers.get("x-alert-token") ?? url.searchParams.get("token") ?? "";
  if (!safeEqual(given, expected)) {
    return NextResponse.json({ error: "トークンが違います。" }, { status: 401 });
  }

  const [items, settings] = await Promise.all([listActionableItems(500), getSettings()]);
  const today = fmtDate(todayInTokyo());

  const lines = items.map((item) => {
    const { action } = buildAlertText(item, settings);
    return [
      `[${item.priority}] ${item.alert_type}`,
      `${item.code} ${item.name}`,
      `有効在庫 ${fmtQty(item.available_qty)} / 発注点 ${fmtQty(item.rop)}`,
      `推奨発注 ${fmtQty(item.order_qty, 0)} → ${item.supplier_name ?? "仕入先未設定"}`,
      action,
    ].join(" | ");
  });

  const subject = `【在庫アラート】要対応 ${items.length}件 ${today}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const body = `${lines.join("\n")}\n\n${appUrl}/items?priority=${encodeURIComponent("A:即日対応")}`;

  if (url.searchParams.get("send")) {
    const sent = await sendMail(subject, body);
    return NextResponse.json({ count: items.length, subject, sent });
  }

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ count: items.length, subject, items });
  }
  return new NextResponse(`${subject}\n\n${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** 長さの違いで早期に false を返さない比較（トークンの推測を助けないため） */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Resend でメールを送る（RESEND_API_KEY と ALERT_MAIL_TO を入れたときだけ動く）。
 * SDKは使わず REST を直接叩いている。この1箇所のために依存を増やさないため。
 */
async function sendMail(subject: string, body: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_MAIL_TO;
  const from = process.env.ALERT_MAIL_FROM;
  if (!apiKey || !to || !from) {
    return "未送信（RESEND_API_KEY / ALERT_MAIL_TO / ALERT_MAIL_FROM が未設定）";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, text: body }),
  });
  if (!response.ok) {
    return `送信失敗（${response.status} ${await response.text()}）`;
  }
  return "送信しました";
}
