import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { RentalFeedback } from '../rental-feedbacks/entities/rental-feedback.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  imports: [TypeOrmModule.forFeature([Customer, RentalFeedback]), AuthModule],
  exports: [CustomersService],
})
export class CustomersModule {}
