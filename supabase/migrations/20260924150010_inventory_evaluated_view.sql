-- 在庫・発注アラート: 判定ビュー
--
-- スプレッドシート版では「GAS の recalcAll（自動列の書き込み）」と
-- 「AG列の ARRAYFORMULA（アラート区分）」の2箇所に判定ロジックが分かれていた。
-- サイト版はこのビュー1本に寄せる。再計算ボタンは要らず、在庫数を直した瞬間に
-- 判定が変わる（ARRAYFORMULA 側の良さを全列に広げたもの）。
--
-- 計算式は設計書「2. 計算ロジック」および「3. アラート区分」と1対1で対応する。
-- 変更するときは設計書も一緒に直すこと。
--
-- 最重要: 発注判定は「有効在庫」ではなく「有効在庫＋発注残（在庫ポジション）」で行う。
-- これをしないと発注済みの商品に毎日アラートが出続け、誰も見なくなる。

-- 列構成を後から変えられるよう、置き換えではなく作り直しにしている
-- （create or replace view は列の削除ができず、後続のマイグレーションで詰まる）。
drop view if exists inventory_items_evaluated;

create view inventory_items_evaluated with (security_invoker = on) as
select
  i.id, i.status, i.code, i.name, i.category, i.spec, i.unit, i.location,
  i.supplier_code, i.supplier_name, i.cost, i.price,
  i.lead_time_days, i.moq, i.lot,
  i.book_qty, i.count_qty, i.allocated_qty, i.on_order_qty, i.eta,
  i.out_qty_window, i.safety_days,
  i.last_in_date, i.last_out_date, i.last_count_date, i.note,
  i.created_at, i.updated_at,

  d.today,
  b.safety_days_effective,
  b.count_diff,          -- 棚卸差異 = 実棚 − 理論（未棚卸は NULL）
  b.available_qty,       -- 有効在庫 = 手持ち − 引当
  b.stock_position,      -- 在庫ポジション = 有効在庫 + 発注残
  b.stock_value,         -- 在庫金額 = 有効在庫 × 仕入単価
  b.daily_out,           -- 平均日次出庫 = 期間出庫数 ÷ 集計期間
  t.days_of_stock,       -- 在庫日数 = 有効在庫 ÷ 平均日次出庫
  t.stockout_date,       -- 欠品予測日 = 今日 + 在庫日数
  t.safety_qty,          -- 安全在庫数 = 平均日次出庫 × 安全在庫日数
  t.rop,                 -- 発注点 = 平均日次出庫 × リードタイム + 安全在庫数
  t.max_qty,             -- 適正在庫上限
  o.order_qty,           -- 発注推奨数（MOQ・ロット単位に丸め済み）
  o.order_due_date,      -- 発注期限日 = 欠品予測日 − リードタイム
  h.idle_days,           -- 滞留日数 = 今日 − 最終出庫日
  a.alert_type,
  ar.alert_rank,   -- 並べ替え用。設計書のアラート区分の番号（1=欠品 … 9=正常）
  p.priority,
  p.priority_rank -- 並べ替え用。1=A / 2=B / 3=C / 9=対象外
