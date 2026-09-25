"""説明資料の中身。図は外部ライブラリを使わず、その場に書いたSVGで描いている
（PDFにしたときに欠けないようにするため）。"""


def build_docs(add, cover, badge):
    add("01", "01_システム概要", "システム概要",
        "何をするシステムで、どの画面で何ができるのか。",
        "#0f766e", doc01(cover, badge))
    add("02", "02_判定のしくみ", "判定のしくみ",
        "いつ・何を・いくつ発注すべきかを、どう計算しているか。",
        "#b45309", doc02(cover, badge))
    add("03", "03_毎日の操作", "毎日の操作",
        "HOMEの見方と、在庫一覧での絞り込み・対応状況の付け方。",
        "#1d4ed8", doc03(cover, badge))
    add("04", "04_入出庫の登録", "入出庫の登録",
        "入庫・出庫・調整の入れ方と、出荷先・入庫元の記録。",
        "#047857", doc04(cover, badge))
    add("05", "05_商品とマスタの管理", "商品とマスタの管理",
        "商品の登録（品番の採番）と、仕入先・保管場所・出荷先の管理。",
        "#7c3aed", doc05(cover, badge))
    add("06", "06_CSV取込と移行", "CSV取込と移行",
        "スプレッドシートからの引っ越しと、毎日のデータ取込。",
        "#be123c", doc06(cover, badge))


# ══════════════════════════════════════════════════════════════════
# 01 システム概要
# ══════════════════════════════════════════════════════════════════

FLOW_SVG = """
<svg viewBox="0 0 720 210" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs>
    <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
      <path d="M0,0 L7,3 L0,6 z" fill="#94a3b8"/>
    </marker>
  </defs>
  <g font-size="10">
    <!-- 1 入れる -->
    <rect x="4" y="34" width="104" height="70" rx="6" fill="#ecfeff" stroke="#0891b2"/>
    <text x="56" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0e7490">① 入れる</text>
    <text x="56" y="72" text-anchor="middle" fill="#334155">画面入力</text>
    <text x="56" y="86" text-anchor="middle" fill="#334155">CSV取込</text>
    <text x="56" y="100" text-anchor="middle" fill="#334155">入出庫</text>
    <!-- 2 在庫 -->
    <rect x="124" y="34" width="104" height="70" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
    <text x="176" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">② 在庫</text>
    <text x="176" y="72" text-anchor="middle" fill="#334155">理論／実棚</text>
    <text x="176" y="86" text-anchor="middle" fill="#334155">− 引当</text>
    <text x="176" y="100" text-anchor="middle" font-weight="700" fill="#0f172a">＝有効在庫</text>
    <!-- 3 消化 -->
    <rect x="244" y="34" width="104" height="70" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
    <text x="296" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">③ 消化</text>
    <text x="296" y="72" text-anchor="middle" fill="#334155">直近30日の</text>
    <text x="296" y="86" text-anchor="middle" fill="#334155">出庫 ÷ 30</text>
    <text x="296" y="100" text-anchor="middle" font-weight="700" fill="#0f172a">＝日次出庫</text>
    <!-- 4 閾値 -->
    <rect x="364" y="34" width="104" height="70" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
    <text x="416" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">④ 閾値</text>
    <text x="416" y="72" text-anchor="middle" fill="#334155">安全在庫</text>
    <text x="416" y="86" text-anchor="middle" fill="#334155">発注点</text>
    <text x="416" y="100" text-anchor="middle" fill="#334155">適正在庫上限</text>
    <!-- 5 判定 -->
    <rect x="484" y="34" width="104" height="70" rx="6" fill="#fef2f2" stroke="#dc2626"/>
    <text x="536" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b91c1c">⑤ 判定</text>
    <text x="536" y="72" text-anchor="middle" fill="#334155">アラート8区分</text>
    <text x="536" y="86" text-anchor="middle" fill="#334155">優先度 A/B/C</text>
    <text x="536" y="100" text-anchor="middle" fill="#334155">発注推奨数</text>
    <!-- 6 人 -->
    <rect x="604" y="34" width="112" height="70" rx="6" fill="#eef2ff" stroke="#4338ca"/>
    <text x="660" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3730a3">⑥ 人が決める</text>
    <text x="660" y="72" text-anchor="middle" fill="#334155">発注する</text>
    <text x="660" y="86" text-anchor="middle" fill="#334155">対応状況を</text>
    <text x="660" y="100" text-anchor="middle" fill="#334155">「発注済み」に</text>

    <g stroke="#94a3b8" stroke-width="1.4" marker-end="url(#ar)">
      <line x1="110" y1="69" x2="121" y2="69"/>
      <line x1="230" y1="69" x2="241" y2="69"/>
      <line x1="350" y1="69" x2="361" y2="69"/>
      <line x1="470" y1="69" x2="481" y2="69"/>
      <line x1="590" y1="69" x2="601" y2="69"/>
    </g>

    <rect x="124" y="126" width="464" height="30" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="4 3"/>
    <text x="356" y="145" text-anchor="middle" font-size="9.5" fill="#475569">
      ②〜⑤は画面を開くたびに計算し直す（保存しない）＝ 数字を直せば判定もその場で変わる
    </text>
    <rect x="604" y="126" width="112" height="30" rx="4" fill="#eef2ff" stroke="#c7d2fe"/>
    <text x="660" y="145" text-anchor="middle" font-size="9.5" fill="#3730a3">⑥だけが人の仕事</text>

    <text x="4" y="182" font-size="9.5" fill="#64748b">
      機械はアラートを出すだけ。「発注漏れ」と出ていても、対応状況が「発注済み」なら手当て済みとして扱う。
    </text>
    <text x="4" y="198" font-size="9.5" fill="#64748b">
      この2列（アラート区分と対応状況）の並びが、運用の軸になる。
    </text>
  </g>
</svg>
"""

SCREEN_MAP_SVG = """
<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <g font-size="9.6">
    <rect x="0" y="0" width="720" height="26" rx="4" fill="#0f172a"/>
    <text x="12" y="17" fill="#fff" font-size="9.4">
      HOME ｜ 在庫一覧 ｜ 入出庫 ｜ 仕入先 ｜ 保管場所 ｜ 出荷先 ｜ 取込・書き出し ｜ マスタ ｜ 判定パラメータ
    </text>

    <rect x="0" y="44" width="228" height="196" rx="6" fill="#eff6ff" stroke="#3b82f6"/>
    <text x="14" y="64" font-size="10.5" font-weight="700" fill="#1d4ed8">毎日見る</text>
    <text x="14" y="86" font-weight="700" fill="#0f172a">HOME</text>
    <text x="14" y="102" fill="#475569">今日どれだけ手を打つ必要が</text>
    <text x="14" y="116" fill="#475569">あるか。要対応リスト。</text>
    <text x="14" y="140" font-weight="700" fill="#0f172a">在庫一覧</text>
    <text x="14" y="156" fill="#475569">旧シートと同じ42項目。</text>
    <text x="14" y="170" fill="#475569">絞り込み・対応状況の変更。</text>
    <text x="14" y="194" font-weight="700" fill="#0f172a">入出庫</text>
    <text x="14" y="210" fill="#475569">入庫・出庫・調整の登録と</text>
    <text x="14" y="224" fill="#475569">履歴、出荷先別の実績。</text>

    <rect x="246" y="44" width="228" height="196" rx="6" fill="#f5f3ff" stroke="#7c3aed"/>
    <text x="260" y="64" font-size="10.5" font-weight="700" fill="#6d28d9">ときどき整える</text>
    <text x="260" y="86" font-weight="700" fill="#0f172a">仕入先／保管場所／出荷先</text>
    <text x="260" y="102" fill="#475569">一覧と「新規登録」。使用中の</text>
    <text x="260" y="116" fill="#475569">ものは削除できない。</text>
    <text x="260" y="140" font-weight="700" fill="#0f172a">マスタ</text>
    <text x="260" y="156" fill="#475569">対応状況・カテゴリ・単位。</text>
    <text x="260" y="170" fill="#475569">品番の採番ルール。</text>
    <text x="260" y="194" font-weight="700" fill="#0f172a">判定パラメータ</text>
    <text x="260" y="210" fill="#475569">安全在庫日数・発注サイクル</text>
    <text x="260" y="224" fill="#475569">など、判定の効き方。</text>

    <rect x="492" y="44" width="228" height="196" rx="6" fill="#fff7ed" stroke="#ea580c"/>
    <text x="506" y="64" font-size="10.5" font-weight="700" fill="#c2410c">出し入れする</text>
    <text x="506" y="86" font-weight="700" fill="#0f172a">取込・書き出し</text>
    <text x="506" y="102" fill="#475569">旧シートからの引っ越し。</text>
    <text x="506" y="116" fill="#475569">毎日の販売データ取込。</text>
    <text x="506" y="130" fill="#475569">42項目のCSV書き出し。</text>
    <text x="506" y="160" font-weight="700" fill="#0f172a">日次アラート（自動）</text>
    <text x="506" y="176" fill="#475569">優先度A・Bを毎朝メールで</text>
    <text x="506" y="190" fill="#475569">送る（設定したとき）。</text>
    <text x="506" y="214" fill="#94a3b8" font-size="9">画面を開かなくても</text>
    <text x="506" y="228" fill="#94a3b8" font-size="9">気づける導線。</text>
  </g>
</svg>
"""


