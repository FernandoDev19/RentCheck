import type { Branch } from "./branch.type";
import type { Employee } from "./employee.type";
import type { Renter } from "./renter.type";
import type { Role } from "./role.type";

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

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
