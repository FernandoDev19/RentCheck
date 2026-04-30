import type { IdentityType } from "./identity-type.type";
import type { BiometryRequest } from "./biometry-request.type";
import type { Branch } from "./branch.type";
import type { Rental } from "./rental.type";
import type { User } from "./user.type";
import type { RentalFeedback } from "./rental-feedback.type";

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
