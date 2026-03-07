import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEYS } from '../decorators/roles.decorator';
import { RolesEnum } from '../../../core/enums/roles.enum';
import { UserActiveInterface } from '../interfaces/active-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RolesEnum[]>(ROLES_KEYS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    const { user }: { user: UserActiveInterface } = context
      .switchToHttp()
      .getRequest();

    if (user.role === 'Admin Rentcheck') {
      return true;
    }

    return roles.includes(user.role as RolesEnum);
  }
}
