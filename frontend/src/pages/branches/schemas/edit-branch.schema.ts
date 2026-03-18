import z from "zod";

export const editBranchSchema = z.object({
    name: z.optional(z.string().nonempty().min(5).max(100)),
    address: z.optional(z.string().max(199)),
    city: z.optional(z.string().max(199)),
    phone: z.optional(z.string().nonempty().min(7).max(15)),
    responsible: z.optional(z.string().nonempty().min(3).max(100)),
    email: z.optional(z.email()),
    status: z.boolean().default(true),
  });