import type { RolesType } from "../types/roles.type";

export interface UserActiveInterface {
  sub: string;
  email: string;
  role: RolesType;
  renterId: string;
  branchId: string;
  employeeId: string;
}
