import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Renter } from '../renters/entities/renter.entity';
import { BiometryRequest } from '../biometry-requests/entities/biometry-request.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  providers: [TasksService],
  imports: [
    TypeOrmModule.forFeature([
      Rental,
      Vehicle,
      BiometryRequest,
      Renter,
      Notification,
    ]),
  ],
})
export class TasksModule {}
