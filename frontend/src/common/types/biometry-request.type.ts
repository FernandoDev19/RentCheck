export const STATUS_BIOMETRY_REQUEST = {
  PENDING: "pending",
  COMPLETED: "completed",
  EXPIRED: "expired",
} as const;

export type StatusBiometryRequest = typeof STATUS_BIOMETRY_REQUEST[keyof typeof STATUS_BIOMETRY_REQUEST];

export const RESULT_BECOME = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ResultBecome = typeof RESULT_BECOME[keyof typeof RESULT_BECOME];
