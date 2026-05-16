import { UserActiveInterface } from '../interfaces/active-user.interface';

export class LoginResponseDto {
  accessToken: string;
  user: UserActiveInterface;
}
