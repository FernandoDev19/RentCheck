export const RENTER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type RenterStatus = typeof RENTER_STATUS[keyof typeof RENTER_STATUS];
