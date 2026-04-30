import type { IdentityType } from "../../../shared/types/identity-type.type";

export interface CreateEmployeeInterface {
    name: string;
    email: string;
    password: string;
    branchId?: string;
    identityType?: IdentityType;
    identityNumber: string;
}