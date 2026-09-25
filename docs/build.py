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
@page { size: A4; margin: 14mm 13mm 15mm; }
* { box-sizing: border-box; }
body {
  font-family: "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  color:#1e293b; font-size:10.2pt; line-height:1.75; margin:0;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.page { page-break-after:always; }
.page:last-child { page-break-after:auto; }

.cover { border-top:6px solid var(--accent); padding-top:14px; margin-bottom:18px; }
.eyebrow { font-size:9pt; color:var(--accent); font-weight:700; letter-spacing:.08em; }
h1 { font-size:20pt; margin:2px 0 6px; letter-spacing:.01em; }
.lead { color:#475569; font-size:10.5pt; margin:0 0 4px; }
.meta { margin-top:10px; font-size:8.6pt; color:#94a3b8; }

h2 { font-size:13.5pt; margin:22px 0 10px; padding:6px 0 6px 12px;
     border-left:5px solid var(--accent); background:linear-gradient(90deg,#f1f5f9,rgba(255,255,255,0)); }
.page > h2:first-child { margin-top:0; }
h3 { font-size:11pt; margin:16px 0 6px; color:#0f172a; }
p { margin:0 0 9px; }
ul,ol { margin:0 0 10px; padding-left:1.3em; }
li { margin-bottom:3px; }

table { border-collapse:collapse; width:100%; margin:8px 0 14px; font-size:9.1pt; }
th,td { border:1px solid #e2e8f0; padding:5px 8px; text-align:left; vertical-align:top; }
th { background:#f1f5f9; font-weight:700; color:#334155; }
td.c,th.c { text-align:center; } td.r,th.r { text-align:right; }
tbody tr:nth-child(even) { background:#fafbfc; }

code { font-family:"SF Mono",Menlo,monospace; font-size:8.8pt; background:#f1f5f9;
       padding:1px 5px; border-radius:3px; color:#0f172a; }
pre { background:#0f172a; color:#e2e8f0; padding:10px 13px; border-radius:5px;
      font-family:"SF Mono",Menlo,monospace; font-size:8.6pt; line-height:1.65; overflow:hidden;
      margin:8px 0 14px; white-space:pre-wrap; }

.note { border:1px solid #fcd34d; background:#fffbeb; border-left:4px solid #f59e0b;
        padding:9px 13px; margin:12px 0; font-size:9.3pt; }
.note b { color:#92400e; }
.tip  { border:1px solid #bae6fd; background:#f0f9ff; border-left:4px solid #0284c7;
        padding:9px 13px; margin:12px 0; font-size:9.3pt; }
.warn { border:1px solid #fecaca; background:#fef2f2; border-left:4px solid #dc2626;
        padding:9px 13px; margin:12px 0; font-size:9.3pt; }

.fig { margin:14px 0 18px; }
.fig svg { width:100%; height:auto; display:block; }
.caption { font-size:8.8pt; color:#64748b; margin-top:5px; }
.caption b { color:#334155; }

.badge { display:inline-block; border-radius:3px; padding:1px 6px; font-size:8.6pt; font-weight:700; }
.steps { counter-reset:step; list-style:none; padding:0; margin:10px 0 14px; }
.steps > li { counter-increment:step; position:relative; padding-left:30px; margin-bottom:9px; }
.steps > li::before {
  content:counter(step); position:absolute; left:0; top:1px;
  width:20px; height:20px; border-radius:50%; background:var(--accent); color:#fff;
  font-size:9pt; font-weight:700; text-align:center; line-height:20px;
}
.cols { display:flex; gap:14px; }
.cols > * { flex:1; }
.footer { position:fixed; bottom:-9mm; left:0; right:0; font-size:8pt; color:#94a3b8;
          display:flex; justify-content:space-between; }
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
<div class="footer"><span>在庫・発注アラート — {title}</span><span>{number}</span></div>
{body}
</body></html>
"""


def cover(number: str, title: str, lead: str) -> str:
    return f"""<div class="cover">
  <div class="eyebrow">在庫・発注アラート　{number}</div>
  <h1>{title}</h1>
  <p class="lead">{lead}</p>
  <div class="meta">欠品 / 発注漏れ / 過剰在庫 / 在庫精度（棚卸差異）を、在庫数と出荷実績から自動で判定するシステム</div>
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
