import { Controller, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';

@Controller('roles')
@Auth(RolesEnum.ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }
}
