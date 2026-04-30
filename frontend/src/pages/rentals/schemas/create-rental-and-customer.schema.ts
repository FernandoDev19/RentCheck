import z from "zod";
import { IDENTITY_TYPE } from "../../../shared/types/identity-type.type";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../shared/types/role.type";

const userRoleOwner = getUser().role === ROLES.OWNER;

export const createRentalAndCustomerSchema = z.object({
  // Cliente
  identityType: z.optional(z.enum(IDENTITY_TYPE)),
  identityNumber: z.string().nonempty().min(5).max(20),
  name: z.string().nonempty().min(2).max(100),
  lastName: z.string().nonempty().min(2).max(100),
  email: z.optional(z.string().email()),
  phone: z.optional(z.string()),
  // Renta
  startDate: z.string().nonempty(),
  expectedReturnDate: z.string().nonempty(),
  rentalStatus: z
    .optional(z.enum(["active", "returned", "late", "cancelled"]))
    .default("active"),
  branchId: userRoleOwner
    ? z.string().min(36, "La sede es obligatoria")
    : z.string().optional(),
  vehicleId: z.optional(z.string().min(36).max(36)),
  totalPrice: z.number().max(999999999)
});
