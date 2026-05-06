import type { RolesType } from "./role.type";

export interface UserActiveType {
  sub: string;
  email: string;
  role: RolesType;
  renterId: string;
  branchId: string;
  employeeId: string;
}
