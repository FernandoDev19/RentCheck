import z from "zod";

export const createBranchSchema = z.object({
    name: z.string().nonempty().min(5).max(100),
    address: z.optional(z.string().max(199)),
    city: z.optional(z.string().max(199)),
    phone: z.string().nonempty().min(7).max(15),
    responsible: z.string().nonempty().min(3).max(100),
    email: z.email(),
    password: z.string().nonempty().min(8).max(60),
    status: z.boolean().default(true),
  });