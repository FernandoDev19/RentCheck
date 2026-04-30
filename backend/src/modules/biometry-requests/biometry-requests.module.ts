import { Module } from '@nestjs/common';
import { BiometryRequestsService } from './biometry-requests.service';
import { BiometryRequestsController } from './biometry-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiometryRequest } from './entities/biometry-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  controllers: [BiometryRequestsController],
  providers: [BiometryRequestsService],
  imports: [TypeOrmModule.forFeature([BiometryRequest, Customer]), CacheModule],
})
export class BiometryRequestsModule {}
