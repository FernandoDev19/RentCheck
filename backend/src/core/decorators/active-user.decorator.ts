import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserActiveInterface } from '../../modules/auth/interfaces/active-user.interface';

export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: UserActiveInterface }>();
    return request.user;
  },
);
