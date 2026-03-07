import type { CustomerStatus } from "./customer-status.interface";

export interface CreateCustomerInterface {
  identityType?: string;
  identityNumber: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
  registeredByEmployeeId?: string;
  renterId?: string;
  generalScore?: number;
  status?: CustomerStatus;
}