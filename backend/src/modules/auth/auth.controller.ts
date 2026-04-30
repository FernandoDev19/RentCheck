import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { UserActiveInterface } from './interfaces/active-user.interface';
import { RegisterDto } from './dto/register.dto';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('login')
  login(@Body() login: LoginDto) {
    return this.authService.login(login);
  }

  @Post('register/admin')
  @Auth(RolesEnum.ADMIN)
  registerAdmin(@Body() register: RegisterDto) {
    return this.authService.registerAdmin(register);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.userService.profile(user);
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  verify(@ActiveUser() user: UserActiveInterface) {
    return {
      isValid: true,
      user: user,
    };
  }
}
