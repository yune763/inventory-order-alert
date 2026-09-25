/**
 * 在庫・発注アラート  Google Apps Script
 *
 * 使い方
 *  1. 対象スプレッドシートを開く → 拡張機能 → Apps Script
 *  2. このファイルの内容を貼り付けて保存
 *  3. スプレッドシートを再読み込み → メニュー「在庫アラート」が出る
 *  4. 「① 1行目（項目）をセットアップ」→「② 再計算＆アラート判定」
 */

const SHEET_NAME = '在庫・発注アラート';
const MASTER_SHEET = 'マスタ';   // プルダウンの選択肢を一元管理するシート

/** チューニング用パラメータ（運用しながら調整する） */
const CONFIG = {
  DEMAND_WINDOW_DAYS: 30,   // 平均日次出庫を出す対象期間（日）
  DEFAULT_SAFETY_DAYS: 7,   // 安全在庫日数の既定値（F列で品目ごとに上書き可）
  ORDER_CYCLE_DAYS: 14,     // 発注サイクル＝何日分まとめて補充するか
  DEAD_STOCK_DAYS: 90,      // 何日出庫が無ければ滞留在庫とみなすか
  COUNT_DIFF_TOLERANCE: 0,  // 棚卸差異をアラートにする絶対値の閾値
  NO_MOVE_DAYS: 9999        // 出庫実績ゼロ品の在庫日数の代用値
};

/** 1行目に入れる項目（この並び順がそのまま列番号になる） */
const HEADERS = [
  '対応状況',
  '商品コード', '商品名', 'カテゴリ', '規格・型番', '単位', '保管場所',
  '仕入先コード', '仕入先名', '仕入単価', '販売単価',
  '発注リードタイム日数', '最小発注数(MOQ)', '発注ロット単位',
  '理論在庫数', '実棚在庫数', '棚卸差異', '引当数(受注残)', '発注残数(入荷予定)',
  '有効在庫数', '入荷予定日', '在庫金額',
  '期間出庫数(直近30日)', '平均日次出庫数', '在庫日数', '欠品予測日',
  '安全在庫日数', '安全在庫数', '発注点', '適正在庫上限', '発注推奨数', '発注期限日',
  'アラート区分', '優先度', 'アラート理由', '推奨アクション',
  '最終入庫日', '最終出庫日', '最終棚卸日', '滞留日数', '備考', '更新日時'
];

/** 列番号（1始まり）。HEADERS の並びと必ず一致させること */
const C = {
  STATUS: 1,
  CODE: 2, NAME: 3, CATEGORY: 4, SPEC: 5, UNIT: 6, LOCATION: 7,
  SUP_CODE: 8, SUP_NAME: 9, COST: 10, PRICE: 11,
  LEAD_TIME: 12, MOQ: 13, LOT: 14,
  BOOK_QTY: 15, COUNT_QTY: 16, COUNT_DIFF: 17, ALLOCATED: 18, ON_ORDER: 19,
  AVAILABLE: 20, ETA: 21, STOCK_VALUE: 22,
  OUT_QTY: 23, DAILY_OUT: 24, DAYS_OF_STOCK: 25, STOCKOUT_DATE: 26,
  SAFETY_DAYS: 27, SAFETY_QTY: 28, ROP: 29, MAX_QTY: 30, ORDER_QTY: 31, ORDER_DUE: 32,
  ALERT: 33, PRIORITY: 34, REASON: 35, ACTION: 36,
  LAST_IN: 37, LAST_OUT: 38, LAST_COUNT: 39, IDLE_DAYS: 40, NOTE: 41, UPDATED_AT: 42
};

/** 入力列＝人／CSV取込が埋める列。それ以外は再計算で上書きされる */
const INPUT_COLS = [
  C.STATUS,
  C.CODE, C.NAME, C.CATEGORY, C.SPEC, C.UNIT, C.LOCATION,
  C.SUP_CODE, C.SUP_NAME, C.COST, C.PRICE,
  C.LEAD_TIME, C.MOQ, C.LOT,
  C.BOOK_QTY, C.COUNT_QTY, C.ALLOCATED, C.ON_ORDER, C.ETA,
  C.OUT_QTY, C.SAFETY_DAYS, C.LAST_IN, C.LAST_OUT, C.LAST_COUNT, C.NOTE
];

