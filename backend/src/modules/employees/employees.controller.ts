import {
  Controller,
  Get,
  Post,
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

  @Auth(RolesEnum.MANAGER, RolesEnum.OWNER)
  @Get()
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

  @Auth(RolesEnum.MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.employeesService.findOne(id, user);
  }

  @Auth(RolesEnum.MANAGER)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user);
  }

  @Auth(RolesEnum.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.employeesService.remove(id, user);
  }
}
