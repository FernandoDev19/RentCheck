import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService],
  imports: [
    TypeOrmModule.forFeature([Branch, User]),
    RolesModule,
    UsersModule,
    AuthModule,
  ],
})
export class BranchesModule {}
