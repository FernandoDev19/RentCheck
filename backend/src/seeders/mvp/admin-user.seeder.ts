import { Repository } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { CreateUserDto } from '../../modules/users/dto/create-user.dto';
import { EnvVars } from '../../core/config/env.config';

export async function AdminSeeder(
  RoleRepository: Repository<Role>,
  UserRepository: Repository<User>,
  config: ConfigService<EnvVars>,
  bcrypt: typeof import('bcryptjs'),
) {
  const role: Role = await RoleRepository.findOneBy({
    name: RolesEnum.ADMIN,
  });

  if (!role) {
    throw new Error('Role not found');
  }

  const admin: CreateUserDto = {
    name: config.get('ADMIN_USERNAME', { infer: true }),
    email: config.get('ADMIN_EMAIL', { infer: true }),
    password: await bcrypt.hash(
      config.get('ADMIN_PASSWORD', { infer: true }),
      10,
    ),
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