def doc01(cover, badge):
    return f"""
<div class="page">
{cover("01", "システム概要", "何をするシステムで、どの画面で何ができるのか。")}

<h2>1. 何を解決するか</h2>
<p>
  商品ごとの在庫数と直近の出荷実績から、<b>いつ・何を・いくつ発注すべきか</b>を自動で判定します。
  解決するのは次の4つです。
</p>
<table>
  <tr><th style="width:22%">課題</th><th>起きていたこと</th><th style="width:34%">このシステムでの見え方</th></tr>
  <tr><td><b>欠品</b></td><td>気づいたときには在庫が無く、納期を落とす</td>
      <td>{badge("欠品")} {badge("欠品リスク")} が優先度Aで出る</td></tr>
  <tr><td><b>発注漏れ</b></td><td>発注したつもりが抜けていた</td>
      <td>{badge("発注漏れ")} が優先度Aで出る（行ごと赤くなる）</td></tr>
  <tr><td><b>過剰在庫</b></td><td>置き場と資金が在庫に寝ている</td>
      <td>{badge("過剰在庫")} {badge("滞留在庫")} が優先度Cで出る</td></tr>
  <tr><td><b>在庫精度</b></td><td>帳簿と現物が合わない</td>
      <td>{badge("棚卸差異")} が優先度Cで出る</td></tr>
</table>

<h2>2. 全体の流れ</h2>
<div class="fig">{FLOW_SVG}
  <div class="caption"><b>図1</b>　入力から対応まで。②〜⑤は毎回その場で計算するので、
  「再計算ボタン」を押す必要がありません。在庫数を直した瞬間に判定が変わります。</div>
</div>

<div class="note">
  <b>スプレッドシート版との一番の違い。</b>
  以前は計算結果をシートに書き込んでいたため、再計算を忘れると前日の判定が残っていました。
  今は保存せず毎回計算するので、古い判定が残ることがありません。
</div>
</div>

<div class="page">
<h2>3. 画面の構成</h2>
<div class="fig">{SCREEN_MAP_SVG}
  <div class="caption"><b>図2</b>　上部メニューの並びと、各画面の役割。
  毎日触るのは左の3つだけで、右の2群は必要なときに開きます。</div>
</div>

<h2>4. 1日・1週間の使い方</h2>
<table>
  <tr><th style="width:16%">頻度</th><th style="width:42%">やること</th><th>使う画面</th></tr>
  <tr><td><b>毎朝</b></td>
      <td>HOMEで優先度A・Bを確認し、発注する。発注したら対応状況を「発注済み」にする</td>
      <td>HOME → 在庫一覧</td></tr>
  <tr><td><b>その都度</b></td>
      <td>入庫・出庫が発生したら登録する（まとめてCSVでも可）</td>
      <td>入出庫</td></tr>
  <tr><td><b>週1回</b></td>
      <td>優先度Cを見る。過剰在庫・滞留在庫の整理、棚卸差異の原因確認</td>
      <td>在庫一覧（優先度Cで絞る）</td></tr>
  <tr><td><b>月1回</b></td>
      <td>リードタイムや安全在庫日数の実績を見直す。廃番の整理</td>
      <td>商品編集／判定パラメータ</td></tr>
</table>

<h2>5. 覚えておくとよい3つの考え方</h2>
<h3>① 判定は機械、対応は人</h3>
<p>
  アラート区分は機械が出します。それに対して「発注済み」「保留」「廃盤」「発注NG」を選ぶのが人の仕事です。
  <b>対応状況の列だけは、計算で書き換わることが絶対にありません。</b>
</p>
<h3>② 発注判定は「有効在庫＋発注残」で見る</h3>
<p>
  手元の在庫だけで判断すると、発注済みの商品にも毎日「発注してください」と出続け、誰も見なくなります。
  発注残（入荷待ちの数）を足した<b>在庫ポジション</b>で判定しているので、発注した時点でアラートは止まります。
</p>
<h3>③ 1つの商品に付くアラートは1つだけ</h3>
<p>
  8つの区分を重い順に見て、最初に当たったものだけを表示します。
  「欠品もしていて棚卸差異もある」場合は、重い方の {badge("欠品")} が出ます。
</p>
</div>
"""


# ══════════════════════════════════════════════════════════════════
# 02 判定のしくみ
# ══════════════════════════════════════════════════════════════════

STOCK_CURVE_SVG = """
<svg viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs>
    <marker id="a2" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
      <path d="M0,0 L7,3 L0,6 z" fill="#0f172a"/>
    </marker>
  </defs>
  <g font-size="9.4">
    <!-- 軸 -->
    <line x1="64" y1="40" x2="64" y2="258" stroke="#94a3b8"/>
    <line x1="64" y1="258" x2="612" y2="258" stroke="#94a3b8" marker-end="url(#a2)"/>
    <text x="30" y="46" fill="#64748b">在庫数</text>
    <text x="596" y="274" fill="#64748b">日</text>

    <!-- 3本の閾値（ラベルは枠内に収める） -->
    <line x1="64" y1="67" x2="600" y2="67" stroke="#0277bd" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text x="606" y="64" fill="#0277bd" font-size="9" font-weight="700">適正在庫上限</text>
    <text x="606" y="77" fill="#0277bd" font-size="8.2">超えると過剰在庫</text>

    <line x1="64" y1="163" x2="600" y2="163" stroke="#f59e0b" stroke-width="1.6"/>
    <text x="606" y="160" fill="#b45309" font-size="9" font-weight="700">発注点</text>
    <text x="606" y="173" fill="#b45309" font-size="8.2">割ったら発注する</text>

    <line x1="64" y1="221" x2="600" y2="221" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="3 3"/>
    <text x="606" y="218" fill="#b91c1c" font-size="9" font-weight="700">安全在庫</text>
    <text x="606" y="231" fill="#b91c1c" font-size="8.2">遅れに備える分</text>

    <!-- 在庫の推移（のこぎり波） -->
    <path d="M64,67 L397,225" fill="none" stroke="#0f172a" stroke-width="2.2"/>
    <path d="M397,225 L397,67" fill="none" stroke="#059669" stroke-width="2.2"/>
    <path d="M397,67 L600,163" fill="none" stroke="#0f172a" stroke-width="2.2"/>
    <!-- 発注しなかった場合 -->
    <path d="M397,225 L470,258" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="5 4"/>
    <circle cx="470" cy="258" r="4.5" fill="#dc2626"/>
    <text x="410" y="250" fill="#b91c1c" font-size="9" font-weight="700">発注しなければ欠品</text>

    <!-- 発注する日 -->
    <line x1="267" y1="163" x2="267" y2="292" stroke="#b45309" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="267" cy="163" r="4.5" fill="#f59e0b" stroke="#fff"/>
    <!-- 入荷 -->
    <line x1="397" y1="225" x2="397" y2="292" stroke="#059669" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="397" cy="67" r="4.5" fill="#059669" stroke="#fff"/>
    <text x="407" y="60" fill="#047857" font-size="9" font-weight="700">入荷して回復</text>

    <!-- リードタイム区間 -->
    <path d="M267,278 L267,284 L397,284 L397,278" fill="none" stroke="#475569"/>
    <text x="332" y="298" text-anchor="middle" fill="#334155" font-size="9">
      ② リードタイム（発注してから入荷するまで）
    </text>
    <text x="267" y="316" text-anchor="middle" fill="#b45309" font-size="9" font-weight="700">
      ① 発注点を割る＝この日に発注
    </text>
    <text x="397" y="316" text-anchor="middle" fill="#047857" font-size="9" font-weight="700">③ 入荷</text>

    <text x="76" y="86" fill="#475569" font-size="9">出荷のぶんだけ、毎日減っていく</text>
    <text x="64" y="336" fill="#64748b" font-size="8.8">
      発注点は「リードタイム中に売れる分 ＋ 安全在庫」。発注点を割った日に発注すれば、安全在庫に少し 食い込むだけで入荷が間に合う。
    </text>
  </g>
</svg>
"""


