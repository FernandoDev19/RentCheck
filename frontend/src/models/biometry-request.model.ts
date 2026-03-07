import type { Branch } from "./branch.model";
import type { Customer } from "./customer.model";
import type { Employee } from "./employee.model";
import type { Renter } from "./renter.model";

export interface BiometryRequest {
  id: string;
  token: string;
  renterId: string;
  renter?: Renter;
  branchId: string;
  branch?: Branch;
  customerId: string;
  customer?: Customer;
  employeeId: string;
  employee?: Employee;
  status: 'pending' | 'completed' | 'expired';
  result: 'approved' | 'rejected' | null;
  providerReference: string;
  createdAt: Date;
  updatedAt: Date;
}
