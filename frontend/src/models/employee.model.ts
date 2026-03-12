import type { IdentityType } from "../common/types/identity-type.type";
import type { BiometryRequest } from "./biometry-request.model";
import type { Branch } from "./branch.model";
import type { RentalFeedback } from "./rental-feedback.model";
import type { Rental } from "./rental.model";
import type { User } from "./user.model";

export interface Employee {
  id: string;
  name: string;
  branchId: string;
  branch: Branch;
  identityType: IdentityType;
  identityNumber: string;
  user: User;
  rentals?: Rental[];
  rentalFeedbacks?: RentalFeedback[];
  biometryRequests?: BiometryRequest[];
  createdAt: Date;
  updatedAt: Date;
}
