import { Repository } from 'typeorm';
import { Role } from '../modules/roles/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RolesEnum } from '../core/enums/roles.enum';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';

export async function AdminSeeder(
  RoleRepository: Repository<Role>,
  UserRepository: Repository<User>,
  config: ConfigService,
  bcrypt: typeof import('bcrypt'),
) {
  const role: Role = await RoleRepository.findOneBy({
    name: RolesEnum.ADMIN,
  });

  if (!role) {
    throw new Error('Role not found');
  }

  const admin: CreateUserDto = {
    name: config.get('ADMIN_USERNAME'),
    email: config.get('ADMIN_EMAIL'),
    password: await bcrypt.hash(config.get('ADMIN_PASSWORD'), 10),
    roleId: role.id,
  };

  const adminExist = await UserRepository.findOneBy({
    email: admin.email,
  });

  if (!adminExist) {
    await UserRepository.insert(admin);
  }

  console.log('Admin seeded');
}
