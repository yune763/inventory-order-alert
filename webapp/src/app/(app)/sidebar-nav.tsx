"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "HOME" },
  { href: "/items", label: "在庫一覧" },
  { href: "/movements", label: "入出庫" },
  { href: "/suppliers", label: "仕入先" },
  { href: "/locations", label: "保管場所" },
  { href: "/destinations", label: "出荷先" },
  { href: "/import", label: "取込・書き出し" },
  { href: "/masters", label: "マスタ" },
  { href: "/settings", label: "判定パラメータ" },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
