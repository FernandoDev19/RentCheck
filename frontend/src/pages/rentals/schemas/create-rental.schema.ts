import z from "zod";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../shared/types/role.type";
import { RENTAL_STATUS } from "../../../shared/types/rental.type";

const userRoleOwner = getUser().role === ROLES.OWNER;

export const createRentalSchema = z.object({
  // Cliente
  identityNumber: z.string().nonempty().min(5).max(20),
  // Renta
  startDate: z.string().nonempty(),
  expectedReturnDate: z.string().nonempty(),
  rentalStatus: z
    .optional(z.enum(Object.values(RENTAL_STATUS) as [string, ...string[]]))
    .default("active"),
  branchId: userRoleOwner
    ? z.string().min(36, "La sede es obligatoria")
    : z.optional(z.string()),
  vehicleId: z.optional(z.string().min(36).max(36)),
  totalPrice: z.number().optional().default(0)
});