def _ladder_svg(badge_colors):
    rows = [
        ("有効在庫 ≦ 0", "欠品", "A"),
        ("発注点割れ かつ 発注残0 かつ 発注期限を過ぎている", "発注漏れ", "A"),
        ("在庫日数 ≦ リードタイム", "欠品リスク", "A"),
        ("入荷予定日を過ぎても未入庫", "入荷遅延", "B"),
        ("在庫ポジション ≦ 発注点", "発注推奨", "B"),
        ("有効在庫 > 適正在庫上限", "過剰在庫", "C"),
        ("90日以上 出庫が無く、在庫がある", "滞留在庫", "C"),
        ("実棚在庫 ≠ 理論在庫", "棚卸差異", "C"),
    ]
    pri_color = {"A": ("#f4cccc", "#990000"), "B": ("#ffedc2", "#7f6000"), "C": ("#d8e6f4", "#1c4587")}
    out = ['<svg viewBox="0 0 720 430" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">',
           '<defs><marker id="a3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">'
           '<path d="M0,0 L6,3 L0,6 z" fill="#cbd5e1"/></marker></defs>', '<g font-size="9.6">']
    for i, (cond, alert, pri) in enumerate(rows):
        y = 8 + i * 48
        bg, fg = badge_colors[alert]
        pbg, pfg = pri_color[pri]
        out.append(f'<rect x="0" y="{y}" width="392" height="34" rx="5" fill="#f8fafc" stroke="#cbd5e1"/>')
        out.append(f'<text x="14" y="{y + 15}" font-size="8.6" fill="#94a3b8">条件 {i + 1}</text>')
        out.append(f'<text x="52" y="{y + 22}" fill="#334155">{cond}</text>')
        out.append(f'<line x1="396" y1="{y + 17}" x2="424" y2="{y + 17}" stroke="#94a3b8" '
                   f'stroke-width="1.3" marker-end="url(#a3)"/>')
        out.append(f'<rect x="430" y="{y + 4}" width="104" height="26" rx="4" fill="{bg}"/>')
        out.append(f'<text x="482" y="{y + 21}" text-anchor="middle" fill="{fg}" font-weight="700">{alert}</text>')
        out.append(f'<rect x="548" y="{y + 4}" width="96" height="26" rx="4" fill="{pbg}"/>')
        out.append(f'<text x="596" y="{y + 21}" text-anchor="middle" fill="{pfg}" font-weight="700" '
                   f'font-size="9">優先度 {pri}</text>')
        if i < len(rows) - 1:
            out.append(f'<line x1="18" y1="{y + 34}" x2="18" y2="{y + 46}" stroke="#cbd5e1" '
                       f'stroke-width="1.2" marker-end="url(#a3)"/>')
            if i == 0:
                out.append(f'<text x="28" y="{y + 45}" font-size="8.4" fill="#94a3b8">当たらなければ次の条件へ</text>')
    y = 8 + len(rows) * 48
    out.append(f'<rect x="0" y="{y}" width="392" height="30" rx="5" fill="#f8fafc" stroke="#cbd5e1" '
               f'stroke-dasharray="4 3"/>')
    out.append(f'<text x="14" y="{y + 20}" fill="#64748b">どれにも当たらない</text>')
    out.append(f'<rect x="430" y="{y + 2}" width="104" height="26" rx="4" fill="#e8f5e9"/>')
    out.append(f'<text x="482" y="{y + 19}" text-anchor="middle" fill="#1b5e20" font-weight="700">正常</text>')
    out.append('</g></svg>')
    return "\n".join(out)


def doc02(cover, badge):
    from build import ALERT_COLORS
    ladder = _ladder_svg(ALERT_COLORS)
    return f"""
<div class="page">
{cover("02", "判定のしくみ", "いつ・何を・いくつ発注すべきかを、どう計算しているか。")}

<h2>1. 在庫はこう動く</h2>
<p>
  在庫は、出荷のぶんだけ毎日減り、入荷でまた増えます。このノコギリの形のどこに今いるかで、
  発注すべきかどうかが決まります。
</p>
<div class="fig">{STOCK_CURVE_SVG}
  <div class="caption"><b>図3</b>　在庫の推移と3本の線。
  <b>発注点</b>を割った日に発注すれば、リードタイム中に安全在庫を少し食うだけで入荷が間に合います。
  発注しなければ赤い破線のとおり欠品します。</div>
</div>

<table>
  <tr><th style="width:20%">線</th><th style="width:42%">意味</th><th>割ったら／超えたら</th></tr>
  <tr><td><b>適正在庫上限</b></td><td>持ちすぎない上限。リードタイム＋安全在庫＋発注サイクル分</td>
      <td>超えると {badge("過剰在庫")}</td></tr>
  <tr><td><b>発注点</b></td><td>リードタイム中に売れる分 ＋ 安全在庫</td>
      <td>割ると {badge("発注推奨")}</td></tr>
  <tr><td><b>安全在庫</b></td><td>納期の遅れや急な注文に備える分</td>
      <td>ここを割ると危険水域</td></tr>
</table>
</div>

<div class="page">
<h2>2. 計算式</h2>
<pre>有効在庫       = (実棚在庫 があれば実棚 / 無ければ理論在庫) − 引当数
在庫ポジション  = 有効在庫 + 発注残数        ← 発注判定はこの値で行う
平均日次出庫    = 期間出庫数 ÷ 30日
在庫日数       = 有効在庫 ÷ 平均日次出庫
欠品予測日      = 今日 + 在庫日数
安全在庫       = 平均日次出庫 × 安全在庫日数(既定7日)
発注点         = 平均日次出庫 × リードタイム + 安全在庫
適正在庫上限    = 平均日次出庫 × (リードタイム + 安全在庫日数 + 発注サイクル14日)
発注推奨数      = 適正在庫上限まで戻す量を、MOQ と発注ロット単位に切り上げた数
発注期限日      = 欠品予測日 − リードタイム</pre>

<div class="note">
  <b>なぜ「有効在庫＋発注残」で判定するのか。</b>
  手元の在庫だけで見ると、発注済みの商品にも毎日「発注してください」と出続けます。
  そうなるとアラート自体が信用されなくなり、本当に危ない行も見逃されます。
</div>

<h3>商品ごとに変えられる値</h3>
<table>
  <tr><th style="width:28%">項目</th><th>効き方</th></tr>
  <tr><td>発注リードタイム日数</td><td><b>発注点計算の中核。</b>長いほど早めに発注点に当たる</td></tr>
  <tr><td>安全在庫日数</td><td>空欄なら既定7日。切らしたくない商品は長くする</td></tr>
  <tr><td>最小発注数(MOQ)</td><td>発注推奨数の下限</td></tr>
  <tr><td>発注ロット単位</td><td>ケース入数など。発注推奨数はこの倍数に切り上がる</td></tr>
</table>
<p style="font-size:9.4pt;color:#475569">
  全商品に共通の値（集計期間30日・既定の安全在庫日数7日・発注サイクル14日・滞留90日）は
  「判定パラメータ」画面で変えられます。変えると全商品の判定がその場で計算し直されます。
</p>
</div>

<div class="page">
<h2>3. アラートは上から順に見る</h2>
<p>
  8つの条件を<b>重い順</b>に見て、最初に当たった1つだけを表示します。
  だから1つの商品に2つのアラートが同時に付くことはありません。
</p>
<div class="fig">{ladder}
  <div class="caption"><b>図4</b>　判定の順序。上ほど緊急度が高く、当たらなければ次の条件に進みます。</div>
</div>

<h2>4. 優先度の意味</h2>
<table>
  <tr><th style="width:18%" class="c">優先度</th><th style="width:30%">意味</th><th>いつ見るか</th></tr>
  <tr><td class="c"><span class="badge" style="background:#f4cccc;color:#990000">A:即日対応</span></td>
      <td>今日中に手を打たないと欠品する</td><td>毎朝いちばんに。HOMEの要対応リスト</td></tr>
  <tr><td class="c"><span class="badge" style="background:#ffedc2;color:#7f6000">B:3日以内</span></td>
      <td>3日以内に発注すれば間に合う</td><td>毎朝。Aを片付けた後</td></tr>
  <tr><td class="c"><span class="badge" style="background:#d8e6f4;color:#1c4587">C:要確認</span></td>
      <td>すぐ欠品はしないが、在庫が傷んでいる</td><td>週に1回まとめて</td></tr>
</table>
</div>
"""


# ══════════════════════════════════════════════════════════════════
# 03 毎日の操作
# ══════════════════════════════════════════════════════════════════

