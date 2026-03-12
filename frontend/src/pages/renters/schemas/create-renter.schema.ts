import z from "zod";

export const createRenterSchema = z.object({
    name: z.string().min(1),
    nit: z.string().min(1),
    address: z.optional(z.string().min(1)),
    city: z.optional(z.string().min(1)),
    email: z.email(),
    password: z.string().min(8),
    phone: z.string().min(7).max(15),
    legalRepresentative: z.string().min(3).max(60),
    planId: z.number().min(1),
    planExpiresAt: z.optional(z.string()),
    balance: z.number().min(0),
    lowBalanceThreshold: z.optional(z.number().min(0).max(999999999)),
    lowBalanceAlertEnabled: z.optional(z.boolean()),
    status: z.optional(z.enum(["active", "suspended"])),
  });