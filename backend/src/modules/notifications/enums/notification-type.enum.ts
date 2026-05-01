export enum NotificationType {
  // ─── Conflictos de vehículo al activar rentas ──────────────────────────────
  VEHICLE_CONFLICT = 'vehicle_conflict',
  VEHICLE_UNAVAILABLE = 'vehicle_unavailable',

  // ─── Estado de rentas ──────────────────────────────────────────────────────
  LATE_RENTAL = 'late_rental',
  RENTAL_ACTIVATED = 'rental_activated',

  // ─── Feedbacks pendientes ──────────────────────────────────────────────────
  FEEDBACK_PENDING = 'feedback_pending',

  // ─── Saldo y plan ─────────────────────────────────────────────────────────
  LOW_BALANCE = 'low_balance',
  PLAN_EXPIRING_SOON = 'plan_expiring_soon',
  PLAN_EXPIRED = 'plan_expired',

  // ─── Biometría ────────────────────────────────────────────────────────────
  BIOMETRY_EXPIRED = 'biometry_expired',
}