HOME_SVG = """
<svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <g font-size="9.4">
    <rect x="0" y="0" width="470" height="300" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <rect x="0" y="0" width="470" height="22" rx="6" fill="#0f172a"/>
    <text x="10" y="15" fill="#fff" font-size="8.6">HOME ｜ 在庫一覧 ｜ 入出庫 ｜ 仕入先 ｜ …</text>

    <rect x="12" y="34" width="106" height="52" rx="4" fill="#fef2f2" stroke="#fecaca"/>
    <text x="22" y="49" fill="#991b1b" font-size="8.6" font-weight="700">A:即日対応</text>
    <text x="22" y="72" fill="#991b1b" font-size="17" font-weight="700">3</text>
    <rect x="126" y="34" width="106" height="52" rx="4" fill="#fffbeb" stroke="#fde68a"/>
    <text x="136" y="49" fill="#92400e" font-size="8.6" font-weight="700">B:3日以内</text>
    <text x="136" y="72" fill="#92400e" font-size="17" font-weight="700">3</text>
    <rect x="240" y="34" width="106" height="52" rx="4" fill="#f0f9ff" stroke="#bae6fd"/>
    <text x="250" y="49" fill="#075985" font-size="8.6" font-weight="700">C:要確認</text>
    <text x="250" y="72" fill="#075985" font-size="17" font-weight="700">3</text>
    <rect x="354" y="34" width="104" height="52" rx="4" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="364" y="49" fill="#64748b" font-size="8.6" font-weight="700">正常</text>
    <text x="364" y="72" fill="#64748b" font-size="17" font-weight="700">1</text>

    <rect x="12" y="96" width="446" height="38" rx="4" fill="#fff" stroke="#e2e8f0"/>
    <text x="22" y="112" font-size="8.8" font-weight="700" fill="#334155">アラート区分の内訳</text>
    <g font-size="7.6">
      <rect x="22" y="118" width="46" height="12" rx="2" fill="#b71c1c"/><text x="45" y="127" text-anchor="middle" fill="#fff">欠品 1</text>
      <rect x="74" y="118" width="54" height="12" rx="2" fill="#d32f2f"/><text x="101" y="127" text-anchor="middle" fill="#fff">発注漏れ 1</text>
      <rect x="134" y="118" width="60" height="12" rx="2" fill="#ef6c00"/><text x="164" y="127" text-anchor="middle" fill="#fff">欠品リスク 1</text>
      <rect x="200" y="118" width="54" height="12" rx="2" fill="#7b1fa2"/><text x="227" y="127" text-anchor="middle" fill="#fff">入荷遅延 1</text>
      <rect x="260" y="118" width="54" height="12" rx="2" fill="#f9a825"/><text x="287" y="127" text-anchor="middle" fill="#000">発注推奨 2</text>
      <rect x="320" y="118" width="54" height="12" rx="2" fill="#0277bd"/><text x="347" y="127" text-anchor="middle" fill="#fff">過剰在庫 1</text>
      <rect x="380" y="118" width="54" height="12" rx="2" fill="#455a64"/><text x="407" y="127" text-anchor="middle" fill="#fff">滞留在庫 1</text>
    </g>

    <rect x="12" y="144" width="446" height="144" rx="4" fill="#fff" stroke="#e2e8f0"/>
    <text x="22" y="160" font-size="8.8" font-weight="700" fill="#334155">要対応リスト（優先度A・B）</text>
    <line x1="22" y1="166" x2="448" y2="166" stroke="#e2e8f0"/>
    <g font-size="7.8" fill="#475569">
      <text x="22" y="180">優先度</text><text x="70" y="180">区分</text><text x="130" y="180">商品</text>
      <text x="268" y="180">有効在庫</text><text x="318" y="180">発注点</text><text x="364" y="180">発注推奨数</text><text x="420" y="180">期限</text>
    </g>
    <g font-size="7.8">
      <rect x="22" y="188" width="42" height="11" rx="2" fill="#f4cccc"/><text x="43" y="196" text-anchor="middle" fill="#990000">A</text>
      <rect x="70" y="188" width="42" height="11" rx="2" fill="#b71c1c"/><text x="91" y="196" text-anchor="middle" fill="#fff">欠品</text>
      <text x="130" y="196" fill="#334155">DEMO-001 ルームエアコン</text>
      <text x="290" y="196" text-anchor="end" fill="#334155">-2</text><text x="344" y="196" text-anchor="end" fill="#334155">42</text>
      <text x="404" y="196" text-anchor="end" fill="#0f172a" font-weight="700">90</text><text x="420" y="196" fill="#334155">09/17</text>

      <rect x="22" y="206" width="42" height="11" rx="2" fill="#f4cccc"/><text x="43" y="214" text-anchor="middle" fill="#990000">A</text>
      <rect x="70" y="206" width="42" height="11" rx="2" fill="#d32f2f"/><text x="91" y="214" text-anchor="middle" fill="#fff">発注漏れ</text>
      <text x="130" y="214" fill="#334155">DEMO-002 銅管 3分</text>
      <text x="290" y="214" text-anchor="end" fill="#334155">50</text><text x="344" y="214" text-anchor="end" fill="#334155">140</text>
      <text x="404" y="214" text-anchor="end" fill="#0f172a" font-weight="700">230</text><text x="420" y="214" fill="#334155">09/23</text>

      <rect x="22" y="224" width="42" height="11" rx="2" fill="#ffedc2"/><text x="43" y="232" text-anchor="middle" fill="#7f6000">B</text>
      <rect x="70" y="224" width="42" height="11" rx="2" fill="#7b1fa2"/><text x="91" y="232" text-anchor="middle" fill="#fff">入荷遅延</text>
      <text x="130" y="232" fill="#334155">DEMO-004 電線 VVF</text>
      <text x="290" y="232" text-anchor="end" fill="#334155">40</text><text x="344" y="232" text-anchor="end" fill="#334155">34</text>
      <text x="404" y="232" text-anchor="end" fill="#334155">0</text><text x="420" y="232" fill="#334155">10/05</text>
    </g>
    <text x="22" y="258" font-size="7.8" fill="#94a3b8">…（優先度A・Bの行が並ぶ。商品コードを押すと明細に飛ぶ）</text>

    <!-- 吹き出し -->
    <g font-size="9">
      <line x1="470" y1="60" x2="506" y2="60" stroke="#94a3b8" stroke-dasharray="3 2"/>
      <text x="512" y="52" font-weight="700" fill="#0f172a">① まず件数を見る</text>
      <text x="512" y="66" fill="#475569">Aが0なら、今日は</text>
      <text x="512" y="79" fill="#475569">急ぎの発注は無い</text>

      <line x1="470" y1="115" x2="506" y2="115" stroke="#94a3b8" stroke-dasharray="3 2"/>
      <text x="512" y="108" font-weight="700" fill="#0f172a">② 区分をクリック</text>
      <text x="512" y="122" fill="#475569">その区分だけに</text>
      <text x="512" y="135" fill="#475569">絞った一覧に飛ぶ</text>

      <line x1="470" y1="210" x2="506" y2="210" stroke="#94a3b8" stroke-dasharray="3 2"/>
      <text x="512" y="196" font-weight="700" fill="#0f172a">③ 上から片付ける</text>
      <text x="512" y="210" fill="#475569">推奨アクションに</text>
      <text x="512" y="223" fill="#475569">「本日中に230発注」</text>
      <text x="512" y="236" fill="#475569">のように出るので、</text>
      <text x="512" y="249" fill="#475569">そのまま発注して</text>
      <text x="512" y="262" fill="#475569">対応状況を変える</text>
    </g>
  </g>
</svg>
"""

STATUS_FLOW_SVG = """
<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs><marker id="a4" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
    <path d="M0,0 L7,3 L0,6 z" fill="#94a3b8"/></marker></defs>
  <g font-size="9.6">
    <rect x="4" y="70" width="96" height="34" rx="17" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="52" y="92" text-anchor="middle" fill="#64748b">未設定</text>

    <rect x="140" y="30" width="104" height="34" rx="17" fill="#ef5350"/>
    <text x="192" y="52" text-anchor="middle" fill="#fff" font-weight="700">即日対応</text>
    <rect x="140" y="110" width="104" height="34" rx="17" fill="#ffe599"/>
    <text x="192" y="132" text-anchor="middle" fill="#5a4000" font-weight="700">要確認</text>

    <rect x="292" y="70" width="104" height="34" rx="17" fill="#c8e6c9"/>
    <text x="344" y="92" text-anchor="middle" fill="#1b5e20" font-weight="700">発注済み</text>

    <rect x="444" y="70" width="128" height="34" rx="6" fill="#ecfdf5" stroke="#059669" stroke-dasharray="4 3"/>
    <text x="508" y="87" text-anchor="middle" fill="#047857" font-size="9">入荷したら</text>
    <text x="508" y="99" text-anchor="middle" fill="#047857" font-size="9">アラートが消える</text>

    <rect x="292" y="152" width="80" height="30" rx="15" fill="#e5e5e5"/>
    <text x="332" y="172" text-anchor="middle" fill="#595959">保留</text>
    <rect x="384" y="152" width="80" height="30" rx="15" fill="#9e9e9e"/>
    <text x="424" y="172" text-anchor="middle" fill="#fff">廃盤</text>
    <rect x="476" y="152" width="90" height="30" rx="15" fill="#d9d2e9"/>
    <text x="521" y="172" text-anchor="middle" fill="#5a338c">発注NG</text>

    <g stroke="#94a3b8" stroke-width="1.3" marker-end="url(#a4)" fill="none">
      <path d="M100,80 L136,50"/>
      <path d="M100,94 L136,126"/>
      <path d="M244,49 L288,80"/>
      <path d="M244,126 L288,94"/>
      <path d="M396,87 L440,87"/>
      <path d="M192,146 L192,167 L288,167"/>
    </g>
    <text x="106" y="24" font-size="8.8" fill="#64748b">アラートを見て、人が選ぶ</text>
    <text x="250" y="70" font-size="8.8" fill="#64748b">発注したら</text>
    <text x="200" y="192" font-size="8.8" fill="#64748b">発注しないと決めた場合</text>
  </g>
</svg>
"""


