-- 在庫・発注アラート: マスタの初期値
--
-- スプレッドシートの「マスタ」シート（ensureMasterSheet_ が作っていた5列）をそのまま移したもの。
-- 対応状況の色は、スプシ側で条件付き書式として持っていた色をそのまま持ち込んでいる。
--
-- on conflict do nothing にしてあるのは、運用中に追加された選択肢を
-- 再適用で消さないため（GAS の「マスタシートは既存なら中身に触らない」と同じ考え方）。

insert into inventory_master_options (kind, label, code, color, sort_order) values
  -- 対応状況（人が選ぶ列。表記ゆれが致命的になるのでここだけ厳密に運用する）
  ('status', '即日対応', null, '#ef5350', 10),
  ('status', '要確認',   null, '#ffe599', 20),
  ('status', '発注済み', null, '#c8e6c9', 30),
  ('status', '保留',     null, '#e5e5e5', 40),
  ('status', '廃盤',     null, '#9e9e9e', 50),
  ('status', '発注NG',   null, '#d9d2e9', 60),

  -- カテゴリ（業種に合わせて入れ替える列）
  ('category', '空調機器',     null, null, 10),
  ('category', '配管部材',     null, null, 20),
  ('category', '電材',         null, null, 30),
  ('category', '消耗品',       null, null, 40),
  ('category', '工具',         null, null, 50),
  ('category', '安全用品',     null, null, 60),
  ('category', '部品・補修材', null, null, 70),

  -- 単位
  ('unit', '台',     null, null, 10),
  ('unit', '箱',     null, null, 20),
  ('unit', '本',     null, null, 30),
  ('unit', '個',     null, null, 40),
  ('unit', '枚',     null, null, 50),
  ('unit', '巻',     null, null, 60),
  ('unit', 'm',      null, null, 70),
  ('unit', 'kg',     null, null, 80),
  ('unit', '式',     null, null, 90),
  ('unit', 'セット', null, null, 100),
  ('unit', 'ケース', null, null, 110),

  -- 保管場所
  ('location', '本社倉庫 A-01', null, null, 10),
  ('location', '本社倉庫 A-02', null, null, 20),
  ('location', '本社倉庫 B-01', null, null, 30),
  ('location', '本社倉庫 B-03', null, null, 40),
  ('location', '第二倉庫 C-01', null, null, 50),
  ('location', '外部倉庫',      null, null, 60),
  ('location', '現場直送',      null, null, 70),

  -- 仕入先（スプシ版は名前だけだったが、商品側に仕入先コード列があるので
  --         マスタでコードも持たせ、商品編集画面で自動的に引けるようにする）
  ('supplier', '東和空調機器株式会社',   'S-001', null, 10),
  ('supplier', '関東エアテック株式会社', 'S-002', null, 20),
  ('supplier', '西日本鋼材株式会社',     'S-003', null, 30),
  ('supplier', '株式会社ミドリ資材',     'S-004', null, 40),
  ('supplier', 'ノースサプライ株式会社', 'S-005', null, 50)
on conflict (kind, label) do nothing;
