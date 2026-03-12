import { Repository } from 'typeorm';
import { CreateRoleDto } from '../modules/roles/dto/create-role.dto';
import { Role } from '../modules/roles/entities/role.entity';
import { RolesEnum } from '../core/enums/roles.enum';

export async function RolesSeeder(RoleRepository: Repository<Role>) {
  const roles: CreateRoleDto[] = [
    { name: RolesEnum.ADMIN },
    { name: RolesEnum.OWNER },
    { name: RolesEnum.MANAGER },
    { name: RolesEnum.EMPLOYEE },
  ];

  if ((await RoleRepository.count()) === 0) {
    await RoleRepository.insert(roles);
  }

  console.log('Roles seeded');
}
