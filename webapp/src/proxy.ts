import { NextResponse, type NextRequest } from "next/server";

/**
 * URLを開いた時点で出す、ブラウザ標準のID・パスワード（Basic認証）。
 *
 * このアプリには画面内のログインが無い。公開URLに置くと、知っている人は誰でも
 * 在庫・仕入先・出荷先を見られるので、入口をここで塞ぐ。
 *
 * BASIC_AUTH_USER と BASIC_AUTH_PASSWORD の両方を入れたときだけ有効になる。
 * 手元で動かすときは未設定のままでよい（そのまま開ける）。
 */
export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !password) return NextResponse.next();

  // 死活監視と日次アラートは通す（後者は ALERT_API_TOKEN で別に守っている）
  const path = request.nextUrl.pathname;
  if (path === "/api/healthz" || path === "/api/alerts/daily") return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const index = decoded.indexOf(":");
    const givenUser = index < 0 ? "" : decoded.slice(0, index);
    const givenPassword = index < 0 ? "" : decoded.slice(index + 1);
    if (safeEqual(givenUser, user) && safeEqual(givenPassword, password)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("認証が必要です。", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted", charset="UTF-8"' },
  });
}

/** 文字数の違いで早く返さない比較（パスワードの推測を助けないため） */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = {
  // 画像やCSSなど、認証を通す必要が無いものは除く
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
