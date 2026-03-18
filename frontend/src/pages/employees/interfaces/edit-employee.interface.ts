import type { IdentityType } from "../../../common/types/identity-type.type";
import type { UserStatus } from "../../../common/types/user-status.type";

export interface EditEmployeeInterface {
    name?: string;
    email?: string;
    branchId?: string;
    identityType?: IdentityType;
    identityNumber?: string;
    status?: UserStatus;
}