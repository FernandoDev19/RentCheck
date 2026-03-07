import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';

@Controller('branches')
@Auth(RolesEnum.OWNER)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
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

  @Get('names')
  findAllNames(@ActiveUser() user: UserActiveInterface) {
    return this.branchesService.findAllNames(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.branchesService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.branchesService.update(id, updateBranchDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.branchesService.remove(id, user);
  }
}
