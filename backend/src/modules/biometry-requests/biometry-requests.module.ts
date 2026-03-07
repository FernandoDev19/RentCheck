import { Module } from '@nestjs/common';
import { BiometryRequestsService } from './biometry-requests.service';
import { BiometryRequestsController } from './biometry-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiometryRequest } from './entities/biometry-request.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [BiometryRequestsController],
  providers: [BiometryRequestsService],
  imports: [TypeOrmModule.forFeature([BiometryRequest]), AuthModule],
})
export class BiometryRequestsModule {}
