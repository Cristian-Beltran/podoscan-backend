import { UserType } from 'src/app/users/enums/user-type';

export interface PayloadToken {
  sub: string;
  type: UserType;
  email: string;
  role?: string;
  tokenType?: string;
}
