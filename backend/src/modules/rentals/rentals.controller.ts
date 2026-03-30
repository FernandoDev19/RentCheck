import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { CreateRentalManualDto } from './dto/create-rental-manual.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  // @Post()
  // @Auth(RolesEnum.EMPLOYEE)
  // create(@Body() createRentalDto: CreateRentalDto) {
  //   return this.rentalsService.create(createRentalDto);
  // }

  @Post('/create-manually')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.OWNER, RolesEnum.MANAGER)
  createManually(
    @Body() createRentalManualDto: CreateRentalManualDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.createManualRental(createRentalManualDto, user);
  }

  @Get()
  @Auth(...Object.values(RolesEnum))
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.findAll(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Auth(RolesEnum.EMPLOYEE, RolesEnum.MANAGER, RolesEnum.OWNER)
  @Get('customer/:customerId')
  findAllByCustomer(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.findAllByCustomer(
      customerId,
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get('pending-feedback')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.MANAGER, RolesEnum.OWNER)
  findAllPendingFeedback(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.findAllPendingFeedback(
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
    return this.rentalsService.findOne(id, user);
  }

  // @Put(':id')
  // @Auth(RolesEnum.EMPLOYEE)
  // update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
  //   return this.rentalsService.update(id, updateRentalDto);
  // }

  @Post(':id/assign-vehicle')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.OWNER, RolesEnum.MANAGER)
  assignVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignVehicleDto: AssignVehicleDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.assignVehicle(id, assignVehicleDto.vehicleId, user);
  }

  @Post(':id/return')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.OWNER, RolesEnum.MANAGER)
  returnRental(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalsService.returnRental(id, user);
  }

  @Delete(':id')
  @Auth(...Object.values(RolesEnum))
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.rentalsService.remove(id, user);
  }
}
