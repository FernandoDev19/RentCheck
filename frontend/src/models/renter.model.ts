import type { RenterStatus } from "../common/types/renter-status.type";
import type { BiometryRequest } from "./biometry-request.model";
import type { Branch } from "./branch.model";
import type { Plan } from "./plan.model";
import type { Rental } from "./rental.model";
import type { User } from "./user.model";

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

  branches?: Branch[];
  rentals?: Rental[];
  biometryRequests?: BiometryRequest[];

  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
