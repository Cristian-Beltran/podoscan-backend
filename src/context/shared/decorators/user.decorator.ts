// common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadToken } from '../models/token.model';

export const UserPayload = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PayloadToken => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
