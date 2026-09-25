#!/usr/bin/env python3
"""在庫・発注アラートの説明資料（HTML → PDF）を作る。

    python3 docs/build.py          # HTML を書き出す
    python3 docs/build.py --pdf    # 続けてヘッドレスChromeでPDFにする

内容ごとに別のPDFにしてある。1冊が厚いと読まれないので、
「知りたいことが載っている1冊だけ渡す」使い方を想定している。
"""

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# ── 共通の体裁（A4・印刷前提）────────────────────────────────
CSS = """
/* A4横向き。図が横長なので、縦より素直に収まる */
@page { size: A4 landscape; margin: 13mm 14mm; }
* { box-sizing: border-box; }
body {
  font-family: "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  color:#1e293b; font-size:10.1pt; line-height:1.68; margin:0;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}

/* ── 表紙 ───────────────────────────────────────────── */
.cover-page { break-after:page; height:184mm; display:flex; flex-direction:column; }
.cover-band { height:16mm; background:var(--accent); margin:-13mm -14mm 0; }
.cover-body { flex:1; display:flex; flex-direction:column; justify-content:center; padding:0 6mm; }
.cover-kind { font-size:10pt; color:var(--accent); font-weight:700; letter-spacing:.24em; }
.cover-title { font-size:34pt; font-weight:700; letter-spacing:.02em; margin:6px 0 10px; }
.cover-lead { font-size:13pt; color:#475569; margin:0 0 26px; }
.cover-for { display:inline-block; border:1px solid var(--accent); color:var(--accent);
             border-radius:4px; padding:4px 14px; font-size:10.5pt; font-weight:700; }
.cover-issues { display:flex; gap:10px; margin-top:30px; }
.cover-issues > div { flex:1; border:1px solid #e2e8f0; border-top:3px solid var(--accent);
                      border-radius:4px; padding:10px 12px; }
.cover-issues b { display:block; font-size:11pt; margin-bottom:2px; }
.cover-issues span { font-size:9pt; color:#64748b; line-height:1.6; }
.cover-foot { border-top:1px solid #e2e8f0; padding-top:8px; font-size:9pt; color:#94a3b8;
              display:flex; justify-content:space-between; }

/* ── 本文 ───────────────────────────────────────────── */
/* 本文は流し込み。見出しだけがページ末尾に残らないよう break-after:avoid を効かせ、
   区切りたいところには .pb（break-before:page）を置く。
   position:fixed の要素は使わない（2ページ目以降で見出しに重なるため） */
h2 { font-size:14.5pt; margin:22px 0 10px; padding:6px 0 6px 13px; break-after:avoid;
     border-left:5px solid var(--accent); background:linear-gradient(90deg,#f1f5f9,rgba(255,255,255,0)); }
h3 { font-size:11.2pt; margin:14px 0 6px; color:#0f172a; break-after:avoid; }
p { margin:0 0 8px; }
ul,ol { margin:0 0 11px; padding-left:1.3em; }
li { margin-bottom:3px; }

table { border-collapse:collapse; width:100%; margin:7px 0 12px; font-size:9.4pt; break-inside:avoid; }
th,td { border:1px solid #e2e8f0; padding:5px 8px; text-align:left; vertical-align:top; }
th { background:#f1f5f9; font-weight:700; color:#334155; }
td.c,th.c { text-align:center; } td.r,th.r { text-align:right; }
tbody tr:nth-child(even) { background:#fafbfc; }

code { font-family:"SF Mono",Menlo,monospace; font-size:9pt; background:#f1f5f9;
       padding:1px 5px; border-radius:3px; color:#0f172a; }
pre { background:#0f172a; color:#e2e8f0; padding:12px 15px; border-radius:5px; break-inside:avoid;
      font-family:"SF Mono",Menlo,monospace; font-size:9pt; line-height:1.7; margin:8px 0 15px;
      white-space:pre-wrap; }

.note { border:1px solid #fcd34d; background:#fffbeb; border-left:4px solid #f59e0b;
        padding:9px 13px; margin:10px 0; font-size:9.6pt; break-inside:avoid; }
.note b { color:#92400e; }
.tip  { border:1px solid #bae6fd; background:#f0f9ff; border-left:4px solid #0284c7;
        padding:9px 13px; margin:10px 0; font-size:9.6pt; break-inside:avoid; }
.warn { border:1px solid #fecaca; background:#fef2f2; border-left:4px solid #dc2626;
        padding:9px 13px; margin:10px 0; font-size:9.6pt; break-inside:avoid; }

/* 図は本文より狭く置く。横向きの紙幅いっぱいに広げると、図の中の字だけ大きくなりすぎる */
.fig { margin:12px 0 14px; break-inside:avoid; }
.fig svg { display:block; width:100%; max-width:200mm; height:auto; margin:0 auto; }
.caption { font-size:9pt; color:#64748b; margin-top:6px; max-width:200mm; }
.caption b { color:#334155; }

.pb { break-before:page; }
.cover-page + h2, .pb + h2 { margin-top:0; }
.badge { display:inline-block; border-radius:3px; padding:1px 6px; font-size:9pt; font-weight:700; }
.steps { counter-reset:step; list-style:none; padding:0; margin:10px 0 15px; }
.steps > li { counter-increment:step; position:relative; padding-left:31px; margin-bottom:7px; }
.steps > li::before {
  content:counter(step); position:absolute; left:0; top:2px;
  width:21px; height:21px; border-radius:50%; background:var(--accent); color:#fff;
  font-size:9.5pt; font-weight:700; text-align:center; line-height:21px;
}
"""