/**
 * 再計算が絶対に上書きしない列。
 *  対応状況 … 人が判断して動かす列
 *  アラート区分 … シート側の ARRAYFORMULA が出力している列
 * ここを外すと、recalcAll を1回走らせただけで手入力と数式が値で潰れる。
 */
const PROTECTED_COLS = [C.STATUS, C.ALERT];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('在庫アラート')
    .addItem('① 1行目（項目）をセットアップ', 'setupHeaders')
    .addItem('② 再計算＆アラート判定', 'recalcAll')
    .addSeparator()
    .addItem('アラートをメール送信', 'sendAlertMail')
    .addToUi();
}

/* ===================== ① 1行目のセットアップ ===================== */

function setupHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }

  const head = sheet.getRange(1, 1, 1, HEADERS.length);
  head.setValues([HEADERS])
      .setFontWeight('bold')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true);

  // 役割ごとに色分け：入力列と自動計算列が一目で分かるようにする
  const groups = [
    { from: C.STATUS,     to: C.STATUS,    color: '#263238' }, // 対応状況
    { from: C.CODE,       to: C.LOCATION,  color: '#37474f' }, // 基本情報
    { from: C.SUP_CODE,   to: C.LOT,       color: '#00695c' }, // 仕入先・発注条件
    { from: C.BOOK_QTY,   to: C.STOCK_VALUE, color: '#1565c0' }, // 在庫状況
    { from: C.OUT_QTY,    to: C.STOCKOUT_DATE, color: '#6a1b9a' }, // 消化傾向
    { from: C.SAFETY_DAYS, to: C.ORDER_DUE, color: '#ef6c00' }, // 発注判定
    { from: C.ALERT,      to: C.ACTION,    color: '#c62828' }, // アラート
    { from: C.LAST_IN,    to: C.UPDATED_AT, color: '#546e7a' }  // 履歴・管理
  ];
  groups.forEach(function (g) {
    sheet.getRange(1, g.from, 1, g.to - g.from + 1).setBackground(g.color);
  });

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);  // 対応状況・商品コード・商品名
  sheet.setRowHeight(1, 46);
  sheet.getRange(1, 1, 1, HEADERS.length).createFilter();

  ensureMasterSheet_(ss);
  applyFormats_(sheet);
  applyConditionalFormats_(sheet);
  SpreadsheetApp.getUi().alert('1行目に ' + HEADERS.length + ' 項目をセットしました。');
}

/** 列ごとの表示形式と入力規則 */
function applyFormats_(sheet) {
  const last = Math.max(sheet.getMaxRows() - 1, 1000);
  const col = function (c) { return sheet.getRange(2, c, last, 1); };

  [C.COST, C.PRICE, C.STOCK_VALUE].forEach(function (c) { col(c).setNumberFormat('¥#,##0'); });
  [C.BOOK_QTY, C.COUNT_QTY, C.COUNT_DIFF, C.ALLOCATED, C.ON_ORDER, C.AVAILABLE,
   C.OUT_QTY, C.SAFETY_QTY, C.ROP, C.MAX_QTY, C.ORDER_QTY, C.MOQ, C.LOT,
   C.LEAD_TIME, C.SAFETY_DAYS, C.IDLE_DAYS].forEach(function (c) { col(c).setNumberFormat('#,##0'); });
  [C.DAILY_OUT, C.DAYS_OF_STOCK].forEach(function (c) { col(c).setNumberFormat('#,##0.0'); });
  [C.ETA, C.STOCKOUT_DATE, C.ORDER_DUE, C.LAST_IN, C.LAST_OUT, C.LAST_COUNT]
    .forEach(function (c) { col(c).setNumberFormat('yyyy/mm/dd'); });
  col(C.UPDATED_AT).setNumberFormat('yyyy/mm/dd hh:mm');

  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['A:即日対応', 'B:3日以内', 'C:要確認', '-'], true)
    .setAllowInvalid(true).build();
  col(C.PRIORITY).setDataValidation(priorityRule);

  // プルダウンの選択肢は「マスタ」シートを参照する。
  // 仕入先やカテゴリが増えたらマスタに1行足すだけで全行に反映される。
  const master = sheet.getParent().getSheetByName(MASTER_SHEET);
  if (!master) return;
  const listRule = function (letter, strict) {
    return SpreadsheetApp.newDataValidation()
      .requireValueInRange(master.getRange(letter + '2:' + letter), true)
      .setAllowInvalid(!strict).build();
  };
  col(C.STATUS).setDataValidation(listRule('A', true));    // 人が選ぶ列。表記ゆれを防ぐため制限する
  col(C.CATEGORY).setDataValidation(listRule('B', false)); // 取込で新しい値が来ても止めない
  col(C.UNIT).setDataValidation(listRule('C', false));
  col(C.LOCATION).setDataValidation(listRule('D', false));
  col(C.SUP_NAME).setDataValidation(listRule('E', false));
}

