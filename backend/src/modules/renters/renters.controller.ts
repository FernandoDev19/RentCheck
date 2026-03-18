import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { RentersService } from './renters.service';
import { CreateRenterDto } from './dto/create-renter.dto';
import { UpdateRenterDto } from './dto/update-renter.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { RolesEnum } from '../../core/enums/roles.enum';

@Controller('renters')
@Auth(RolesEnum.ADMIN)
export class RentersController {
  constructor(private readonly rentersService: RentersService) {}

  @Post()
  create(@Body() createRenterDto: CreateRenterDto) {
    return this.rentersService.create(createRenterDto);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('orderDir') orderDir: string,
    @Query('search') search: string,
  ) {
    return this.rentersService.findAll(page, limit, orderBy, orderDir, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rentersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRenterDto: UpdateRenterDto) {
    return this.rentersService.update(id, updateRenterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rentersService.remove(id);
  }
}
