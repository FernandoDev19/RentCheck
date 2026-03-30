import z from "zod";
import { TYPE_TRANSMISSION } from "../../../common/types/type-transmission.type";

export const CreateVehicleSchema = z.object({
  gamma: z.optional(z.string().nonempty()),
  plate: z.string().nonempty().min(3).max(20),
  brand: z.string().nonempty().min(3).max(50),
  model: z.string().nonempty().min(3).max(50),
  year: z.number().min(1800).max(new Date().getFullYear() + 1),
  color: z.string().nonempty().min(3).max(50),
  transmission: z.enum(TYPE_TRANSMISSION),
  rentalPriceByDay: z.number().min(0).max(9999999),
  insuredValue: z.optional(z.number().min(0).max(9999999)),
  branchId: z.optional(z.string().min(36).max(36)),
  photos: z.optional(z.array(z.string())),
});
