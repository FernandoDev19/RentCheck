import type { UserStatus } from "../common/types/user-status.type";
import type { Branch } from "./branch.model";
import type { Employee } from "./employee.model";
import type { Renter } from "./renter.model";
import type { Role } from "./role.model";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  renterId?: string;
  renter?: Renter;
  employeeId?: string;
  employee?: Employee;
  branchId?: string;
  branch?: Branch;
  roleId: number;
  role?: Role;
  status: UserStatus;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
