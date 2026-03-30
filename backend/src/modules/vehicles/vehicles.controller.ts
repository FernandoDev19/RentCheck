import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Auth(RolesEnum.OWNER, RolesEnum.MANAGER)
  create(
    @Body() data: CreateVehicleDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vehiclesService.create(data, user);
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
    return this.vehiclesService.findAll(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get('available')
  @Auth(...Object.values(RolesEnum))
  findAllAvailable(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @Query('branchId') branchId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vehiclesService.findAllAvailable(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
      branchId,
    );
  }

  @Get('available-by-date')
  @Auth(...Object.values(RolesEnum))
  findAvailableByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('branchId') branchId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vehiclesService.findAvailableByDateRange(
      startDate,
      endDate,
      page,
      limit,
      search,
      user,
      branchId,
    );
  }

  @Get(':id')
  @Auth(...Object.values(RolesEnum))
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.vehiclesService.findOne(id, user);
  }

  @Put(':id')
  @Auth(RolesEnum.OWNER, RolesEnum.MANAGER)
  update(
    @Param('id') id: string,
    @Body() data: UpdateVehicleDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vehiclesService.update(id, data, user);
  }

  @Delete(':id')
  @Auth(RolesEnum.OWNER, RolesEnum.MANAGER)
  delete(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.vehiclesService.remove(id, user);
  }
}
