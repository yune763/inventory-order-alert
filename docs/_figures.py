"""説明資料で使う図。外部ライブラリを使わず、その場に書いたSVGで描いている
（PDFにしたときに欠けないようにするため）。"""

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
