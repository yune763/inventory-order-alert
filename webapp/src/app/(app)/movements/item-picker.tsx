"use client";

import { useMemo, useRef, useState } from "react";

export type ItemChoice = {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  spec: string | null;
  book_qty: number;
};

const MAX_SUGGESTIONS = 12;

/**
 * 品番で探して、商品名で確かめるための選択欄。
 *
 * ただのプルダウンだと、品番を打っても先頭一致でしか飛べず、
 * 「この品番で合っているか」を商品名で確認できない。
 * 入力した文字で品番・商品名・型番を絞り込み、候補に商品名と現在庫を並べて出す。
 */
export function ItemPicker({
  items,
  onSelect,
}: {
  items: ItemChoice[];
  /** 選んだ商品を親に伝える（数量の単位表示などに使う） */
  onSelect?: (item: ItemChoice | null) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<ItemChoice | null>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items.slice(0, MAX_SUGGESTIONS);
    return items
      .filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          (item.spec ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [items, keyword]);

  const choose = (item: ItemChoice) => {
    setSelected(item);
    setKeyword("");
    setOpen(false);
    onSelect?.(item);
  };

  const clear = () => {
    setSelected(null);
    setKeyword("");
    onSelect?.(null);
  };

  if (selected) {
    return (
      <span className="flex items-center gap-2">
        <input type="hidden" name="item_id" value={selected.id} />
        <span className="flex min-w-72 items-center gap-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <span className="font-mono text-xs text-slate-500">{selected.code}</span>
          <span className="truncate">{selected.name}</span>
          <span className="ml-auto whitespace-nowrap text-xs text-slate-400">
            在庫 {selected.book_qty}
            {selected.unit ?? ""}
          </span>
        </span>
        <button
          type="button"
          onClick={clear}
          className="whitespace-nowrap rounded border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50"
        >
          選び直す
        </button>
      </span>
    );
  }

  return (
    <span className="relative flex flex-col">
      <input
        type="search"
        value={keyword}
        autoComplete="off"
        placeholder="品番・商品名で検索"
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
          setCursor(0);
        }}
        onFocus={() => setOpen(true)}
        // クリックで選ぶ前に閉じてしまわないよう、閉じるのを少し遅らせる
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setCursor((c) => Math.min(c + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter") {
            // 候補を選ぶための Enter でフォームごと送信されないようにする
            e.preventDefault();
            if (matches[cursor]) choose(matches[cursor]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-72 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
      />

      {open && (
        <ul className="absolute top-full z-30 mt-1 max-h-72 w-96 overflow-y-auto rounded border border-slate-300 bg-white shadow-lg">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">見つかりません</li>
          )}
          {matches.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={() => {
                  // onBlur より先に走らせて、閉じる前に選択を確定させる
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  choose(item);
                }}
                onMouseEnter={() => setCursor(index)}
                className={`flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm ${
                  index === cursor ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <span className="w-24 shrink-0 font-mono text-xs text-slate-500">{item.code}</span>
                <span className="truncate">{item.name}</span>
                {item.spec && <span className="shrink-0 text-xs text-slate-400">{item.spec}</span>}
                <span className="ml-auto shrink-0 whitespace-nowrap text-xs text-slate-400">
                  在庫 {item.book_qty}
                  {item.unit ?? ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