def doc03(cover, badge):
    return f"""
<div class="page">
{cover("03", "毎日の操作", "HOMEの見方と、在庫一覧での絞り込み・対応状況の付け方。")}

<h2>1. 朝いちばん：HOMEを開く</h2>
<div class="fig">{HOME_SVG}
  <div class="caption"><b>図5</b>　HOMEの見方。上の件数 → 区分の内訳 → 要対応リスト、の順に見ます。</div>
</div>

<ol class="steps">
  <li><b>A（即日対応）の件数を見る。</b>0件なら、今日中に手を打つべき商品はありません。</li>
  <li><b>要対応リストを上から片付ける。</b>「推奨アクション」に
      「本日中に 230 発注（リードタイム7日）」のように、数量と期限が書かれています。</li>
  <li><b>発注したら、その行の対応状況を「発注済み」に変える。</b>
      一覧の対応状況はその場で変えられます。次の朝から、その行は手当て済みとして扱われます。</li>
</ol>

<div class="tip">
  <b>アラートが消えるのはいつか。</b>
  対応状況を変えてもアラート区分は消えません（機械の判定と人の対応は別物なので）。
  実際に発注残（入荷予定の数）を入力するか、入出庫で入庫を登録した時点で、判定そのものが変わります。
</div>
</div>

<div class="page">
<h2>2. 在庫一覧の使い方</h2>
<p>旧スプレッドシートと同じ42項目が、同じ並びで入っています。</p>

<h3>左3列は固定されている</h3>
<p>
  横にスクロールしても<b>対応状況・商品コード・商品名</b>は画面に残ります。
  どの行を見ているか見失わないためです。
</p>

<h3>見たい区分だけ表示する</h3>
<p>
  表の上に「表示する区分」のボタンが並んでいます。押すと、その区分の列がまとめて隠れます。
  選んだ状態はブラウザが覚えているので、次に開いたときも同じ見え方になります。
</p>
<table>
  <tr><th style="width:24%">区分</th><th>入っている項目</th></tr>
  <tr><td>基本情報</td><td>カテゴリ / 規格・型番 / 単位 / 保管場所</td></tr>
  <tr><td>仕入先・発注条件</td><td>仕入先 / 単価 / リードタイム / MOQ / ロット</td></tr>
  <tr><td>在庫状況</td><td>理論在庫 / 実棚在庫 / 棚卸差異 / 引当 / 発注残 / 有効在庫 / 入荷予定日 / 在庫金額</td></tr>
  <tr><td>消化傾向</td><td>期間出庫数 / 平均日次出庫 / 在庫日数 / 欠品予測日</td></tr>
  <tr><td>発注判定</td><td>安全在庫 / 発注点 / 適正在庫上限 / 発注推奨数 / 発注期限日</td></tr>
  <tr><td>アラート</td><td>アラート区分 / 優先度 / 理由 / 推奨アクション</td></tr>
  <tr><td>履歴・管理</td><td>最終入庫日 / 最終出庫日 / 最終棚卸日 / 滞留日数 / 備考 / 更新日時</td></tr>
</table>

<h3>絞り込みと並べ替え</h3>
<ul>
  <li>キーワード（商品コード・商品名・型番・仕入先）、アラート区分、優先度、対応状況、カテゴリ、保管場所、仕入先で絞れます</li>
  <li>絞り込んだ状態はURLに残るので、<b>そのままブックマークや共有ができます</b></li>
  <li>見出しをクリックすると並べ替わります（優先度・商品コード・有効在庫・在庫日数・発注期限・在庫金額・更新日時）</li>
  <li>「CSVで書き出す」は、<b>いま絞り込んでいるものだけ</b>を出します</li>
</ul>

<div class="note">
  <b>「自動」と付いた列は直せません。</b>
  有効在庫・発注点・アラート区分などは、開くたびに計算し直しているためです。
  これらを変えたいときは、もとになる数字（理論在庫・引当・リードタイムなど）を直します。
</div>
</div>

<div class="page">
<h2>3. 対応状況の使い分け</h2>
<div class="fig">{STATUS_FLOW_SVG}
  <div class="caption"><b>図6</b>　対応状況の流れ。人が選ぶ列で、計算で書き換わることはありません。</div>
</div>

<table>
  <tr><th style="width:20%">対応状況</th><th>使うとき</th></tr>
  <tr><td><b>即日対応</b></td><td>今日中に発注・手配すると決めた行に付けて、作業待ちを見えるようにする</td></tr>
  <tr><td><b>要確認</b></td><td>数字が怪しい・現物を見てから決める行</td></tr>
  <tr><td><b>発注済み</b></td><td>発注を出した行。HOMEの「手当て済み」件数に入る</td></tr>
  <tr><td><b>保留</b></td><td>今は動かさないと決めた行</td></tr>
  <tr><td><b>廃盤</b></td><td>もう仕入れない商品。在庫を売り切る対象</td></tr>
  <tr><td><b>発注NG</b></td><td>仕入先都合などで発注できない行</td></tr>
</table>

<div class="tip">
  <b>選択肢は増やせます。</b>「マスタ」画面の対応状況に行を足すと、その場でプルダウンに出ます。
  色も指定できるので、一覧での見分けがつきやすくなります。
</div>
</div>
"""


# ══════════════════════════════════════════════════════════════════
# 04 入出庫の登録
# ══════════════════════════════════════════════════════════════════

LEDGER_SVG = """
<svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <g font-size="9.4">
    <text x="0" y="14" font-weight="700" fill="#0f172a">DEMO-010 配管化粧カバー ジョイント の理論在庫</text>
    <line x1="40" y1="200" x2="700" y2="200" stroke="#94a3b8"/>
    <line x1="40" y1="40" x2="40" y2="200" stroke="#94a3b8"/>
    <text x="4" y="44" fill="#64748b" font-size="8.4">600</text>
    <text x="12" y="204" fill="#64748b" font-size="8.4">0</text>

    <!-- 残高の推移（棒） -->
    <rect x="58" y="40" width="72" height="160" fill="#d1fae5" stroke="#059669"/>
    <text x="94" y="34" text-anchor="middle" fill="#047857" font-weight="700">600</text>
    <text x="94" y="216" text-anchor="middle" fill="#475569" font-size="8.6">入庫 +600</text>
    <text x="94" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">8/16</text>

    <rect x="158" y="72" width="72" height="128" fill="#e0f2fe" stroke="#0284c7"/>
    <text x="194" y="66" text-anchor="middle" fill="#075985" font-weight="700">480</text>
    <text x="194" y="216" text-anchor="middle" fill="#475569" font-size="8.6">出庫 −120</text>
    <text x="194" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">山田工務店</text>

    <rect x="258" y="96" width="72" height="104" fill="#e0f2fe" stroke="#0284c7"/>
    <text x="294" y="90" text-anchor="middle" fill="#075985" font-weight="700">390</text>
    <text x="294" y="216" text-anchor="middle" fill="#475569" font-size="8.6">出庫 −90</text>
    <text x="294" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">中央病院</text>

    <rect x="358" y="136" width="72" height="64" fill="#e0f2fe" stroke="#0284c7"/>
    <text x="394" y="130" text-anchor="middle" fill="#075985" font-weight="700">240</text>
    <text x="394" y="216" text-anchor="middle" fill="#475569" font-size="8.6">出庫 −150</text>
    <text x="394" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">みどり建設</text>

    <rect x="458" y="139" width="72" height="61" fill="#fef3c7" stroke="#d97706"/>
    <text x="494" y="133" text-anchor="middle" fill="#92400e" font-weight="700">230</text>
    <text x="494" y="216" text-anchor="middle" fill="#475569" font-size="8.6">調整 −10</text>
    <text x="494" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">棚卸の不足分</text>

    <rect x="558" y="165" width="72" height="35" fill="#e0f2fe" stroke="#0284c7"/>
    <text x="594" y="159" text-anchor="middle" fill="#075985" font-weight="700">130</text>
    <text x="594" y="216" text-anchor="middle" fill="#475569" font-size="8.6">出庫 −100</text>
    <text x="594" y="228" text-anchor="middle" fill="#94a3b8" font-size="8">さくらマンション</text>

    <rect x="650" y="165" width="50" height="35" fill="#f1f5f9" stroke="#0f172a" stroke-dasharray="4 3"/>
    <text x="675" y="159" text-anchor="middle" fill="#0f172a" font-weight="700">130</text>
    <text x="675" y="216" text-anchor="middle" fill="#0f172a" font-size="8.6" font-weight="700">いまの在庫</text>

    <text x="40" y="252" fill="#64748b" font-size="9">
      1件登録するたびに理論在庫が動く。取り消せば同じだけ戻る。直近30日の出庫（120+90+150+100=460）が「期間出庫数」になる。
    </text>
  </g>
</svg>
"""

