import z from "zod";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../common/types/roles.type";
import { RENTAL_STATUS } from "../../../common/types/rental-status.type";

const userRoleOwner = getUser().role === ROLES.OWNER;

export const createRentalSchema = z.object({
  // Renta
  startDate: z.string().nonempty(),
  expectedReturnDate: z.string().nonempty(),
  rentalStatus: z
    .optional(z.enum(RENTAL_STATUS))
    .default("active"),
  branchId: userRoleOwner
    ? z.string().min(36, "La sede es obligatoria")
    : z.string().optional(),
});
