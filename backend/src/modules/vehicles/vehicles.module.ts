import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Renter } from '../renters/entities/renter.entity';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService],
  imports: [TypeOrmModule.forFeature([Vehicle, Renter])],
  exports: [VehiclesService],
})
export class VehiclesModule {}
