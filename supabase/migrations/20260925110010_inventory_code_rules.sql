-- 在庫・発注アラート: 品番（商品コード）の採番ルール
--
-- 商品コードは全処理のキーなので、人によって付け方がばらつくと
-- 同じ物に別コードが立つ・CSV取込で名寄せできない、といった形で効いてくる。
-- 「接頭辞＋連番」の採番ルールを持たせ、新規登録時に発番できるようにする。
--
-- カテゴリごとにルールを作れる。カテゴリ未指定（category is null）の行が既定ルールで、
-- そのカテゴリ専用のルールが無いときに使われる。

create table if not exists inventory_code_rules (
  id          uuid primary key default gen_random_uuid(),
  category    text,                                   -- null = 既定ルール
  prefix      text not null check (length(trim(prefix)) > 0),
  separator   text not null default '-',
  digits      integer not null default 4 check (digits between 1 and 10),
  next_number integer not null default 1 check (next_number >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- カテゴリごとに1本だけ。既定ルール（null）も1本だけにしたいので、
-- null を空文字に寄せた式でユニークにする（null 同士は重複判定されないため）。
create unique index if not exists inventory_code_rules_category_key
  on inventory_code_rules ((coalesce(category, '')));

drop trigger if exists inventory_code_rules_set_updated_at on inventory_code_rules;
create trigger inventory_code_rules_set_updated_at
  before update on inventory_code_rules
  for each row execute function inventory_set_updated_at();

-- 初期値。業種に合わせて画面から変えられる
insert into inventory_code_rules (category, prefix, separator, digits, next_number) values
  (null,            'ITEM', '-', 4, 1),
  ('空調機器',       'AC',   '-', 4, 1),
  ('配管部材',       'PP',   '-', 4, 1),
  ('電材',           'EL',   '-', 4, 1),
  ('消耗品',         'CS',   '-', 4, 1),
  ('工具',           'TL',   '-', 4, 1),
  ('安全用品',       'SF',   '-', 4, 1),
  ('部品・補修材',   'PT',   '-', 4, 1)
on conflict ((coalesce(category, ''))) do nothing;

alter table inventory_code_rules enable row level security;
