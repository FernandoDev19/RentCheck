import type { Renter } from "../../../models/renter.model";

export interface EditRenterInterface extends Omit<Renter, "id" | "createdAt" | "updatedAt" | "plan" | "password" | "planExpiresAt" | "deletedAt"> {
  email: string;
}