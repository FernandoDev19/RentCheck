import type { BiometryRequest } from "./biometry-request.type";
import type { Branch } from "./branch.type";
import type { Plan } from "./plan.type";
import type { Rental } from "./rental.type";
import type { User } from "./user.type";
import type { Vehicle } from "./vehicle.type";

export const RENTER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type RenterStatus = typeof RENTER_STATUS[keyof typeof RENTER_STATUS];

export interface Renter {
  id: string;

  user?: User;

  name: string;
  nit: string;
  address?: string;
  city?: string;
  phone: string;
  legalRepresentative: string;
  planId: number;
  plan: Plan;
  planExpiresAt: Date;
  balance: number;
  lowBalanceThreshold: number;
  lowBalanceAlertEnabled: boolean;
  status: RenterStatus;

  totalBranches?: number;
  branches?: Branch[];
  rentals?: Rental[];
  totalRentals?: number;
  biometryRequests?: BiometryRequest[];
  vehicles?: Vehicle[];

  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
