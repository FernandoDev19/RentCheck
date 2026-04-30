import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  imports: [TypeOrmModule.forFeature([Rental, Customer]), VehiclesModule],
})
export class RentalsModule {}
