import z from "zod";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";

export const createEmployeeSchema = z.object({
    name: z.string().nonempty().min(3).max(100),
    email: z.email(),
    password: z.string().nonempty().min(8).max(60),
    branchId: z.optional(z.string().nonempty()),
    identityType: z.optional(z.enum(IDENTITY_TYPE)),
    identityNumber: z.string().nonempty().min(5).max(15),
  });