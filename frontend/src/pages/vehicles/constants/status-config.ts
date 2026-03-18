export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  available:   { label: "Disponible",    bg: "bg-emerald-100", text: "text-emerald-700", icon: "✅" },
  rented:      { label: "En renta",      bg: "bg-blue-100",    text: "text-blue-700",    icon: "🔑" },
  stolen:      { label: "Robado",        bg: "bg-red-100",     text: "text-red-700",     icon: "🚨" },
  maintenance: { label: "Mantenimiento", bg: "bg-yellow-100",  text: "text-yellow-700",  icon: "🔧" },
};