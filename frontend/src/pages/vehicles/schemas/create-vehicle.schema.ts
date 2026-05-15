import z from "zod";
import { TYPE_TRANSMISSION } from "../../../shared/types/type-transmission.type";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../shared/types/role.type";

export const getCreateVehicleSchema = () => {
  const userRole = getUser().role;
  return z.object({
    gamma: z.optional(z.string().nonempty()),
    plate: z.string().nonempty().min(3).max(20),
    brand: z.string().nonempty().min(3).max(50),
    model: z.string().nonempty().min(3).max(50),
    year: z.number().min(1800).max(new Date().getFullYear() + 1),
    color: z.string().nonempty().min(3).max(50),
    transmission: z.enum(TYPE_TRANSMISSION),
    rentalPriceByDay: z.number().min(0).max(9999999),
    insuredValue: z.optional(z.number().min(0).max(9999999)),
    branchId: userRole === ROLES.OWNER
      ? z.string().min(36, "La sede es obligatoria")
      : z.string().optional(),
    photos: z.optional(z.array(z.string())),
  });
};
