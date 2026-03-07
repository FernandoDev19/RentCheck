export const ROLES = {
  ADMIN: 'Admin Rentcheck',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
} as const;

export type RolesType = typeof ROLES[keyof typeof ROLES];