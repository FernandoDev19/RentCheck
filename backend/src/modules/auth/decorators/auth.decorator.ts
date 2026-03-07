import { UseGuards, applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { AuthGuard } from '../guards/auth.guard';
import { RolesEnum } from '../../../core/enums/roles.enum';

export function Auth(...roles: RolesEnum[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}