SOURCE_SWITCH_SVG = """
<svg viewBox="0 0 720 190" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs><marker id="a5" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
    <path d="M0,0 L7,3 L0,6 z" fill="#94a3b8"/></marker></defs>
  <g font-size="9.6">
    <rect x="0" y="66" width="150" height="46" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="75" y="86" text-anchor="middle" fill="#334155">期間出庫数を</text>
    <text x="75" y="101" text-anchor="middle" fill="#334155">どこから取るか</text>

    <path d="M232,89 L188,89 L188,89 Z" fill="none"/>
    <polygon points="256,50 344,89 256,128 168,89" fill="#fffbeb" stroke="#f59e0b"/>
    <text x="256" y="85" text-anchor="middle" fill="#92400e" font-size="9">その商品に</text>
    <text x="256" y="99" text-anchor="middle" fill="#92400e" font-size="9">出庫の登録がある？</text>

    <rect x="404" y="18" width="250" height="52" rx="6" fill="#ecfdf5" stroke="#059669"/>
    <text x="418" y="38" fill="#047857" font-weight="700">ある → 台帳から集計する</text>
    <text x="418" y="55" fill="#334155" font-size="9">直近30日の出庫を合計。最終入出庫日も台帳の日付</text>

    <rect x="404" y="108" width="250" height="52" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
    <text x="418" y="128" fill="#334155" font-weight="700">ない → 手入力の値を使う</text>
    <text x="418" y="145" fill="#334155" font-size="9">商品編集やCSVで入れた「期間出庫数」で判定する</text>

    <g stroke="#94a3b8" stroke-width="1.3" marker-end="url(#a5)" fill="none">
      <path d="M150,89 L164,89"/>
      <path d="M344,89 L374,89 L374,44 L400,44"/>
      <path d="M344,89 L374,89 L374,134 L400,134"/>
    </g>
    <text x="0" y="180" fill="#64748b" font-size="9">
      商品ごとに切り替わるので、入出庫を入れ始めた商品から順に精度が上がる。全商品を揃える必要はない。
    </text>
  </g>
</svg>
"""


def doc04(cover, badge):
    return f"""
<div class="page">
{cover("04", "入出庫の登録", "入庫・出庫・調整の入れ方と、出荷先・入庫元の記録。")}

<h2>1. 入出庫を登録すると何が変わるか</h2>
<p>
  在庫数を手で書き換える代わりに、動いた分を1件ずつ積み上げます。登録するたびに理論在庫が増減します。
</p>
<div class="fig">{LEDGER_SVG}
  <div class="caption"><b>図7</b>　入出庫と理論在庫の関係。取り消し（削除）や数量の修正をすると、在庫も同じだけ戻ります。</div>
</div>

<table>
  <tr><th style="width:14%" class="c">区分</th><th style="width:20%">在庫への効き方</th><th>使うとき</th></tr>
  <tr><td class="c"><span class="badge" style="background:#d1fae5;color:#065f46">入庫</span></td>
      <td>増える（＋）</td><td>仕入先から入荷した／他倉庫から移ってきた／現場から返ってきた</td></tr>
  <tr><td class="c"><span class="badge" style="background:#e0f2fe;color:#075985">出庫</span></td>
      <td>減る（−）</td><td>得意先・現場へ出荷した／自社で使った</td></tr>
  <tr><td class="c"><span class="badge" style="background:#fef3c7;color:#92400e">調整</span></td>
      <td>符号のとおり（±）</td><td>棚卸で差異が出た／破損・紛失を反映する</td></tr>
</table>

<div class="note">
  <b>入庫・出庫にマイナスは入れられません。</b>
  減らしたいときは区分を「調整」にして、マイナスの数量で入れます。
  こうしておかないと、入庫と出庫の合計が実態と合わなくなり、後から履歴を追えなくなるためです。
</div>
</div>

<div class="page">
<h2>2. 登録のしかた</h2>
<ol class="steps">
  <li><b>「入出庫」を開く。</b>（商品の明細画面からでも同じフォームが使えます）</li>
  <li><b>商品を探す。</b>品番でも商品名でも型番でも、一部を打てば候補が出ます。
      候補には<b>商品名と現在庫</b>が並ぶので、品番が合っているかその場で確かめられます。</li>
  <li><b>日付・区分・数量</b>を入れます。日付は今日が最初から入っています。</li>
  <li><b>出庫なら出荷先、入庫なら入庫元</b>を選びます（どちらも任意）。</li>
  <li><b>伝票番号・備考</b>を入れて「登録する」。理論在庫がその場で増減します。</li>
</ol>

<div class="tip">
  <b>間違えたとき。</b>履歴の行の右にある「取消」を押すと、確認のうえ取り消せます。
  在庫も同じだけ戻ります。数量だけ直したいときは、取り消してから入れ直してください。
</div>

<h2>3. 出荷先と入庫元</h2>
<table>
  <tr><th style="width:16%">項目</th><th style="width:16%">つく区分</th><th>選び方</th></tr>
  <tr><td><b>出荷先</b></td><td>出庫のみ</td>
      <td>「出荷先」画面に登録したものから選ぶ。得意先・現場・自社拠点を住所や担当者つきで管理できる</td></tr>
  <tr><td><b>入庫元</b></td><td>入庫のみ</td>
      <td>仕入先マスタと、これまでに入力した入庫元が候補に出る。候補に無い相手も自由に書ける</td></tr>
</table>
<p style="font-size:9.4pt;color:#475569">
  出荷先だけ専用の管理画面があるのは、住所・担当者・電話まで記録して「どこへ何を出したか」を
  集計したいためです。入庫元はほとんどが仕入先なので、二重管理にならないよう文字列で持っています。
</p>

<h3>出荷先別の実績</h3>
<p>
  「入出庫」画面と「出荷先」画面に、<b>直近30日でどこへいくつ出たか</b>が数量・件数・金額（販売単価ベース）で
  出ます。「明細」を押すと、その出荷先の出庫だけに絞った履歴が開きます。
</p>
</div>

<div class="page">
<h2>4. 入出庫を入れると判定も変わる</h2>
<p>
  出庫を1件でも登録した商品は、<b>期間出庫数（直近30日に出た数）を台帳から自動で集計</b>するようになります。
  手で入れる必要がなくなり、実績どおりの発注点が出ます。
</p>
<div class="fig">{SOURCE_SWITCH_SVG}
  <div class="caption"><b>図8</b>　期間出庫数の出どころ。商品ごとに切り替わります。
  一覧では、台帳から集計した値に「台帳」と印が付きます。</div>
</div>

<table>
  <tr><th style="width:26%">項目</th><th style="width:37%">入出庫を登録している商品</th><th>登録していない商品</th></tr>
  <tr><td>理論在庫数</td><td>入出庫のたびに自動で増減</td><td>手入力・CSVの値</td></tr>
  <tr><td>期間出庫数</td><td>直近30日の出庫の合計</td><td>手入力・CSVの値</td></tr>
  <tr><td>最終入庫日 / 最終出庫日</td><td>台帳の最新日</td><td>手入力・CSVの値</td></tr>
</table>

<div class="tip">
  <b>全商品を一度に切り替える必要はありません。</b>
  よく動く商品から入出庫を入れ始めれば、その商品だけ精度が上がります。
  残りは今までどおりCSVの数字で判定され続けます。
</div>

<h2>5. まとめて入れる</h2>
<p>
  販売管理や受発注システムから出した明細があるなら、「取込・書き出し」の<b>入出庫CSV</b>から
  まとめて取り込めます。詳しくは「06 CSV取込と移行」を参照してください。
</p>
</div>
"""


# ══════════════════════════════════════════════════════════════════
# 05 商品とマスタの管理
# ══════════════════════════════════════════════════════════════════

NUMBERING_SVG = """
<svg viewBox="0 0 720 210" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs><marker id="a6" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
    <path d="M0,0 L7,3 L0,6 z" fill="#94a3b8"/></marker></defs>
  <g font-size="9.6">
    <rect x="0" y="40" width="150" height="56" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="75" y="62" text-anchor="middle" fill="#334155">① カテゴリを選ぶ</text>
    <text x="75" y="80" text-anchor="middle" fill="#0f172a" font-weight="700">空調機器</text>

    <rect x="186" y="26" width="196" height="84" rx="6" fill="#f5f3ff" stroke="#7c3aed"/>
    <text x="284" y="46" text-anchor="middle" fill="#6d28d9" font-weight="700">② 採番ルールを探す</text>
    <text x="198" y="66" fill="#334155" font-size="9">カテゴリ専用のルールがあれば それ</text>
    <text x="198" y="81" fill="#334155" font-size="9">無ければ カテゴリ空欄の既定ルール</text>
    <text x="198" y="99" fill="#0f172a" font-size="9">接頭辞 AC ／ 区切り - ／ 4桁 ／ 次の番号 1</text>

    <rect x="418" y="40" width="150" height="56" rx="6" fill="#ecfdf5" stroke="#059669"/>
    <text x="493" y="62" text-anchor="middle" fill="#047857" font-weight="700">③ 発番</text>
    <text x="493" y="84" text-anchor="middle" fill="#0f172a" font-size="13" font-weight="700">AC-0001</text>

    <rect x="604" y="40" width="116" height="56" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="662" y="60" text-anchor="middle" fill="#334155" font-size="9">④ 次の番号が</text>
    <text x="662" y="76" text-anchor="middle" fill="#334155" font-size="9">2 に進む</text>
    <text x="662" y="90" text-anchor="middle" fill="#94a3b8" font-size="8.4">（押した時点で確保）</text>

    <g stroke="#94a3b8" stroke-width="1.3" marker-end="url(#a6)" fill="none">
      <path d="M150,68 L182,68"/>
      <path d="M382,68 L414,68"/>
      <path d="M568,68 L600,68"/>
    </g>

    <rect x="0" y="130" width="720" height="34" rx="5" fill="#fffbeb" stroke="#fcd34d"/>
    <text x="14" y="151" fill="#92400e" font-size="9.2">
      すでに使われている番号（旧シートから取り込んだコードなど）に当たった場合は、空いている番号まで自動で進みます。
    </text>
    <text x="0" y="186" fill="#64748b" font-size="9">
      押した時点で番号を確保するため、登録をやめると欠番になります（二人が同時に登録して同じ番号が出るのを防ぐ作りです）。
    </text>
  </g>
</svg>
"""


