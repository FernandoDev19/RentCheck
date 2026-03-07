export const CUSTOMER_STATUS = {
  NORMAL: 'normal',
  YELLOW_ALERT: 'yellow_alert',
  RED_ALERT: 'red_alert',
} as const;

export type CustomerStatus = typeof CUSTOMER_STATUS[keyof typeof CUSTOMER_STATUS];

