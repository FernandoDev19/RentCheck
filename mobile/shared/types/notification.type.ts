export const NOTIFICATION_TYPE = {
  VEHICLE_CONFLICT: 'vehicle_conflict',
  VEHICLE_UNAVAILABLE: 'vehicle_unavailable',
  LATE_RENTAL: 'late_rental',
  RENTAL_ACTIVATED: 'rental_activated',
  FEEDBACK_PENDING: 'feedback_pending',
  LOW_BALANCE: 'low_balance',
  PLAN_EXPIRING_SOON: 'plan_expiring_soon',
  PLAN_EXPIRED: 'plan_expired',
  BIOMETRY_EXPIRED: 'biometry_expired',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export interface Notification {
  id: string;
  renterId: string;
  branchId: string | null;
  employeeId: string | null;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}
