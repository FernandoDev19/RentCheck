import z from "zod";
import { TYPE_TRANSMISSION } from "../../../shared/types/type-transmission.type";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../shared/types/role.type";

export const getEditVehicleSchema = () => {
  const userRole = getUser().role;
  return z.object({
    gamma: z.optional(z.string().nonempty()),
    plate: z.optional(z.string().nonempty().min(3).max(20)),
    brand: z.optional(z.string().nonempty().min(3).max(50)),
    model: z.optional(z.string().nonempty().min(3).max(50)),
    year: z.optional(
      z
        .number()
        .min(1800)
        .max(new Date().getFullYear() + 1),
    ),
    color: z.optional(z.string().nonempty().min(3).max(50)),
    transmission: z.optional(z.enum(TYPE_TRANSMISSION)),
    rentalPriceByDay: z.optional(z.number().min(0).max(9999999)),
    insuredValue: z.optional(z.number()),
    branchId: userRole === ROLES.OWNER
      ? z.string().min(36, "La sede es obligatoria").optional() // En editar puede ser opcional si no se cambia, pero si se provee debe ser válida. O tal vez mejor mantener la lógica de creación si es OWNER.
      : z.string().optional(),
    photos: z.optional(z.array(z.string())),
  });
};
