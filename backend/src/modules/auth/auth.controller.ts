import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { ActiveUser } from './decorators/active-user.decorator';
import { UserActiveInterface } from './interfaces/active-user.interface';
import { RegisterDto } from './dto/register.dto';
import { Auth } from './decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { RegisterBranchDto } from './dto/register-branch.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterRenterDto } from './dto/register-renter.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() login: LoginDto) {
    return this.authService.login(login);
  }

  @Post('register/admin')
  @Auth(RolesEnum.ADMIN)
  registerAdmin(@Body() register: RegisterDto) {
    return this.authService.registerAdmin(register);
  }

  @Post('register/renter')
  registerRenter(@Body() register: RegisterRenterDto) {
    return this.authService.registerRenter(register);
  }

  @Post('register/branch')
  @Auth(RolesEnum.OWNER)
  registerBranch(
    @Body() register: RegisterBranchDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.authService.registerBranch(register, user);
  }

  @Post('register/employee')
  @Auth(RolesEnum.OWNER, RolesEnum.MANAGER)
  registerEmployee(
    @Body() register: RegisterEmployeeDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.authService.registerEmployee(register, user);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.authService.profile(user);
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
