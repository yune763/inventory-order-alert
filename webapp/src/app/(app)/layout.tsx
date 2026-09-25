import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/" className="text-base font-semibold tracking-tight">
            在庫・発注アラート
          </Link>
          <p className="hidden text-xs text-slate-500 sm:block">
            欠品 / 発注漏れ / 過剰在庫 / 棚卸差異 を、在庫数と出荷実績から自動で判定する
          </p>
        </div>
        <SidebarNav />
      </header>
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-400">
        判定ロジックは設計書「2. 計算ロジック」「3. アラート区分」と対応しています。
      </footer>
    </div>
  );
}
