import type { Plan } from "./plan.model";

export interface Renter {
  id: string;
  name: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  legalRepresentative: string;
  planId: number;
  plan: Plan;
  planExpiresAt: Date;
  balance: number;
  lowBalanceThreshold: number;
  lowBalanceAlertEnabled: boolean;
  status: 'active' | 'suspended';
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
