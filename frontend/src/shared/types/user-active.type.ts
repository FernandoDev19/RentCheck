import type { RolesType } from "./role.type";

export interface UserActiveType {
    sub: string;
    name: string;
    email: string;
    role: RolesType;
    renterId: string;
    branchId: string;
    employeeId: string;
}
