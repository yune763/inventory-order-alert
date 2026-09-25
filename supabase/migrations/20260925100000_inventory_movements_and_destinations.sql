-- 在庫・発注アラート: 入出庫台帳と出荷先
--
-- ここまでは「今いくつあるか（理論在庫数）」と「直近30日で何個出たか（期間出庫数）」を
-- 人が直接入れていた。この2つを、1件ずつの入出庫から積み上げられるようにする。
--
-- 考え方
--   理論在庫数   … inventory_items.book_qty が現在の残数。入出庫を登録すると
--                  トリガーが増減させる（台帳の合計を毎回数え直すのではなく、残高を持つ）
--   期間出庫数   … 判定ビューが「直近N日の出庫の合計」を毎回数える。
--                  出庫を1件も登録していない商品は、これまでどおり手入力値を使う（後方互換）
--   最終入出庫日 … 台帳にあればその日付、無ければ手入力値

-- ── 出荷先 ────────────────────────────────────────────────────────
-- 仕入先はマスタ（inventory_master_options）の1種類として持っているが、
-- 出荷先は住所・担当者まで持たせたいので独立したテーブルにする。
create table if not exists inventory_destinations (
  id         uuid primary key default gen_random_uuid(),
  code       text unique,                                        -- 出荷先コード
  name       text not null unique check (length(trim(name)) > 0), -- 出荷先名
  kind       text,          -- 得意先 / 現場 / 自社拠点 など。集計の切り口に使う
  address    text,
  contact    text,          -- 担当者
  phone      text,
  note       text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_destinations_active_idx
  on inventory_destinations (is_active, sort_order, name);

drop trigger if exists inventory_destinations_set_updated_at on inventory_destinations;
create trigger inventory_destinations_set_updated_at
  before update on inventory_destinations
  for each row execute function inventory_set_updated_at();

-- ── 入出庫 ────────────────────────────────────────────────────────
create table if not exists inventory_movements (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references inventory_items(id) on delete cascade,
  moved_on   date not null default current_date,
  kind       text not null check (kind in ('in', 'out', 'adjust')),  -- 入庫 / 出庫 / 調整

  -- 入庫・出庫は「何個動いたか」なので正の数。
  -- 調整（棚卸差異の反映など）だけ符号つきで、マイナスも受け付ける。
  quantity   numeric not null check (quantity <> 0),

  -- 出荷先は出庫のときだけ記録する。入庫元は商品側の仕入先で足りるため持たない。
  destination_id uuid references inventory_destinations(id) on delete set null,

  slip_no    text,   -- 伝票番号・受注番号
  note       text,
  created_at timestamptz not null default now(),

  constraint inventory_movements_in_positive     check (kind <> 'in'  or quantity > 0),
  constraint inventory_movements_out_positive    check (kind <> 'out' or quantity > 0),
  constraint inventory_movements_dest_only_out   check (kind = 'out' or destination_id is null)
);

-- 在庫への効き方。出庫だけが減らす
-- （create table if not exists では既存テーブルに列が足されないので、ここで別に足す）
alter table inventory_movements
  add column if not exists signed_qty numeric
  generated always as (case when kind = 'out' then -quantity else quantity end) stored;

create index if not exists inventory_movements_item_idx on inventory_movements (item_id, moved_on desc);
create index if not exists inventory_movements_date_idx on inventory_movements (moved_on desc);
create index if not exists inventory_movements_dest_idx on inventory_movements (destination_id, moved_on desc);

/**
 * 入出庫を登録・修正・削除したら、その差分だけ理論在庫数を動かす。
 *
 * 台帳の合計を毎回数え直す方式にしないのは、過去分をCSVで流し込んだときに
 * 「今の残数」が過去の合計で上書きされてしまうため。残数は残数として持ち、
 * 台帳はそれを動かした履歴として持つ。
 */
create or replace function inventory_apply_movement()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update inventory_items set book_qty = book_qty + new.signed_qty where id = new.item_id;
  elsif (tg_op = 'DELETE') then
    update inventory_items set book_qty = book_qty - old.signed_qty where id = old.item_id;
  elsif (tg_op = 'UPDATE') then
    -- 商品を付け替えた場合も正しく戻せるよう、古い分を引いてから新しい分を足す
    update inventory_items set book_qty = book_qty - old.signed_qty where id = old.item_id;
    update inventory_items set book_qty = book_qty + new.signed_qty where id = new.item_id;
  end if;
  return null;
end;
$$;

drop trigger if exists inventory_movements_apply on inventory_movements;
create trigger inventory_movements_apply
  after insert or update or delete on inventory_movements
  for each row execute function inventory_apply_movement();

-- ── 出荷先の初期値 ────────────────────────────────────────────────
insert into inventory_destinations (code, name, kind, address, contact, phone, sort_order) values
  ('D-001', '株式会社山田工務店',   '得意先',   '東京都江東区新木場1-2-3',   '山田 誠',   '03-1234-5678', 10),
  ('D-002', 'みどり建設株式会社',   '得意先',   '千葉県船橋市本町4-5-6',     '緑川 香',   '047-222-3333', 20),
  ('D-003', '中央病院 空調更新工事', '現場',     '東京都文京区本郷7-8-9',     '現場監督 林', '090-1111-2222', 30),
  ('D-004', 'さくらマンション B棟',  '現場',     '神奈川県川崎市中原区1-1',   '管理人室',   '044-555-6666', 40),
  ('D-005', '第二倉庫（自社）',      '自社拠点', '埼玉県三郷市彦成2-2-2',     '倉庫担当',   '048-777-8888', 50)
on conflict (name) do nothing;

-- ── RLS ───────────────────────────────────────────────────────────
-- 他のテーブルと同じく、画面からのアクセスは全てサーバー側から行う。
alter table inventory_destinations enable row level security;
alter table inventory_movements    enable row level security;
