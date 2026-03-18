import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // @Post()
  // create(
  //   @Body() createEmployeeDto: CreateEmployeeDto,
  //   @ActiveUser() user: UserActiveInterface,
  // ) {
  //   return this.employeesService.create(createEmployeeDto, user);
  // }

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
