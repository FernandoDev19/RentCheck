import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { RentersModule } from './renters/renters.module';
import { PlansModule } from './plans/plans.module';
import { BranchesModule } from './branches/branches.module';
import { RentalsModule } from './rentals/rentals.module';
import { CustomersModule } from './customers/customers.module';
import { BiometryRequestsModule } from './biometry-requests/biometry-requests.module';
import { RentalFeedbacksModule } from './rental-feedbacks/rental-feedbacks.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    EmployeesModule,
    RentersModule,
    PlansModule,
    BranchesModule,
    RentalsModule,
    CustomersModule,
    BiometryRequestsModule,
    RentalFeedbacksModule,
    VehiclesModule,
    TasksModule,
    NotificationsModule,
  ],
})
export class DomainModule {}
