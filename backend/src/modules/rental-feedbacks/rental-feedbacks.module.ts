import { Module } from '@nestjs/common';
import { RentalFeedbacksService } from './rental-feedbacks.service';
import { RentalFeedbacksController } from './rental-feedbacks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalFeedback } from './entities/rental-feedback.entity';
import { CustomersModule } from '../customers/customers.module';
import { AuthModule } from '../auth/auth.module';
import { Rental } from '../rentals/entities/rental.entity';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  controllers: [RentalFeedbacksController],
  providers: [RentalFeedbacksService],
  imports: [
    TypeOrmModule.forFeature([RentalFeedback, Rental]),
    CustomersModule,
    AuthModule,
    VehiclesModule,
  ],
})
export class RentalFeedbacksModule {}
