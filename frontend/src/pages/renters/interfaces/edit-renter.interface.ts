import type { Renter } from "../../../shared/types/renter.type";

export interface EditRenterInterface extends Omit<Renter, "id" | "createdAt" | "updatedAt" | "plan" | "password" | "planExpiresAt" | "deletedAt"> {
  email: string;
}