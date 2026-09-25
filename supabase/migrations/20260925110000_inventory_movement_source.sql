-- 在庫・発注アラート: 入庫元
--
-- 出庫に出荷先があるのと対に、入庫には「どこから入ったか」を持たせる。
--
-- 出荷先（inventory_destinations）のようなテーブルにしないのは、入庫元のほとんどが
-- 既に仕入先マスタにある名前で、住所や担当者を別に持つ必要が無いため。
-- 商品の「仕入先名」と同じく、マスタを候補として出しつつ文字列で持つ
-- （他倉庫からの移管や現場からの返却など、マスタに無い相手も書けるようにする）。

alter table inventory_movements
  add column if not exists source_name text;

-- 出荷先が出庫専用なのと同じく、入庫元は入庫専用にする。
-- 区分を選び間違えたまま相手先だけ残る、という状態を作らないため。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inventory_movements_source_only_in'
  ) then
    alter table inventory_movements
      add constraint inventory_movements_source_only_in
      check (kind = 'in' or source_name is null);
  end if;
end
$$;

create index if not exists inventory_movements_source_idx
  on inventory_movements (source_name, moved_on desc);
