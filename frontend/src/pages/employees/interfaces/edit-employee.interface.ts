import type { IdentityType } from "../../../shared/types/identity-type.type";
import type { UserStatus } from "../../../shared/types/user.type";

export interface EditEmployeeInterface {
    name?: string;
    email?: string;
    branchId?: string;
    identityType?: IdentityType;
    identityNumber?: string;
    status?: UserStatus;
}