def doc05(cover, badge):
    return f"""
<div class="page">
{cover("05", "商品とマスタの管理", "商品の登録（品番の採番）と、仕入先・保管場所・出荷先の管理。")}

<h2>1. 商品を追加する</h2>
<ol class="steps">
  <li>「在庫一覧」→ 右上の<b>「商品を追加」</b></li>
  <li><b>カテゴリを選んでから「採番」を押す</b>と、品番（商品コード）が自動で入ります。
      手で入れてもかまいません。</li>
  <li>商品名・単位・保管場所・仕入先を入れます。仕入先名を選ぶと<b>仕入先コードも一緒に入ります</b>。</li>
  <li><b>発注リードタイム日数</b>を必ず入れます。ここが発注点計算の中核で、空欄だと発注判定が働きません。</li>
  <li>理論在庫数・引当数・期間出庫数などを入れて「保存する」。</li>
</ol>

<h2>2. 品番（商品コード）の採番</h2>
<div class="fig">{NUMBERING_SVG}
  <div class="caption"><b>図9</b>　採番の流れ。ルールは「マスタ」画面のカテゴリごとに設定できます。</div>
</div>

<table>
  <tr><th style="width:18%">設定項目</th><th style="width:22%">例</th><th>意味</th></tr>
  <tr><td>カテゴリ</td><td>空調機器／（空欄）</td><td>空欄の行が既定ルール。専用ルールが無いカテゴリで使われる</td></tr>
  <tr><td>接頭辞</td><td>AC</td><td>品番の先頭に付く文字</td></tr>
  <tr><td>区切り</td><td>-</td><td>接頭辞と連番のあいだの文字。不要なら空欄</td></tr>
  <tr><td>桁数</td><td>4</td><td>連番の桁数。4なら 0001</td></tr>
  <tr><td>次の番号</td><td>1</td><td>次に発番する番号。途中から始めたいときはここを変える</td></tr>
</table>
<p style="font-size:9.4pt;color:#475569">
  入力しながら「次に出る品番」がその場に表示されるので、保存前に確かめられます。
</p>

<div class="note">
  <b>商品コードは後から変えないでください。</b>
  CSV取込の名寄せキーであり、入出庫の履歴もこのコードで結び付いています。
  変えると、旧シートや他システムとの突き合わせができなくなります。
</div>
</div>

<div class="page">
<h2>3. 仕入先・保管場所・出荷先</h2>
<p>
  それぞれ専用ページがあり、<b>一覧＋右上の「＋ 新規登録」</b>という同じ作りです。
  行ごとの「編集」を押したときだけ入力欄に変わります。
</p>

<table>
  <tr><th style="width:18%">画面</th><th style="width:34%">持っている項目</th><th>どこで使われるか</th></tr>
  <tr><td><b>仕入先</b></td><td>名前 / 仕入先コード / 並び順 / 表示</td>
      <td>商品編集の仕入先名の候補（選ぶとコードも入る）。入庫元の候補</td></tr>
  <tr><td><b>保管場所</b></td><td>名前 / 並び順 / 表示</td>
      <td>商品編集の保管場所の候補。在庫一覧の絞り込み</td></tr>
  <tr><td><b>出荷先</b></td><td>名前 / コード / 区分 / 住所 / 担当者 / 電話 / 備考</td>
      <td>出庫を登録するときの選択肢。出荷先別の実績集計</td></tr>
</table>

<div class="warn">
  <b>使われているものは削除できません。</b>
  仕入先・保管場所は「その値を使っている商品が何件あるか」、出荷先は「出庫実績が何件あるか」を
  一覧に出しています。0件のものだけ削除でき、使用中のものは<b>「非表示」に切り替えて</b>運用から外します。
  消してしまうと、その商品や出庫の相手先が宙に浮いた文字列として残ってしまうためです。
</div>

<h3>「マスタ」画面に残っているもの</h3>
<table>
  <tr><th style="width:24%">項目</th><th>内容</th></tr>
  <tr><td>対応状況</td><td>人が選ぶ列。<b>ここに無い値は選べません</b>（表記ゆれが絞り込みを壊すため）。色も指定できる</td></tr>
  <tr><td>カテゴリ</td><td>商品の分類。候補として出るだけで、マスタ外の値も入力できる</td></tr>
  <tr><td>単位</td><td>台・箱・本 など</td></tr>
  <tr><td>品番の採番ルール</td><td>上記の採番設定</td></tr>
</table>
</div>

<div class="page">
<h2>4. 判定パラメータ</h2>
<p>
  全商品に共通で効く設定です。変えると<b>その場で全商品の判定が計算し直されます</b>（保存済みの判定を
  書き換えるのではなく、毎回この値で計算しているためです）。
</p>

<table>
  <tr><th style="width:26%">項目</th><th style="width:10%" class="c">既定</th>
      <th style="width:32%">大きくすると</th><th>小さくすると</th></tr>
  <tr><td>消化傾向の集計期間</td><td class="c">30日</td>
      <td>判定が安定するが、需要の変化に鈍くなる</td><td>季節変動に追従するが、数字がブレやすい</td></tr>
  <tr><td>安全在庫日数（既定値）</td><td class="c">7日</td>
      <td>欠品しにくくなるが、在庫が増える</td><td>在庫は減るが、欠品リスクが上がる</td></tr>
  <tr><td>発注サイクル</td><td class="c">14日</td>
      <td>発注回数は減るが、1回の量と在庫が増える</td><td>こまめな発注になり、事務負荷が上がる</td></tr>
  <tr><td>滞留とみなす日数</td><td class="c">90日</td>
      <td>滞留の警告が出にくくなる</td><td>季節商品が滞留扱いされやすい</td></tr>
  <tr><td>棚卸差異を見逃す範囲</td><td class="c">0</td>
      <td>小さなズレを無視できる</td><td>1個のズレも棚卸差異として出る</td></tr>
</table>

<div class="tip">
  <b>いじる順番。</b>まずは既定のまま1か月運用し、「欠品が出た商品は安全在庫日数を延ばす」
  「毎週同じ商品で発注推奨が出て事務が重い場合は発注サイクルを延ばす」というように、
  実績を見てから1つずつ動かすのが安全です。
</div>

<h3>商品ごとに上書きできる値</h3>
<p>
  安全在庫日数は商品ごとに設定でき、入っていればそちらが優先されます（空欄なら上の既定値）。
  切らすと現場が止まる商品だけ長めにする、といった使い分けができます。
</p>
</div>
"""


# ══════════════════════════════════════════════════════════════════
# 06 CSV取込と移行
# ══════════════════════════════════════════════════════════════════

MIGRATION_SVG = """
<svg viewBox="0 0 720 150" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <defs><marker id="a7" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
    <path d="M0,0 L7,3 L0,6 z" fill="#94a3b8"/></marker></defs>
  <g font-size="9.4">
    <rect x="0" y="30" width="150" height="62" rx="6" fill="#ecfdf5" stroke="#059669"/>
    <text x="75" y="52" text-anchor="middle" font-weight="700" fill="#047857">① 旧シート</text>
    <text x="75" y="70" text-anchor="middle" fill="#334155">ファイル → ダウンロード</text>
    <text x="75" y="84" text-anchor="middle" fill="#334155">→ カンマ区切り(.csv)</text>

    <rect x="186" y="30" width="150" height="62" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="261" y="52" text-anchor="middle" font-weight="700" fill="#334155">② ファイルを選ぶ</text>
    <text x="261" y="70" text-anchor="middle" fill="#334155">見出しの並びは</text>
    <text x="261" y="84" text-anchor="middle" fill="#334155">旧シートのままでよい</text>

    <rect x="372" y="30" width="150" height="62" rx="6" fill="#fffbeb" stroke="#f59e0b"/>
    <text x="447" y="52" text-anchor="middle" font-weight="700" fill="#92400e">③ 内容を確認</text>
    <text x="447" y="70" text-anchor="middle" fill="#334155">新規 / 更新 / エラー</text>
    <text x="447" y="84" text-anchor="middle" fill="#334155">の件数が出る</text>

    <rect x="558" y="30" width="162" height="62" rx="6" fill="#eff6ff" stroke="#3b82f6"/>
    <text x="639" y="52" text-anchor="middle" font-weight="700" fill="#1d4ed8">④ 取り込む</text>
    <text x="639" y="70" text-anchor="middle" fill="#334155">商品コードが一致 → 更新</text>
    <text x="639" y="84" text-anchor="middle" fill="#334155">無ければ → 新規追加</text>

    <g stroke="#94a3b8" stroke-width="1.3" marker-end="url(#a7)" fill="none">
      <path d="M150,61 L182,61"/><path d="M336,61 L368,61"/><path d="M522,61 L554,61"/>
    </g>
    <text x="0" y="122" fill="#64748b" font-size="9">
      自動計算列（有効在庫・発注点・アラート区分など）が入っていても読み飛ばすので、シートをそのまま出して構いません。
    </text>
    <text x="0" y="138" fill="#64748b" font-size="9">
      タブ区切り（シートの範囲をコピーして貼り付け）でも読めます。
    </text>
  </g>
</svg>
"""

