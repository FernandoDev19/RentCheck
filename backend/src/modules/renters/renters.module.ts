import { forwardRef, Module } from '@nestjs/common';
import { RentersService } from './renters.service';
import { RentersController } from './renters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Renter } from './entities/renter.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AuthModule } from '../auth/auth.module';
import { Branch } from '../branches/entities/branch.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalFeedback } from '../rental-feedbacks/entities/rental-feedback.entity';
import { BiometryRequest } from '../biometry-requests/entities/biometry-request.entity';

@Module({
  controllers: [RentersController],
  providers: [RentersService],
  imports: [
    TypeOrmModule.forFeature([Renter]),
    UsersModule,
    RolesModule,
    AuthModule,
  ],
  exports: [RentersService],
})
export class RentersModule {}
