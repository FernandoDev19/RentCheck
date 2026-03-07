import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService],
  imports: [
    TypeOrmModule.forFeature([Employee]),
    RolesModule,
    UsersModule,
    AuthModule,
  ],
  exports: [EmployeesService],
})
export class EmployeesModule {}
