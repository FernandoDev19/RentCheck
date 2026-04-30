import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Query,
  Put,
  Post,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { RegisterEmployeeDto } from './dto/register-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Auth(RolesEnum.OWNER, RolesEnum.MANAGER)
  registerEmployee(
    @Body() register: RegisterEmployeeDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.employeesService.registerEmployee(register, user);
  }

  @Get()
  @Auth(RolesEnum.MANAGER, RolesEnum.OWNER)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.employeesService.findAll(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get(':id')
  @Auth(RolesEnum.MANAGER)
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.employeesService.findOne(id, user);
  }

  @Put(':id')
  @Auth(RolesEnum.MANAGER, RolesEnum.OWNER)
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user);
  }

  @Delete(':id')
  @Auth(RolesEnum.MANAGER, RolesEnum.OWNER)
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.employeesService.remove(id, user);
  }
}
