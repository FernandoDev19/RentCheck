import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../../shared/enums/roles.enum';

export const ROLES_KEYS = 'roles';
export const Roles = (...roles: RolesEnum[]) => SetMetadata(ROLES_KEYS, roles);
