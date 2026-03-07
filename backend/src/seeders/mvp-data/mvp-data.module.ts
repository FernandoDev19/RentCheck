import { Module } from '@nestjs/common';
import { MvpDataService } from './mvp-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Plan } from '../../modules/plans/entities/plan.entity';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Rental } from '../../modules/rentals/entities/rental.entity';
import { RentalFeedback } from '../../modules/rental-feedbacks/entities/rental-feedback.entity';
import { BiometryRequest } from '../../modules/biometry-requests/entities/biometry-request.entity';

@Module({
  providers: [MvpDataService],
  exports: [MvpDataService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Plan,
      Renter,
      Branch,
      Employee,
      Customer,
      Rental,
      RentalFeedback,
      BiometryRequest,
    ]),
  ],
})
export class MvpDataModule {}
