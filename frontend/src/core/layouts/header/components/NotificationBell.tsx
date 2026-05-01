import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Clock, AlertTriangle, Car, MessageCircle, Wallet, CalendarClock } from "lucide-react";
import { notificationService } from "../../../../services/notification.service";
import {
  NOTIFICATION_TYPE,
  type Notification,
  type NotificationType,
} from "../../../../shared/types/notification.type";

// ─── Helpers de presentación por tipo ─────────────────────────────────────────

function getNotificationMeta(type: NotificationType): {
  icon: React.ElementType;
  color: string;
  label: string;
} {
  switch (type) {
    case NOTIFICATION_TYPE.VEHICLE_CONFLICT:
    case NOTIFICATION_TYPE.VEHICLE_UNAVAILABLE:
      return { icon: Car, color: "text-orange-500", label: "Conflicto de vehículo" };
    case NOTIFICATION_TYPE.LATE_RENTAL:
      return { icon: AlertTriangle, color: "text-red-500", label: "Renta tardía" };
    case NOTIFICATION_TYPE.RENTAL_ACTIVATED:
      return { icon: Car, color: "text-green-500", label: "Renta activada" };
    case NOTIFICATION_TYPE.FEEDBACK_PENDING:
      return { icon: MessageCircle, color: "text-blue-500", label: "Feedback pendiente" };
    case NOTIFICATION_TYPE.LOW_BALANCE:
      return { icon: Wallet, color: "text-yellow-500", label: "Saldo bajo" };
    case NOTIFICATION_TYPE.PLAN_EXPIRING_SOON:
      return { icon: CalendarClock, color: "text-purple-500", label: "Plan por vencer" };
    case NOTIFICATION_TYPE.PLAN_EXPIRED:
      return { icon: CalendarClock, color: "text-red-600", label: "Plan vencido" };
    case NOTIFICATION_TYPE.BIOMETRY_EXPIRED:
      return { icon: Clock, color: "text-gray-500", label: "Biometría expirada" };
    default:
      return { icon: Bell, color: "text-gray-400", label: "Notificación" };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Componente ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 1 minuto

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(data);
    } catch {
      // silencioso: no interrumpir UX si falla el polling
    }
  }, []);

  // Carga inicial + polling cada minuto
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Cierra al hacer click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Botón campana ─────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ──────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header del dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <span className="font-semibold text-sm text-foreground">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                id="notification-mark-all-read"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell size={32} className="mb-2 opacity-30" />
                <span className="text-sm">Sin notificaciones pendientes</span>
              </li>
            ) : (
              notifications.map((n) => {
                const meta = getNotificationMeta(n.type);
                const IconComp = meta.icon;
                const message =
                  typeof n.payload?.message === "string"
                    ? n.payload.message
                    : meta.label;

                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Ícono del tipo */}
                    <span className={`mt-0.5 shrink-0 ${meta.color}`}>
                      <IconComp size={18} />
                    </span>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {meta.label}
                      </p>
                      <p className="text-sm text-foreground leading-snug line-clamp-2">
                        {message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Botón marcar leída */}
                    <button
                      id={`notification-read-${n.id}`}
                      onClick={() => void handleMarkAsRead(n.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Marcar como leída"
                      title="Marcar como leída"
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
