import { STATUS_CONFIG } from "../constants/status-config";

export const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-500", icon: "❓" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};