import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../shared/enums/roles.enum';

@Injectable()
export class NotificationsService {
  private readonly logger: Logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAllUnread(user: UserActiveInterface) {
    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.read = false')
      .orderBy('n.createdAt', 'DESC')
      .take(20);

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        qb.andWhere('n.renterId = :renterId', { renterId: user.renterId });
        break;
      case RolesEnum.MANAGER:
        qb.andWhere(
          '(n.branchId = :branchId OR (n.renterId = :renterId AND n.branchId IS NULL))',
          { branchId: user.branchId, renterId: user.renterId },
        );
        break;
      case RolesEnum.EMPLOYEE:
        qb.andWhere('(n.employeeId = :employeeId OR n.branchId = :branchId)', {
          employeeId: user.employeeId,
          branchId: user.branchId,
        });
        break;
    }

    return await qb.getMany();
  }

  async markAsRead(id: string, user: UserActiveInterface) {
    return await this.notificationRepository.update(
      {
        id,
        renterId: user.renterId,
      },
      {
        read: true,
      },
    );
  }

  async markAllAsRead(user: UserActiveInterface) {
    const qb = this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('read = false');

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        qb.andWhere('renterId = :renterId', { renterId: user.renterId });
        break;
      case RolesEnum.MANAGER:
        qb.andWhere('branchId = :branchId', { branchId: user.branchId });
        break;
      case RolesEnum.EMPLOYEE:
        qb.andWhere('employeeId = :employeeId', {
          employeeId: user.employeeId,
        });
        break;
    }

    return await qb.execute();
  }
}
