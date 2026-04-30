import z from "zod";
import { TYPE_TRANSMISSION } from "../../../shared/types/type-transmission.type";

export const EditVehicleSchema = z.object({
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
  branchId: z.optional(z.string().min(36).max(36)),
  photos: z.optional(z.array(z.string())),
});
