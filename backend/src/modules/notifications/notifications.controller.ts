import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Auth } from '../../core/decorators/auth.decorator';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../shared/enums/roles.enum';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Auth(...Object.values(RolesEnum))
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.notificationsService.findAllUnread(user);
  }

  @Patch('read-all')
  @Auth(...Object.values(RolesEnum))
  markAllAsRead(@ActiveUser() user: UserActiveInterface) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  @Auth(...Object.values(RolesEnum))
  markAsRead(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.notificationsService.markAsRead(id, user);
  }
}
