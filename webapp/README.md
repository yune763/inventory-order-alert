# webapp

在庫・発注アラートの画面とサーバー処理（Next.js）。
セットアップと使い方は親フォルダの [`../README.md`](../README.md) を参照。

```bash
npm install
npm run dev        # http://localhost:3000（初回起動でローカルDBが作られる）
npm run db:seed    # サンプル商品9件
npm run db:check   # 判定結果の確認
```

## この下のどこに何があるか

| 場所 | 役割 |
|:--|:--|
| `src/lib/db.ts` | DBへの唯一の入口。ローカルDB（PGlite）と外部Postgres（`DATABASE_URL`）を切り替える |
| `src/lib/inventory/columns.ts` | 42列の定義。一覧表・CSV取込・CSV書き出しが共有する |
| `src/lib/inventory/queries.ts` | 読み取り（判定ビューへの問い合わせ） |
| `src/lib/inventory/alert-text.ts` | アラート理由・推奨アクションの文面 |
| `src/lib/inventory/csv.ts` | 商品CSV（42列）の読み書き |
| `src/lib/inventory/movements.ts` | 入出庫・出荷先の読み取り |
| `src/lib/inventory/movement-csv.ts` | 入出庫CSVの読み書き |
| `src/app/(app)/` | 画面（ダッシュボード・在庫一覧・入出庫・取込・マスタ・判定パラメータ） |
| `src/app/api/` | CSV書き出しと日次アラートの入口 |
| `scripts/db.mjs` | migrate / seed / check / reset |

判定ロジック（有効在庫〜アラート区分）はDB側の `inventory_items_evaluated` ビューにある。
`../supabase/migrations/20260924150010_inventory_evaluated_view.sql` を参照。
