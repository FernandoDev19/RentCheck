export const RENTAL_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  LATE: 'late',
  CANCELLED: 'cancelled',
} as const;

export type RentalStatus = typeof RENTAL_STATUS[keyof typeof RENTAL_STATUS];