PARTIAL_SVG = """
<svg viewBox="0 0 720 176" xmlns="http://www.w3.org/2000/svg" font-family="Hiragino Sans, sans-serif">
  <g font-size="9">
    <text x="0" y="12" font-size="9.6" font-weight="700" fill="#0f172a">
      取り込むCSV（商品コードと期間出庫数だけ）
    </text>
    <rect x="0" y="20" width="300" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="12" y="38" font-family="monospace" fill="#334155">商品コード,期間出庫数(直近30日)</text>
    <text x="12" y="54" font-family="monospace" fill="#334155">DEMO-005,600</text>

    <text x="360" y="12" font-size="9.6" font-weight="700" fill="#0f172a">商品の中身</text>
    <g>
      <rect x="360" y="20" width="360" height="22" fill="#ecfdf5" stroke="#059669"/>
      <text x="372" y="35" fill="#047857">期間出庫数　150 → <tspan font-weight="700">600</tspan> に更新される</text>
      <rect x="360" y="46" width="360" height="22" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="372" y="61" fill="#475569">仕入単価　120 のまま</text>
      <rect x="360" y="72" width="360" height="22" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="372" y="87" fill="#475569">リードタイム　2日 のまま</text>
      <rect x="360" y="98" width="360" height="22" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="372" y="113" fill="#475569">保管場所・仕入先・備考　そのまま</text>
    </g>

    <rect x="0" y="134" width="720" height="34" rx="5" fill="#f0f9ff" stroke="#bae6fd"/>
    <text x="14" y="155" fill="#075985" font-size="9.2">
      CSVに載っていない列は、いまの値のまま残ります。だから「商品コード＋期間出庫数」だけのファイルを毎日流し込めます。
    </text>
  </g>
</svg>
"""


def doc06(cover, badge):
    return f"""
<div class="page">
{cover("06", "CSV取込と移行", "スプレッドシートからの引っ越しと、毎日のデータ取込。")}

<h2>1. 旧スプレッドシートから移す</h2>
<div class="fig">{MIGRATION_SVG}
  <div class="caption"><b>図10</b>　移行の流れ。旧シートを書き出して、そのまま取り込むだけです。</div>
</div>

<ol class="steps">
  <li>旧シートを開き、<b>ファイル → ダウンロード → カンマ区切り形式(.csv)</b></li>
  <li>「取込・書き出し」の<b>商品CSV</b>で、そのファイルを選ぶ</li>
  <li><b>「内容を確認する」</b>を押す。新規・更新・エラー・要確認の件数と、先頭20件が表示される</li>
  <li>問題なければ<b>「◯件を取り込む」</b></li>
</ol>

<table>
  <tr><th style="width:24%">表示</th><th>意味</th></tr>
  <tr><td><b>新規に追加</b></td><td>その商品コードがまだ無い行</td></tr>
  <tr><td><b>既存を更新</b></td><td>商品コードが一致した行。CSVに載っている列だけ上書きする</td></tr>
  <tr><td><b>取り込めない行</b></td><td>商品コードが空、数値や日付が読めない、コードが重複、など。<b>その行だけ飛ばして続行</b></td></tr>
  <tr><td><b>確認が必要</b></td><td>マスタに無いカテゴリ・単位・保管場所・仕入先。取り込んだうえで知らせる</td></tr>
</table>

<div class="note">
  <b>マスタに無い値でも取込は止まりません。</b>
  止めてしまうと移行が進まないためです。取り込んだあとに「確認が必要」の一覧を見て、
  マスタに足すか、商品側の表記を直してください（対応状況だけは選択肢からしか選べません）。
</div>
</div>

<div class="page">
<h2>2. 毎日のデータ取込（部分更新）</h2>
<p>
  <b>CSVに載っていない列は、いまの値のまま残ります。</b>
  だから、販売データから出した「商品コード＋期間出庫数」だけのファイルを毎日流し込めます。
</p>
<div class="fig">{PARTIAL_SVG}
  <div class="caption"><b>図11</b>　部分更新の効き方。単価やリードタイムが0に戻ることはありません。</div>
</div>

<h3>商品CSVで取り込める見出し</h3>
<p style="font-size:9.4pt">
  必須は<b>「商品コード」と「商品名」</b>の2つだけ。並び順は問いません。
</p>
<table>
  <tr><th style="width:24%">区分</th><th>見出し</th></tr>
  <tr><td>対応状況</td><td>対応状況</td></tr>
  <tr><td>基本情報</td><td>商品コード / 商品名 / カテゴリ / 規格・型番 / 単位 / 保管場所</td></tr>
  <tr><td>仕入先・発注条件</td><td>仕入先コード / 仕入先名 / 仕入単価 / 販売単価 / 発注リードタイム日数 / 最小発注数(MOQ) / 発注ロット単位</td></tr>
  <tr><td>在庫状況</td><td>理論在庫数 / 実棚在庫数 / 引当数(受注残) / 発注残数(入荷予定) / 入荷予定日</td></tr>
  <tr><td>消化傾向・発注判定</td><td>期間出庫数(直近30日) / 安全在庫日数</td></tr>
  <tr><td>履歴・管理</td><td>最終入庫日 / 最終出庫日 / 最終棚卸日 / 備考</td></tr>
</table>
<p style="font-size:9.4pt;color:#475569">
  これ以外の見出し（有効在庫数・発注点・アラート区分など、システムが計算する項目）は読み飛ばします。
</p>
</div>

<div class="page">
<h2>3. 入出庫CSV</h2>
<p>販売管理・受発注システムから出した明細を、そのまま台帳に流し込めます。</p>

<table>
  <tr><th style="width:18%">見出し</th><th style="width:12%" class="c">必須</th><th>書き方</th></tr>
  <tr><td>日付</td><td class="c">必須</td><td>2026/09/25 / 2026-09-25 など</td></tr>
  <tr><td>区分</td><td class="c">必須</td><td>入庫 / 出庫 / 調整（入荷・出荷・払出などの言い換えも読む）</td></tr>
  <tr><td>商品コード</td><td class="c">必須</td><td>登録済みの商品コード</td></tr>
  <tr><td>数量</td><td class="c">必須</td><td>入庫・出庫は正の数。減らす調整はマイナス</td></tr>
  <tr><td>出荷先</td><td class="c">—</td><td><b>出庫の行だけ</b>。出荷先マスタの名前</td></tr>
  <tr><td>入庫元</td><td class="c">—</td><td><b>入庫の行だけ</b>。自由入力</td></tr>
  <tr><td>伝票番号 / 備考 / 商品名</td><td class="c">—</td><td>商品名は照合に使わない（人が読むための列）</td></tr>
</table>

<div class="warn">
  <b>入出庫CSVは、1行でも読めない行があると1件も取り込みません。</b>
  在庫を動かす台帳なので、半分だけ入った状態になると理論在庫が合わなくなり、
  後から原因を追えなくなるためです。エラーを直してから、もう一度確認してください。
</div>

<p>
  マスタに無い出荷先があるとエラーになりますが、<b>「マスタに無い出荷先を自動で追加する」</b>に
  チェックを入れると、名前だけの出荷先を作って取り込みます（住所などは後から「出荷先」画面で補えます）。
</p>

<h2>4. 書き出し</h2>
<table>
  <tr><th style="width:30%">ボタン</th><th>出るもの</th></tr>
  <tr><td>全商品をCSVで書き出す</td><td>旧シートと同じ42項目・同じ並び。判定結果（区分・理由・推奨アクション）も含む</td></tr>
  <tr><td>優先度Aだけ書き出す</td><td>今日手を打つ必要がある行だけ</td></tr>
  <tr><td>見出しだけのテンプレート</td><td>新しく作り始めるとき用の空ファイル</td></tr>
  <tr><td>入出庫をCSVで書き出す</td><td>入出庫の履歴（画面で絞り込んだ条件がそのまま反映される）</td></tr>
</table>

<div class="tip">
  <b>在庫一覧からの書き出し。</b>「在庫一覧」の「CSVで書き出す」は、
  いま絞り込んでいる条件のものだけを出します。仕入先ごとの発注リスト作りに使えます。
</div>
</div>
"""
