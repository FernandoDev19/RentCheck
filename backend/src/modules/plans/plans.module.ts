import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';

@Module({
  controllers: [PlansController],
  providers: [PlansService],
  imports: [AuthModule, TypeOrmModule.forFeature([Plan])],
})
export class PlansModule {}
