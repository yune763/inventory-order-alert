import {
  ALERT_STYLES,
  PRIORITY_STYLES,
  type AlertType,
  type MasterOption,
  type Priority,
} from "@/lib/inventory/types";

/** アラート区分の色。スプレッドシートの条件付き書式と同じ配色にしてある */
export function AlertBadge({ alert }: { alert: AlertType }) {
  const style = ALERT_STYLES[alert] ?? ALERT_STYLES["正常"];
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {alert}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES["-"];
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {priority}
    </span>
  );
}

/** 背景色に対して読める文字色（黒 or 白）を選ぶ。マスタの色は人が自由に決められるため */
function readableText(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#334155";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

/** 対応状況は人が選ぶ列。色はマスタ（inventory_master_options.color）から取る */
export function StatusBadge({
  status,
  options,
}: {
  status: string | null;
  options: MasterOption[];
}) {
  if (!status) {
    return <span className="whitespace-nowrap text-xs text-slate-400">未設定</span>;
  }
  const master = options.find((o) => o.label === status);
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: master?.color ?? "#e2e8f0",
        color: readableText(master?.color),
      }}
    >
      {status}
    </span>
  );
}
