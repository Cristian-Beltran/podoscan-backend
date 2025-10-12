// guards/user-type.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserTypes } from '../decorators/type-user.decorator';
import { UserType } from 'src/app/users/enums/user-type';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const allowedTypes = this.reflector.get<UserType[]>(
      UserTypes,
      context.getHandler(),
    );
    if (!allowedTypes) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;
    const isAuth = allowedTypes.some((item) => item === user?.type);
    if (!isAuth) throw new ForbiddenException('Your type is not allowed');
    return isAuth;
  }
}
