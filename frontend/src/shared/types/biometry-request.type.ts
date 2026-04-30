import type { Branch } from "./branch.type";
import type { Customer } from "./customer.type";
import type { Employee } from "./employee.type";
import type { Renter } from "./renter.type";

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


export interface BiometryRequest {
  id: string;
  token: string;
  renterId: string;
  renter: Renter;
  branchId?: string;
  branch?: Branch;
  customerId: string;
  customer: Customer;
  employeeId?: string;
  employee?: Employee;
  status: StatusBiometryRequest;
  result: ResultBecome | null;
  providerReference: string;
  createdAt: Date;
  updatedAt: Date;
}
