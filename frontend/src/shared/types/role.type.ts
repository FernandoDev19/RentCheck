import type { User } from "./user.type";

export const ROLES = {
  ADMIN: 'Admin Rentcheck',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
} as const;

export type RolesType = typeof ROLES[keyof typeof ROLES];

export interface Role {
  id: number;
  name: string;
  users?: User[];
}
