import z from "zod";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../common/types/roles.type";
import { RENTAL_STATUS } from "../../../common/types/rental-status.type";

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
  totalPrice: z.number().max(999999999)
});