from inventory_items i
cross join (select * from inventory_settings where id = 1) s
cross join lateral (
  -- 「今日」は運用地（日本）の日付で固定する。UTC の日付を使うと
  -- 朝9時前の判定が前日のままになり、発注期限が1日ずれる。
  select (now() at time zone 'Asia/Tokyo')::date as today
) d
cross join lateral (
  select
    coalesce(nullif(i.safety_days, 0), s.default_safety_days)                      as safety_days_effective,
    -- 実棚が入っていればそちらを正とする（棚卸した数が現物）
    case when i.count_qty is null then null else round(i.count_qty - i.book_qty) end as count_diff,
    round(coalesce(i.count_qty, i.book_qty) - i.allocated_qty, 2)                  as available_qty,
    round(coalesce(i.count_qty, i.book_qty) - i.allocated_qty, 2) + i.on_order_qty as stock_position,
    round((round(coalesce(i.count_qty, i.book_qty) - i.allocated_qty, 2)) * i.cost) as stock_value,
    round(i.out_qty_window / s.demand_window_days, 3)                              as daily_out
) b
cross join lateral (
  select
    case
      when b.daily_out > 0 then round(b.available_qty / b.daily_out, 1)
      when b.available_qty > 0 then s.no_move_days::numeric   -- 出庫実績が無い在庫は「もつ日数」を出せない
      else 0
    end as days_of_stock,
    case
      when b.daily_out > 0 then d.today + floor(b.available_qty / b.daily_out)::integer
      else null
    end as stockout_date,
    round(b.daily_out * b.safety_days_effective)                                   as safety_qty,
    round(b.daily_out * i.lead_time_days + round(b.daily_out * b.safety_days_effective)) as rop,
    round(b.daily_out * (i.lead_time_days + b.safety_days_effective + s.order_cycle_days)) as max_qty
) t
cross join lateral (
  select
    -- 適正在庫上限まで戻す量を、MOQ と発注ロット単位に切り上げる
    case
      when b.stock_position <= t.rop then greatest(
        round(
          case
            when i.lot > 1
              then ceil(greatest(greatest(t.max_qty - b.stock_position, 0), i.moq) / i.lot) * i.lot
            else greatest(greatest(t.max_qty - b.stock_position, 0), i.moq)
          end
        ), 0)
      else 0
    end as order_qty,
    case
      when b.daily_out > 0 and t.stockout_date is not null
        then t.stockout_date - i.lead_time_days
      else null
    end as order_due_date
) o
cross join lateral (
  select case when i.last_out_date is null then null else d.today - i.last_out_date end as idle_days
) h
cross join lateral (
  -- アラート区分は上から順に見て、最初に当たった重いものだけを採用する（設計書 3.）
  select case
    when b.available_qty <= 0
      then '欠品'
    when i.on_order_qty <= 0 and b.stock_position <= t.rop
         and o.order_due_date is not null and o.order_due_date < d.today
      then '発注漏れ'
    when b.daily_out > 0 and t.days_of_stock <= i.lead_time_days
      then '欠品リスク'
    when i.eta is not null and i.eta < d.today and i.on_order_qty > 0
      then '入荷遅延'
    when b.stock_position <= t.rop
      then '発注推奨'
    when t.max_qty > 0 and b.available_qty > t.max_qty
      then '過剰在庫'
    when h.idle_days is not null and h.idle_days >= s.dead_stock_days and b.available_qty > 0
      then '滞留在庫'
    when b.count_diff is not null and abs(b.count_diff) > s.count_diff_tolerance
      then '棚卸差異'
    else '正常'
  end as alert_type
) a
cross join lateral (
  -- 設計書「3. アラート区分」の番号。重い順で、並べ替えにも優先度の導出にも使う
  select case a.alert_type
    when '欠品'       then 1
    when '発注漏れ'   then 2
    when '欠品リスク' then 3
    when '入荷遅延'   then 4
    when '発注推奨'   then 5
    when '過剰在庫'   then 6
    when '滞留在庫'   then 7
    when '棚卸差異'   then 8
    else 9
  end as alert_rank
) ar
cross join lateral (
  -- 優先度は区分の重さから決まる（A=今日中に手を打たないと欠品 / B=3日以内に発注 / C=週次で棚卸し）。
  -- 文字列の優先度をそのまま昇順に並べると '-' が 'A' より先に来るため、
  -- 並べ替えには priority_rank を使うこと。
  select
    case
      when ar.alert_rank <= 3 then 'A:即日対応'
      when ar.alert_rank <= 5 then 'B:3日以内'
      when ar.alert_rank <= 8 then 'C:要確認'
      else '-'
    end as priority,
    case
      when ar.alert_rank <= 3 then 1
      when ar.alert_rank <= 5 then 2
      when ar.alert_rank <= 8 then 3
      else 9
    end as priority_rank
) p;

-- ビューは定義者権限で走らせず（security_invoker = on）、下のテーブルの RLS をそのまま効かせる。
-- 画面からのアクセスは全てサーバー側（service_role / ローカルDBの所有者）経由。
--
-- anon・authenticated は Supabase にだけ居るロールなので、存在するときだけ権限を落とす。
-- ローカル（PGlite）ではこのロールが無く、無条件に revoke すると流せなくなる。
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on inventory_items_evaluated from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on inventory_items_evaluated from authenticated';
  end if;
end
$$;
