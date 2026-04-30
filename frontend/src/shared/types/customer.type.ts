import type { IdentityType } from "./identity-type.type";
import type { CustomerStatus } from "../../pages/customers/interfaces/customer-status.interface";
import type { BiometryRequest } from "./biometry-request.type";
import type { Rental } from "./rental.type";
import type { User } from "./user.type";

export interface Customer {
  id: string;
  identityType: IdentityType;
  identityNumber: string;
  name: string;
  lastName: string;
  phone?: string;
  email?: string;
  generalScore: number;
  status: CustomerStatus;
  registeredByUserId?: string;
  registeredByUser?: User;
  rentals?: Rental[];
  biometryRequests?: BiometryRequest[];
  createdAt: Date;
  updatedAt: Date;
}
