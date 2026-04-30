import type { Renter } from "../../../shared/types/renter.type";

export interface CreateRenterInterface extends Omit<Renter, "id" | "createdAt" | "updatedAt" | "plan" | "planExpiresAt" | "deletedAt"> {
  email: string;
  password: string;
}