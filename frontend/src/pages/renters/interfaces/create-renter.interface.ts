import type { Renter } from "../../../models/renter.model";

export interface CreateRenterInterface extends Omit<Renter, "id" | "createdAt" | "updatedAt" | "plan" | "planExpiresAt" | "deletedAt"> {
  email: string;
  password: string;
}