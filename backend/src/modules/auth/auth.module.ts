import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Renter } from '../renters/entities/renter.entity';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UsersModule, TypeOrmModule.forFeature([Branch, Employee, Renter])],
})
export class AuthModule {}
