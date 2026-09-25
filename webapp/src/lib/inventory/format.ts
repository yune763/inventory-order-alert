/**
 * 表示・入出力の変換。
 *
 * 日付（date型）は Postgres から "YYYY-MM-DD" の文字列で来るので、Date に通さず
 * 文字列のまま扱う。Date を挟むとブラウザのタイムゾーン次第で1日ずれる。
 */

export function fmtDate(value: string | null | undefined, fallback = "未定"): string {
  if (!value) return fallback;
  return value.slice(0, 10).replace(/-/g, "/");
}

export function fmtDateTime(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(/-/g, "/");
}

export function fmtMoney(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

/** 数量。小数が無いときは整数で見せる（0.0 と出ると桁を読み違える） */
export function fmtQty(value: number | null | undefined, digits = 1, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const rounded = Number(value);
  if (Number.isInteger(rounded)) return rounded.toLocaleString("ja-JP");
  return rounded.toLocaleString("ja-JP", { maximumFractionDigits: digits });
}

/** アラート理由・推奨アクションの文中に埋める数値（桁区切りを入れない） */
export function plainNum(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/** CSV取込用。"¥1,200" や全角スペース混じりでも数値にする（GAS の toNumber_ と同じ） */
export function parseNumberLike(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[,¥￥\s　]/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** CSV取込用。yyyy/m/d・yyyy-mm-dd・yyyy年m月d日 を "YYYY-MM-DD" に揃える */
export function parseDateLike(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === "") return null;
  const m = s.match(/^(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})日?/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const yyyy = y.padStart(4, "0");
  const mm = mo.padStart(2, "0");
  const dd = d.padStart(2, "0");
  // 2月30日のような存在しない日付を弾く
  const probe = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(probe.getTime()) || probe.getUTCDate() !== Number(d)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** 運用地（日本）の今日。判定はDB側で出すが、画面の見出しなどで使う */
export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
