import { Repository } from 'typeorm';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { User } from '../../modules/users/entities/user.entity';
import { RolesEnum } from '../../shared/enums/roles.enum';

export async function FakeBranchesSeeder(
  RenterRepository: Repository<Renter>,
  RoleRepository: Repository<Role>,
  BranchRepository: Repository<Branch>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcryptjs'),
) {
  const renters = await RenterRepository.find();

  const role = await RoleRepository.findOneBy({
    name: RolesEnum.MANAGER,
  });
  if (!role) throw new Error('Role not found');

  if ((await BranchRepository.count()) === 0) {
    console.time('Branches Seeder');

    // 1. Pre-hash password una sola vez
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 2. Crear todas las branches en batch
    const branchesData = [];
    for (let i = 0; i < 10; i++) {
      branchesData.push({
        name: 'Sede ' + i,
        renterId: renters[i % renters.length].id,
        phone: Math.random().toPrecision(15).substring(2, 12),
        responsible: 'Responsable ' + i,
        responsiblePhone: Math.random().toPrecision(15).substring(2, 12),
        email: `branch${i}@gmail.com`,
      });
    }

    // 3. Insertar todas las branches en una sola query
    const savedBranches = await BranchRepository.save(branchesData);

    // 4. Crear todos los usuarios en batch usando los IDs guardados
    const usersData = savedBranches.map((branch: Branch) => ({
      name: branch.name,
      email: branch.email,
      password: hashedPassword,
      roleId: role.id,
      branchId: branch.id,
    }));

    // 5. Insertar todos los usuarios en una sola query
    await UserRepository.insert(usersData);

    console.timeEnd('Branches Seeder');
    console.log(
      `Fake Branches and their Users Seeded: ${savedBranches.length} records`,
    );
  }
}