/** プルダウンの選択肢を持つ「マスタ」シートを用意する（無ければ作る） */
function ensureMasterSheet_(ss) {
  const lists = [
    ['対応状況', ['即日対応', '要確認', '発注済み', '保留', '廃盤', '発注NG']],
    ['カテゴリ', ['空調機器', '配管部材', '電材', '消耗品', '工具', '安全用品', '部品・補修材']],
    ['単位',     ['台', '箱', '本', '個', '枚', '巻', 'm', 'kg', '式', 'セット', 'ケース']],
    ['保管場所', ['本社倉庫 A-01', '本社倉庫 A-02', '本社倉庫 B-01', '本社倉庫 B-03',
                 '第二倉庫 C-01', '外部倉庫', '現場直送']],
    ['仕入先名', ['東和空調機器株式会社', '関東エアテック株式会社', '西日本鋼材株式会社',
                 '株式会社ミドリ資材', 'ノースサプライ株式会社']]
  ];
  let master = ss.getSheetByName(MASTER_SHEET);
  if (master) return master;   // 既にあれば中身は触らない（運用中の追加を消さないため）

  master = ss.insertSheet(MASTER_SHEET);
  const rows = Math.max.apply(null, lists.map(function (l) { return l[1].length; }));
  const grid = [lists.map(function (l) { return l[0]; })];
  for (let i = 0; i < rows; i++) {
    grid.push(lists.map(function (l) { return l[1][i] || ''; }));
  }
  master.getRange(1, 1, grid.length, lists.length).setValues(grid);
  master.getRange(1, 1, 1, lists.length)
        .setFontWeight('bold').setBackground('#d9ead3').setHorizontalAlignment('center');
  master.setFrozenRows(1);
  master.autoResizeColumns(1, lists.length);
  return master;
}

/**
 * 条件付き書式をまとめて作り直す。
 * setConditionalFormatRules は既存ルールを全置換するので、
 * シート側で手を入れたものも含めてここに集約しておく。
 */
