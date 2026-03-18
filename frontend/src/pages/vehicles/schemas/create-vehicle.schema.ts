import z from "zod";

export const CreateVehicleSchema = z.object({
  plate: z.string().nonempty().min(3).max(20),
  brand: z.string().nonempty().min(3).max(50),
  model: z.string().nonempty().min(3).max(50),
  year: z.number().min(1800).max(new Date().getFullYear() + 1),
  color: z.string().nonempty().min(3).max(50),
  insuredValue: z.optional(z.number()),
  photos: z.optional(z.array(z.string())),
});
