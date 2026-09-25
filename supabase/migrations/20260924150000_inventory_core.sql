-- 在庫・発注アラート: 中核テーブル
--
-- スプレッドシート版（在庫アラート.gs）の3つのシートをそのまま持ち込む。
--   「在庫・発注アラート」シート … inventory_items（入力列だけを持つ。自動列は持たない）
--   「マスタ」シート             … inventory_master_options
--   GAS の CONFIG 定数            … inventory_settings
--
-- 自動計算列（有効在庫・発注点・アラート区分 など）はこのテーブルには保存しない。
-- 保存すると「昨日の判定」が残り続け、日付が変わった瞬間に嘘になる。
-- 判定は 20260924150010_inventory_evaluated_view.sql のビューが毎回その場で出す。

-- ── 調整パラメータ（GAS の CONFIG） ───────────────────────────────
-- 1行しか持たない。id を 1 に固定して2行目を作れないようにしている。
create table if not exists inventory_settings (
  id                   smallint primary key default 1 check (id = 1),
  demand_window_days   integer not null default 30   check (demand_window_days > 0),   -- 平均日次出庫を出す対象期間
  default_safety_days  integer not null default 7    check (default_safety_days >= 0), -- 安全在庫日数の既定値（品目ごとに上書き可）
  order_cycle_days     integer not null default 14   check (order_cycle_days >= 0),    -- 1回の発注で何日分補充するか
  dead_stock_days      integer not null default 90   check (dead_stock_days > 0),      -- 何日出庫が無ければ滞留在庫とみなすか
  count_diff_tolerance numeric not null default 0    check (count_diff_tolerance >= 0),-- 棚卸差異をアラートにする絶対値の閾値
  no_move_days         integer not null default 9999 check (no_move_days > 0),         -- 出庫実績ゼロ品の在庫日数の代用値
  updated_at           timestamptz not null default now()
);

insert into inventory_settings (id) values (1) on conflict (id) do nothing;

-- ── マスタ（プルダウンの選択肢） ──────────────────────────────────
-- スプレッドシートの「マスタ」シートの5列を kind で1テーブルにまとめたもの。
-- 行を足せば全商品のプルダウンに即反映される、という運用はそのまま。
create table if not exists inventory_master_options (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('status', 'category', 'unit', 'location', 'supplier')),
  label      text not null check (length(trim(label)) > 0),
  code       text,          -- 仕入先コードなど。kind='supplier' でのみ使う
  color      text,          -- 対応状況の表示色（#rrggbb）。スプシの条件付き書式にあたる
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kind, label)
);

create index if not exists inventory_master_options_kind_idx
  on inventory_master_options (kind, sort_order, label);

-- ── 商品（在庫）──────────────────────────────────────────────────
-- 列はスプレッドシート版42列のうち「入力」列だけ。自動列はビュー側にある。
create table if not exists inventory_items (
  id              uuid primary key default gen_random_uuid(),

  -- 対応状況（人が決める列）。マスタの status に無い値も一旦は受け入れる。
  -- CSV取込の途中で弾くと移行そのものが止まるため、整合はアプリ側で警告する。
  status          text,

  -- 基本情報
  code            text not null unique check (length(trim(code)) > 0),  -- 商品コード。全処理のキー
  name            text not null check (length(trim(name)) > 0),
  category        text,
  spec            text,          -- 規格・型番
  unit            text,
  location        text,          -- 保管場所

  -- 仕入先・発注条件
  supplier_code   text,
  supplier_name   text,
  cost            numeric not null default 0 check (cost >= 0),   -- 仕入単価
  price           numeric not null default 0 check (price >= 0),  -- 販売単価
  lead_time_days  integer not null default 0 check (lead_time_days >= 0),
  moq             numeric not null default 0 check (moq >= 0),    -- 最小発注数
  lot             numeric not null default 1 check (lot > 0),     -- 発注ロット単位

  -- 在庫状況
  book_qty        numeric not null default 0,  -- 理論在庫数
  count_qty       numeric,                     -- 実棚在庫数。NULL は「棚卸していない」
  allocated_qty   numeric not null default 0 check (allocated_qty >= 0),  -- 引当数（受注残）
  on_order_qty    numeric not null default 0 check (on_order_qty >= 0),   -- 発注残数（入荷予定）
  eta             date,                        -- 入荷予定日

  -- 消化傾向
  out_qty_window  numeric not null default 0 check (out_qty_window >= 0), -- 期間出庫数（直近 demand_window_days 日）

  -- 発注判定
  safety_days     integer check (safety_days >= 0),  -- NULL なら inventory_settings の既定値を使う

  -- 履歴・管理
  last_in_date    date,
  last_out_date   date,
  last_count_date date,
  note            text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists inventory_items_status_idx   on inventory_items (status);
create index if not exists inventory_items_category_idx on inventory_items (category);
create index if not exists inventory_items_supplier_idx on inventory_items (supplier_name);

-- 更新日時（スプシ版の AP列「更新日時」）を自動で入れる
create or replace function inventory_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on inventory_items;
create trigger inventory_items_set_updated_at
  before update on inventory_items
  for each row execute function inventory_set_updated_at();

drop trigger if exists inventory_settings_set_updated_at on inventory_settings;
create trigger inventory_settings_set_updated_at
  before update on inventory_settings
  for each row execute function inventory_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────
-- 画面からのDBアクセスは全てサーバー側（Server Component / Server Action）が
-- service_role で行う。service_role は RLS をバイパスするため、ここでは
-- 「anon / authenticated からは一切読めない」状態にしておくだけでよい。
-- ブラウザに anon キーを配っても、このテーブルには手が届かない。
alter table inventory_settings       enable row level security;
alter table inventory_master_options enable row level security;
alter table inventory_items          enable row level security;