ALERT_COLORS = {
    "欠品": ("#b71c1c", "#ffffff"),
    "発注漏れ": ("#d32f2f", "#ffffff"),
    "欠品リスク": ("#ef6c00", "#ffffff"),
    "入荷遅延": ("#7b1fa2", "#ffffff"),
    "発注推奨": ("#f9a825", "#000000"),
    "過剰在庫": ("#0277bd", "#ffffff"),
    "滞留在庫": ("#455a64", "#ffffff"),
    "棚卸差異": ("#5d4037", "#ffffff"),
    "正常": ("#e8f5e9", "#1b5e20"),
}


def badge(label: str) -> str:
    bg, fg = ALERT_COLORS[label]
    return f'<span class="badge" style="background:{bg};color:{fg}">{label}</span>'


def document(number: str, title: str, lead: str, accent: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<title>在庫・発注アラート {number} {title}</title>
<style>:root {{ --accent: {accent}; }}{CSS}</style>
</head><body>
{body}
</body></html>
"""


ISSUES = [
    ("欠品", "気づいたときには在庫が無い"),
    ("発注漏れ", "発注したつもりが抜けていた"),
    ("過剰在庫", "置き場と資金が寝ている"),
    ("在庫精度", "帳簿と現物が合わない"),
]


def cover(number: str, title: str, lead: str, reader: str = "") -> str:
    """表紙（1ページ目まるごと）。中身は次のページから始まる。"""
    issues = "".join(f"<div><b>{name}</b><span>{desc}</span></div>" for name, desc in ISSUES)
    return f"""<div class="cover-page">
  <div class="cover-band"></div>
  <div class="cover-body">
    <div class="cover-kind">在庫・発注アラート　{number}</div>
    <div class="cover-title">{title}</div>
    <p class="cover-lead">{lead}</p>
    <div><span class="cover-for">{reader}</span></div>
    <div class="cover-issues">{issues}</div>
  </div>
  <div class="cover-foot">
    <span>在庫数と出荷実績から、いつ・何を・いくつ発注すべきかを自動で判定するシステム</span>
    <span>{title}</span>
  </div>
</div>"""


DOCS: list[tuple[str, str, str, str, str, str]] = []


def add(number: str, filename: str, title: str, lead: str, accent: str, body: str) -> None:
    DOCS.append((number, filename, title, lead, accent, body))


def build() -> None:
    from content import build_docs  # 内容は content.py 側に分けてある

    build_docs(add, cover, badge)
    for number, filename, title, lead, accent, body in DOCS:
        path = HERE / f"{filename}.html"
        path.write_text(document(number, title, lead, accent, body), encoding="utf-8")
        print("HTML:", path.name)

    if "--pdf" in sys.argv:
        for _, filename, *_ in DOCS:
            html = HERE / f"{filename}.html"
            pdf = HERE / f"{filename}.pdf"
            subprocess.run(
                [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                 f"--print-to-pdf={pdf}", f"file://{html}"],
                check=True, capture_output=True,
            )
            print("PDF :", pdf.name, f"{pdf.stat().st_size // 1024} KB")


if __name__ == "__main__":
    build()