function applyConditionalFormats_(sheet) {
  const last = Math.max(sheet.getMaxRows() - 1, 1000);
  const colRange = function (c) { return sheet.getRange(2, c, last, 1); };
  const rules = [];
  const paint = function (range, text, bg, fg, bold) {
    const b = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(text).setBackground(bg).setFontColor(fg).setRanges([range]);
    if (bold) b.setBold(true);
    rules.push(b.build());
  };

  // ① 対応状況（人が選ぶ列）
  const st = colRange(C.STATUS);
  paint(st, '即日対応', '#ef5350', '#ffffff', true);
  paint(st, '要確認',   '#ffe599', '#5a4000', true);
  paint(st, '発注済み', '#c8e6c9', '#1b5e20', true);
  paint(st, '保留',     '#e5e5e5', '#595959', true);
  paint(st, '廃盤',     '#9e9e9e', '#ffffff', true);
  paint(st, '発注NG',   '#d9d2e9', '#5a338c', true);

  // ② アラート区分（シート側の数式が出力する列）
  const al = colRange(C.ALERT);
  paint(al, '欠品',       '#b71c1c', '#ffffff');
  paint(al, '発注漏れ',   '#d32f2f', '#ffffff');
  paint(al, '欠品リスク', '#ef6c00', '#ffffff');
  paint(al, '発注推奨',   '#f9a825', '#000000');
  paint(al, '入荷遅延',   '#7b1fa2', '#ffffff');
  paint(al, '過剰在庫',   '#0277bd', '#ffffff');
  paint(al, '滞留在庫',   '#455a64', '#ffffff');
  paint(al, '棚卸差異',   '#5d4037', '#ffffff');
  paint(al, '正常',       '#e8f5e9', '#1b5e20');

  // ③ 優先度。値は 'A:即日対応' の形なので前方一致で判定する
  const pr = colRange(C.PRIORITY);
  [['A', '#f4cccc', '#990000'], ['B', '#ffedc2', '#7f6000'], ['C', '#d8e6f4', '#1c4587']]
    .forEach(function (x) {
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith(x[0]).setBackground(x[1]).setFontColor(x[2])
        .setBold(true).setRanges([pr]).build());
    });

  // ④ 発注漏れは行ごと赤く。アラート区分の列だけを見て A〜末尾まで塗る
  const alertCol = sheet.getRange(2, C.ALERT).getA1Notation().replace(/^([A-Z]+)/, '$$$1');
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=' + alertCol + '="発注漏れ"')
    .setBackground('#fce8e6').setFontColor('#a50e0e')
    .setRanges([sheet.getRange(2, 1, last, HEADERS.length)]).build());

  sheet.setConditionalFormatRules(rules);
}

/* ===================== ② 再計算＆アラート判定 ===================== */

function recalcAll() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('データ行がありません。'); return; }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const today = startOfDay_(new Date());
  const now = new Date();

  const out = rows.map(function (r) {
    if (!r[C.CODE - 1] && !r[C.NAME - 1]) return r; // 空行はそのまま
    return evaluateRow_(r, today, now);
  });

  writeBack_(sheet, out);
  SpreadsheetApp.getActiveSpreadsheet().toast(out.length + ' 行を再計算しました', '在庫アラート', 5);
}

/**
 * 計算結果を書き戻す。PROTECTED_COLS を飛ばし、連続する範囲ごとに setValues する。
 * 行まるごと setValues すると対応状況（手入力）とアラート区分（数式）が値で潰れる。
 */
function writeBack_(sheet, out) {
  if (!out.length) return;
  const skip = {};
  PROTECTED_COLS.forEach(function (c) { skip[c] = true; });

  let start = 0;   // 書き込み中の連続範囲の開始列（0 = 未開始）
  for (let c = 1; c <= HEADERS.length + 1; c++) {
    if (c <= HEADERS.length && !skip[c]) {
      if (!start) start = c;
      continue;
    }
    if (start) {
      const width = c - start;
      const from = start;
      sheet.getRange(2, from, out.length, width).setValues(out.map(function (r) {
        return r.slice(from - 1, from - 1 + width);
      }));
      start = 0;
    }
  }
}

/**
 * 1行分の在庫指標を計算し、アラート区分・優先度・推奨アクションを決める。
 * r は 0 始まりの配列（C.XXX - 1 でアクセス）
 */
