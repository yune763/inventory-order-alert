-- 在庫・発注アラート: 入出庫台帳のサンプル（DEMO-010 の分だけ）
--
-- DEMO-001〜009 はあえて台帳を持たせていない。
-- 「入出庫を登録していない商品は手入力値で判定する」という後方互換の動きを、
-- 同じ画面で見比べられるようにするため。
--
-- 何度流しても増えないよう、その商品に台帳が1件も無いときだけ入れる。
-- 消すとき: delete from inventory_movements m using inventory_items i
--           where m.item_id = i.id and i.code = 'DEMO-010';

with target as (
  select i.id
    from inventory_items i
   where i.code = 'DEMO-010'
     and not exists (select 1 from inventory_movements m where m.item_id = i.id)
),
entries (days_ago, kind, quantity, destination_name, slip_no, note) as (
  values
    (40, 'in',      600::numeric, null::text,               'IN-1001', '定期補充'::text),
    (22, 'out',     120::numeric, '株式会社山田工務店',       'OUT-2001', null),
    (15, 'out',      90::numeric, '中央病院 空調更新工事',    'OUT-2002', '追加分'),
    ( 8, 'out',     150::numeric, 'みどり建設株式会社',       'OUT-2003', null),
    ( 5, 'adjust',  -10::numeric, null::text,               'ADJ-3001', '棚卸で不足10個を反映'),
    ( 3, 'out',     100::numeric, 'さくらマンション B棟',     'OUT-2004', null)
)
insert into inventory_movements (item_id, moved_on, kind, quantity, destination_id, slip_no, note)
select t.id,
       current_date - e.days_ago,
       e.kind,
       e.quantity,
       d.id,
       e.slip_no,
       e.note
  from target t
 cross join entries e
  left join inventory_destinations d on d.name = e.destination_name;
