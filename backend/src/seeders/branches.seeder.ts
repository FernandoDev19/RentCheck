import { Repository } from 'typeorm';
import { Renter } from '../modules/renters/entities/renter.entity';
import { RolesEnum } from '../core/enums/roles.enum';
import { Role } from '../modules/roles/entities/role.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { User } from '../modules/users/entities/user.entity';

export async function FakeBranchesSeeder(
  RenterRepository: Repository<Renter>,
  RoleRepository: Repository<Role>,
  BranchRepository: Repository<Branch>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcrypt'),
) {
  const renters = await RenterRepository.find();

  const role = await RoleRepository.findOneBy({
    name: RolesEnum.MANAGER,
  });
  if (!role) throw new Error('Role not found');

  if ((await RoleRepository.count()) === 0) {
    for (let i = 0; i < 1100; i++) {
      // 1. Crear y Guardar el Empleado
      const branch = BranchRepository.create({
        name: 'Sede ' + i,
        renterId: renters[i % renters.length].id,
        phone: Math.random().toPrecision(15).substring(2, 12),
        responsible: 'Responsable ' + i,
        responsiblePhone: Math.random().toPrecision(15).substring(2, 12),
        email: `branch${i}@gmail.com`,
      });
      const savedBranch = await BranchRepository.save(branch);

      // 2. Crear el Usuario usando el ID del Empleado guardado
      const user = UserRepository.create({
        name: 'Sede ' + i,
        email: savedBranch.email,
        password: await bcrypt.hash('123456', 10),
        roleId: role.id,
        branchId: savedBranch.id, // <--- Vinculación aquí
      });
      await UserRepository.save(user);
    }
    console.log('Fake Branches and their Users Seeded');
  }
}
