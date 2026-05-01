import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvVars, envValidationSchema } from './config/env.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../modules/users/entities/user.entity';
import { Employee } from '../modules/employees/entities/employee.entity';
import { Renter } from '../modules/renters/entities/renter.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { Rental } from '../modules/rentals/entities/rental.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { BiometryRequest } from '../modules/biometry-requests/entities/biometry-request.entity';
import { RentalFeedback } from '../modules/rental-feedbacks/entities/rental-feedback.entity';
import { Plan } from '../modules/plans/entities/plan.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { MvpDataModule } from '../seeders/mvp/mvp-data.module';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: '1d' },
      }),
      global: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars>) => ({
        type: 'postgres',
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        username: config.get('DB_USERNAME', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
        database: config.get('DB_NAME', { infer: true }),
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
          Vehicle,
          User,
        ],
        synchronize: true,
      }),
    }),
    MvpDataModule,
    CacheModule,
  ],
})
export class CoreModule {}
