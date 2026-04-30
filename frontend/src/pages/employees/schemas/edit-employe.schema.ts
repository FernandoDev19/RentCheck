import z from "zod";
import { IDENTITY_TYPE } from "../../../shared/types/identity-type.type";
import { USER_STATUS } from "../../../shared/types/user.type";

export const editEmployeeSchema = z.object({
    name: z.optional(z.string().nonempty().min(3).max(100)),
    email: z.optional(z.email()),
    branchId: z.optional(z.string().nonempty()),
    identityType: z.optional(z.enum(IDENTITY_TYPE)),
    identityNumber: z.optional(z.string().nonempty().min(5).max(15)),
    status: z.optional(z.enum(USER_STATUS)),
  });