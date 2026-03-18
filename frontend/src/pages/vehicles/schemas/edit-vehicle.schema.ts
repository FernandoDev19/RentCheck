import z from "zod";

export const EditVehicleSchema = z.object({
  plate: z.optional(z.string().nonempty().min(3).max(20)),
  brand: z.optional(z.string().nonempty().min(3).max(50)),
  model: z.optional(z.string().nonempty().min(3).max(50)),
  year: z.optional(z.number().min(1800).max(new Date().getFullYear() + 1)),
  color: z.optional(z.string().nonempty().min(3).max(50)),
  insuredValue: z.optional(z.number()),
  photos: z.optional(z.array(z.string())),
});