function evaluateRow_(r, today, now) {
  const num = function (c) { return toNumber_(r[c - 1]); };
  const date = function (c) { return toDate_(r[c - 1]); };

  const leadTime   = num(C.LEAD_TIME) || 0;
  const moq        = num(C.MOQ) || 0;
  const lot        = num(C.LOT) || 1;
  const bookQty    = num(C.BOOK_QTY);
  const countQty   = r[C.COUNT_QTY - 1] === '' ? null : num(C.COUNT_QTY);
  const allocated  = num(C.ALLOCATED);
  const onOrder    = num(C.ON_ORDER);
  const outQty     = num(C.OUT_QTY);
  const cost       = num(C.COST);
  const safetyDays = num(C.SAFETY_DAYS) || CONFIG.DEFAULT_SAFETY_DAYS;

  // --- 在庫 ---
  // 実棚があれば実棚を正とする（無ければ理論在庫）
  const physical = countQty === null ? bookQty : countQty;
  const countDiff = countQty === null ? '' : round_(countQty - bookQty, 0);
  const available = round_(physical - allocated, 2);          // 有効在庫＝手持ち−引当
  const position  = available + onOrder;                       // 在庫ポジション＝有効在庫＋発注残
  const stockValue = round_(available * cost, 0);

  // --- 消化傾向 ---
  const dailyOut = round_(outQty / CONFIG.DEMAND_WINDOW_DAYS, 3);
  const daysOfStock = dailyOut > 0
    ? round_(available / dailyOut, 1)
    : (available > 0 ? CONFIG.NO_MOVE_DAYS : 0);
  const stockoutDate = dailyOut > 0 ? addDays_(today, Math.floor(available / dailyOut)) : '';

  // --- 発注判定 ---
  // 発注点＝リードタイム中の消費 ＋ 安全在庫
  const safetyQty = round_(dailyOut * safetyDays, 0);
  const rop       = round_(dailyOut * leadTime + safetyQty, 0);
  const maxQty    = round_(dailyOut * (leadTime + safetyDays + CONFIG.ORDER_CYCLE_DAYS), 0);
  // 発注推奨数＝上限まで戻す量を MOQ とロット単位に丸める
  let orderQty = 0;
  if (position <= rop) {
    const gap = Math.max(maxQty - position, 0);
    orderQty = Math.max(gap, moq);
    if (lot > 1) orderQty = Math.ceil(orderQty / lot) * lot;
    orderQty = Math.max(round_(orderQty, 0), 0);
  }
  // 発注期限日＝欠品予測日からリードタイムを引いた日（この日を過ぎると間に合わない）
  const orderDue = (dailyOut > 0 && stockoutDate) ? addDays_(stockoutDate, -leadTime) : '';

  // --- 履歴 ---
  const lastOut = date(C.LAST_OUT);
  const idleDays = lastOut ? Math.floor(diffDays_(today, lastOut)) : '';
  const eta = date(C.ETA);

  // --- アラート判定（上から順に見て、最初に当たった重いものを採用する） ---
  const reasons = [];
  let alert = '正常';
  let priority = '-';
  let action = '';

  if (available <= 0) {
    alert = '欠品'; priority = 'A:即日対応';
    reasons.push('有効在庫が0以下（引当済' + allocated + '）');
    action = onOrder > 0
      ? '入荷予定(' + fmtDate_(eta) + ')を前倒し依頼／代替品を手配'
      : '至急 ' + Math.max(orderQty, moq) + ' 発注';
  } else if (onOrder <= 0 && position <= rop && orderDue && orderDue < today) {
    alert = '発注漏れ'; priority = 'A:即日対応';
    reasons.push('発注点割れなのに発注残0、発注期限(' + fmtDate_(orderDue) + ')超過');
    action = '本日中に ' + orderQty + ' 発注（リードタイム' + leadTime + '日）';
  } else if (dailyOut > 0 && daysOfStock <= leadTime) {
    alert = '欠品リスク'; priority = 'A:即日対応';
    reasons.push('在庫日数' + daysOfStock + '日 ≦ リードタイム' + leadTime + '日');
    action = orderQty > 0 ? orderQty + ' を即発注' : '入荷予定を前倒し確認';
  } else if (eta && eta < today && onOrder > 0) {
    alert = '入荷遅延'; priority = 'B:3日以内';
    reasons.push('入荷予定日(' + fmtDate_(eta) + ')超過、未入庫' + onOrder);
    action = '仕入先へ納期照会';
  } else if (position <= rop) {
    alert = '発注推奨'; priority = 'B:3日以内';
    reasons.push('在庫ポジション' + position + ' ≦ 発注点' + rop);
    action = orderQty + ' を発注（期限 ' + fmtDate_(orderDue) + '）';
  } else if (maxQty > 0 && available > maxQty) {
    alert = '過剰在庫'; priority = 'C:要確認';
    reasons.push('有効在庫' + available + ' > 適正上限' + maxQty + '（' + daysOfStock + '日分）');
    action = '発注停止・販促／他拠点へ移管';
  } else if (idleDays !== '' && idleDays >= CONFIG.DEAD_STOCK_DAYS && available > 0) {
    alert = '滞留在庫'; priority = 'C:要確認';
    reasons.push(idleDays + '日間 出庫なし');
    action = '処分・値下げ・返品を検討';
  } else if (countDiff !== '' && Math.abs(countDiff) > CONFIG.COUNT_DIFF_TOLERANCE) {
    alert = '棚卸差異'; priority = 'C:要確認';
    reasons.push('理論' + bookQty + ' / 実棚' + countQty + '（差異' + countDiff + '）');
    action = '入出庫履歴を照合し理論在庫を修正';
  }

  // 正常でも棚卸差異があれば理由に残す
  if (alert !== '棚卸差異' && countDiff !== '' && Math.abs(countDiff) > CONFIG.COUNT_DIFF_TOLERANCE) {
    reasons.push('棚卸差異' + countDiff);
  }

  r[C.COUNT_DIFF - 1]    = countDiff;
  r[C.AVAILABLE - 1]     = available;
  r[C.STOCK_VALUE - 1]   = stockValue;
  r[C.DAILY_OUT - 1]     = dailyOut;
  r[C.DAYS_OF_STOCK - 1] = daysOfStock;
  r[C.STOCKOUT_DATE - 1] = stockoutDate;
  r[C.SAFETY_DAYS - 1]   = safetyDays;
  r[C.SAFETY_QTY - 1]    = safetyQty;
  r[C.ROP - 1]           = rop;
  r[C.MAX_QTY - 1]       = maxQty;
  r[C.ORDER_QTY - 1]     = orderQty;
  r[C.ORDER_DUE - 1]     = orderDue;
  r[C.ALERT - 1]         = alert;
  r[C.PRIORITY - 1]      = priority;
  r[C.REASON - 1]        = reasons.join(' / ');
  r[C.ACTION - 1]        = action;
  r[C.IDLE_DAYS - 1]     = idleDays;
  r[C.UPDATED_AT - 1]    = now;
  return r;
}

