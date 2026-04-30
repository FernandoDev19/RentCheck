import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService],
  imports: [TypeOrmModule.forFeature([Branch, User, Role]), CacheModule],
})
export class BranchesModule {}
