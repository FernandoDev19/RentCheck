import type { IdentityType } from "../common/types/identity-type.type";
import type { Branch } from "./branch.model";
import type { User } from "./user.model";

export interface Employee {
  id: string;
  name: string;
  branchId: string;
  branch: Branch;
  identityType: IdentityType;
  identityNumber: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}
