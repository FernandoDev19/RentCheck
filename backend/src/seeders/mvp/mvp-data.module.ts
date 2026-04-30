import { Module } from '@nestjs/common';
import { MvpDataService } from './mvp-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';

@Module({
  providers: [MvpDataService],
  exports: [MvpDataService],
  imports: [TypeOrmModule.forFeature([User, Role])],
})
export class MvpDataModule {}
