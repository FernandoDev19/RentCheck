import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // @Auth(...Object.values(RolesEnum))
  // @Post()
  // create(@Body() createCustomerDto: CreateCustomerDto) {
  //   return this.customersService.create(createCustomerDto);
  // }

  @Get()
  @Auth(...Object.values(RolesEnum))
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.customersService.findAll(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get(':id')
  @Auth(...Object.values(RolesEnum))
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.customersService.findOne(id, user);
  }

  @Get('/identity/:identity')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.OWNER, RolesEnum.MANAGER)
  findOneByIdentityNumber(
    @Param('identity') identity: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.customersService.findOneByIdentityNumber(identity, user);
  }

  // @Put(':id')
  // @Auth(RolesEnum.ADMIN)
  // update(
  //   @Param('id') id: string,
  //   @Body() updateCustomerDto: UpdateCustomerDto,
  //   @ActiveUser() user: UserActiveInterface,
  // ) {
  //   return this.customersService.update(id, updateCustomerDto, user);
  // }

  // @Delete(':id')
  // @Auth(RolesEnum.ADMIN)
  // remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
  //   return this.customersService.remove(id, user);
  // }
}
