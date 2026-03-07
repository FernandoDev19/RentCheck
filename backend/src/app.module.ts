import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RentersModule } from './modules/renters/renters.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansModule } from './modules/plans/plans.module';
import { BranchesModule } from './modules/branches/branches.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BiometryRequestsModule } from './modules/biometry-requests/biometry-requests.module';
import { RentalFeedbacksModule } from './modules/rental-feedbacks/rental-feedbacks.module';
import { RolesModule } from './modules/roles/roles.module';
import { User } from './modules/users/entities/user.entity';
import { Employee } from './modules/employees/entities/employee.entity';
import { Renter } from './modules/renters/entities/renter.entity';
import { Branch } from './modules/branches/entities/branch.entity';
import { Rental } from './modules/rentals/entities/rental.entity';
import { Customer } from './modules/customers/entities/customer.entity';
import { BiometryRequest } from './modules/biometry-requests/entities/biometry-request.entity';
import { RentalFeedback } from './modules/rental-feedbacks/entities/rental-feedback.entity';
import { Plan } from './modules/plans/entities/plan.entity';
import { Role } from './modules/roles/entities/role.entity';
import { MvpDataModule } from './seeders/mvp-data/mvp-data.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    UsersModule,
    EmployeesModule,
    RentersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          BiometryRequest,
          Customer,
          RentalFeedback,
          Rental,
          Role,
          Plan,
          Renter,
          Branch,
          Employee,
          User,
        ],
        synchronize: config.get('NODE_ENV') === 'development',
      }),
    }),
    PlansModule,
    BranchesModule,
    RentalsModule,
    CustomersModule,
    BiometryRequestsModule,
    RentalFeedbacksModule,
    RolesModule,
    MvpDataModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
