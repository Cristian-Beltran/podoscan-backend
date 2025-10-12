// user-type.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserType } from 'src/app/users/enums/user-type';
export const USER_TYPE_KEY = 'user_type';
export const UserTypes = (...types: UserType[]) =>
  SetMetadata(USER_TYPE_KEY, types);
