import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  Query,
  Post,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RegisterBranchDto } from './dto/register-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Auth(RolesEnum.OWNER)
  registerBranch(
    @Body() register: RegisterBranchDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.branchesService.registerBranch(register, user);
  }

  @Get()
  @Auth(RolesEnum.OWNER, RolesEnum.ADMIN)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.branchesService.findAll(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get('renter/:renterId')
  @Auth(RolesEnum.ADMIN)
  findAllByRenterId(
    @Param('renterId') renterId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
  ) {
    return this.branchesService.findAllByRenterId(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      renterId,
    );
  }

  @Get('names')
  @Auth(RolesEnum.OWNER)
  findAllNames(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.branchesService.findAllNames(
      page,
      limit,
      orderBy,
      orderDir,
      search,
      user,
    );
  }

  @Get(':id')
  @Auth(RolesEnum.OWNER)
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.branchesService.findOne(id, user);
  }

  @Put(':id')
  @Auth(RolesEnum.OWNER)
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.branchesService.update(id, updateBranchDto, user);
  }

  @Delete(':id')
  @Auth(RolesEnum.OWNER)
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.branchesService.remove(id, user);
  }
}