/* ===================== アラート通知 ===================== */

/** 優先度A/Bのアラートをまとめてメールする。日次トリガーに登録して使う */
function sendAlertMail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const targets = rows.filter(function (r) {
    const p = String(r[C.PRIORITY - 1] || '');
    return p.indexOf('A:') === 0 || p.indexOf('B:') === 0;
  });
  if (!targets.length) return;

  const lines = targets
    .sort(function (a, b) { return String(a[C.PRIORITY - 1]).localeCompare(String(b[C.PRIORITY - 1])); })
    .map(function (r) {
      return [
        '[' + r[C.PRIORITY - 1] + '] ' + r[C.ALERT - 1],
        r[C.CODE - 1] + ' ' + r[C.NAME - 1],
        '有効在庫 ' + r[C.AVAILABLE - 1] + ' / 発注点 ' + r[C.ROP - 1],
        '推奨発注 ' + r[C.ORDER_QTY - 1] + ' → ' + r[C.SUP_NAME - 1],
        r[C.ACTION - 1]
      ].join(' | ');
    });

  const subject = '【在庫アラート】要対応 ' + targets.length + '件 ' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
  const body = lines.join('\n') + '\n\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body);
}

/** 毎朝8時に再計算＋通知するトリガーを作る（1回だけ実行すればよい） */
function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyJob') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyJob').timeBased().atHour(8).everyDays(1).create();
}

function dailyJob() {
  recalcAll();
  sendAlertMail();
}

/* ===================== ユーティリティ ===================== */

function toNumber_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/[,¥\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

function toDate_(v) {
  if (!v) return null;
  const d = (v instanceof Date) ? v : new Date(v);
  return isNaN(d.getTime()) ? null : startOfDay_(d);
}

function startOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays_(d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function diffDays_(a, b) { return (a.getTime() - b.getTime()) / 86400000; }
function round_(n, digits) { const p = Math.pow(10, digits); return Math.round(n * p) / p; }
function fmtDate_(d) {
  return d ? Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/MM/dd') : '未定';
}
