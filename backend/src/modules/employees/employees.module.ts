import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService],
  imports: [TypeOrmModule.forFeature([Employee, User, Role, Branch])],
  exports: [EmployeesService],
})
export class EmployeesModule {}
