import { Module } from '@nestjs/common';
import { RentersService } from './renters.service';
import { RentersController } from './renters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Renter } from './entities/renter.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { User } from '../users/entities/user.entity';

@Module({
  controllers: [RentersController],
  providers: [RentersService],
  imports: [TypeOrmModule.forFeature([Renter, User]), UsersModule, RolesModule],
  exports: [RentersService],
})
export class RentersModule {}
