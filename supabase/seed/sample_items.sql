-- 在庫・発注アラート: 動作確認用のサンプル商品（本番では流し込まない）
--
-- 9行それぞれが別のアラート区分に落ちるように数値を組んである。
-- 日付は current_date 基準の相対指定なので、いつ流しても同じ判定になる。
--   欠品(A) / 発注漏れ(A) / 欠品リスク(A) / 入荷遅延(B) / 発注推奨(B)
--   過剰在庫(C) / 滞留在庫(C) / 棚卸差異(C) / 正常(-)
--
-- 消すとき: delete from inventory_items where code like 'DEMO-%';

insert into inventory_items
  (code, name, category, spec, unit, location, supplier_code, supplier_name,
   cost, price, lead_time_days, moq, lot,
   book_qty, count_qty, allocated_qty, on_order_qty, eta,
   out_qty_window, safety_days, last_in_date, last_out_date, last_count_date, status, note)
values
  -- 欠品(A): 有効在庫が0以下
  ('DEMO-001', 'ルームエアコン 2.8kW', '空調機器', 'RAS-286D', '台', '本社倉庫 A-01',
   'S-001', '東和空調機器株式会社',
   68000, 98000, 7, 5, 5,
   2, null, 4, 0, null,
   90, 7, current_date - 20, current_date - 1, null, null, null),

  -- 発注漏れ(A): 発注点割れ・発注残0・発注期限を過ぎている
  ('DEMO-002', '銅管 3分 20mコイル', '配管部材', 'CU-3-20M', '巻', '本社倉庫 B-01',
   'S-003', '西日本鋼材株式会社',
   9800, 14500, 7, 10, 5,
   60, null, 10, 0, null,
   300, 7, current_date - 30, current_date - 2, null, null, null),

  -- 欠品リスク(A): 在庫日数がリードタイムを下回る（発注残があるので発注漏れにはならない）
  ('DEMO-003', 'ドレンホース 20m', '配管部材', 'DH-20', '巻', '本社倉庫 B-03',
   'S-003', '西日本鋼材株式会社',
   2400, 3800, 10, 20, 10,
   80, null, 20, 40, current_date + 6,
   600, 7, current_date - 12, current_date - 1, null, '発注済み', null),

  -- 入荷遅延(B): 入荷予定日を過ぎても未入庫（在庫日数はリードタイムより長い）
  ('DEMO-004', '電線 VVF 1.6-2C 100m', '電材', 'VVF16-2C', '巻', '本社倉庫 A-02',
   'S-005', 'ノースサプライ株式会社',
   7200, 11000, 10, 10, 10,
   40, null, 0, 30, current_date - 3,
   60, 7, current_date - 40, current_date - 3, null, '発注済み', null),

  -- 発注推奨(B): 発注点を割ったが、発注期限にはまだ余裕がある
  ('DEMO-005', 'ビニルテープ 19mm', '消耗品', 'VT-19', '巻', '本社倉庫 A-02',
   'S-004', '株式会社ミドリ資材',
   120, 260, 2, 50, 50,
   40, null, 0, 0, null,
   150, 7, current_date - 15, current_date - 1, null, null, null),

  -- 過剰在庫(C): 適正在庫上限を大きく超えている
  ('DEMO-006', 'エアコン用化粧カバー 2m', '部品・補修材', 'CV-2M', '本', '第二倉庫 C-01',
   'S-001', '東和空調機器株式会社',
   1800, 3200, 5, 10, 10,
   200, null, 0, 0, null,
   30, 7, current_date - 60, current_date - 4, null, null, '季節外れの大量仕入れ分'),

  -- 滞留在庫(C): 90日以上出庫が無い（出庫実績ゼロなので発注判定は動かない）
  ('DEMO-007', '旧型リモコン RC-200', '部品・補修材', 'RC-200', '個', '外部倉庫',
   'S-002', '関東エアテック株式会社',
   3400, 5200, 14, 5, 5,
   30, null, 0, 0, null,
   0, 7, current_date - 400, current_date - 150, current_date - 30, '廃盤', '後継機 RC-300 へ切替済み'),

  -- 棚卸差異(C): 実棚と理論が合わない
  ('DEMO-008', '冷媒 R32 10kg', '空調機器', 'R32-10', '本', '本社倉庫 A-01',
   'S-002', '関東エアテック株式会社',
   14500, 21000, 3, 5, 5,
   22, 20, 0, 0, null,
   30, 7, current_date - 10, current_date - 2, current_date - 1, '要確認', null),

  -- 正常(-): 発注点と適正在庫上限の間に収まっている
  ('DEMO-009', 'インシュロック 200mm 100本', '消耗品', 'IL-200', '箱', '本社倉庫 A-02',
   'S-004', '株式会社ミドリ資材',
   380, 700, 4, 20, 20,
   40, null, 0, 0, null,
   60, 7, current_date - 8, current_date - 1, null, null, null),

  -- 入出庫台帳だけで動かす商品（sample_movements.sql が入出庫を入れる）。
  -- 理論在庫・期間出庫数・最終入出庫日を手入力していないのはこの行だけで、
  -- 全て台帳から積み上がる。
  ('DEMO-010', '配管化粧カバー ジョイント', '部品・補修材', 'JT-75', '個', '本社倉庫 A-02',
   'S-004', '株式会社ミドリ資材',
   450, 900, 5, 50, 50,
   0, null, 0, 0, null,
   0, 7, null, null, null, null, '入出庫から自動計算')
on conflict (code) do nothing;
