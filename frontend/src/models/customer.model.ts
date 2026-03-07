import type { IdentityType } from "../common/types/identity-type.type";
import type { CustomerStatus } from "../pages/customers/interfaces/customer-status.interface";
import type { BiometryRequest } from "./biometry-request.model";
import type { Branch } from "./branch.model";
import type { Employee } from "./employee.model";
import type { Rental } from "./rental.model";
import type { Renter } from "./renter.model";
import type { User } from "./user.model";

export interface Customer {
  id: string;
  identityType: IdentityType;
  identityNumber: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  generalScore: number;
  status: CustomerStatus;
  registeredByUserId: string;
  registeredByUser: User;
  rentals: Rental[];
  biometryRequests: BiometryRequest[];
  createdAt: Date;
  updatedAt: Date;
}
