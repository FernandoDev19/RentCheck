import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BiometryRequestsService } from './biometry-requests.service';
import { CreateBiometryRequestDto } from './dto/create-biometry-request.dto';
import { UpdateBiometryRequestDto } from './dto/update-biometry-request.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';

@Controller('biometry-requests')
export class BiometryRequestsController {
  constructor(
    private readonly biometryRequestsService: BiometryRequestsService,
  ) {}

  // @Post()
  // @Auth(RolesEnum.EMPLOYEE)
  // create(@Body() createBiometryRequestDto: CreateBiometryRequestDto) {
  //   return this.biometryRequestsService.create(createBiometryRequestDto);
  // }

  @Post('request')
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.MANAGER, RolesEnum.OWNER)
  requestBiometry(
    @Body('customerId') customerId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.biometryRequestsService.requestBiometry(customerId, user);
  }

  // Ruta pública — sin guard, la abre el cliente desde su celular
  @Patch('simulate/:token')
  simulateResult(
    @Param('token') token: string,
    @Body('result') result: 'approved' | 'rejected',
  ) {
    return this.biometryRequestsService.simulateResult(token, result);
  }

  @Get()
  @Auth(...Object.values(RolesEnum))
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.biometryRequestsService.findAll(page, limit, user);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.biometryRequestsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateBiometryRequestDto: UpdateBiometryRequestDto,
  // ) {
  //   return this.biometryRequestsService.update(+id, updateBiometryRequestDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.biometryRequestsService.remove(+id);
  // }
}
