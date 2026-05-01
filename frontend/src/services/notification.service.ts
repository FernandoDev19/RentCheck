import api from "../core/api/api";
import type { Notification } from "../shared/types/notification.type";

export const notificationService = {
  /** Obtiene las últimas 20 notificaciones no leídas del usuario actual */
  getUnread: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications/unread", {
      // "silent" evita disparar el GlobalLoader para el polling
      silent: true,
    } as object);
    return response.data;
  },

  /** Marca una notificación como leída */
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  /** Marca todas las notificaciones del usuario como leídas */
  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
