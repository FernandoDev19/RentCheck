export function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    normal: { bg: "#dcfce7", color: "#16a34a", label: "Normal" },
    yellow_alert: {
      bg: "#fef9c3",
      color: "#92400e",
      label: "Alerta amarilla",
    },
    red_alert: { bg: "#fee2e2", color: "#dc2626", label: "Alerta roja" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", color: "#6b7280", label: status };
  return `<span style="padding:3px 12px; border-radius:9999px; font-size:12px; font-weight:700;
    background:${s.bg}; color:${s.color};">${s.label}</span>`;
}