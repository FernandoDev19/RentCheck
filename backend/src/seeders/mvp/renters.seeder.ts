import { Repository } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { User } from '../../modules/users/entities/user.entity';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { RenterStatus } from '../../modules/renters/enums/renter-status.enum';

export async function FakeRentersSeeder(
  RoleRepository: Repository<Role>,
  RenterRepository: Repository<Renter>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcryptjs'),
) {
  const role = await RoleRepository.findOneBy({
    name: RolesEnum.OWNER,
  });
  if (!role) throw new Error('Role not found');

  if ((await RenterRepository.count()) === 0) {
    console.time('Renters Seeder');

    // 1. Pre-hash password una sola vez
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 2. Crear todos los renters en batch
    const rentersData = [];
    for (let i = 0; i < 5; i++) {
      rentersData.push({
        name: 'Rentadora ' + i,
        nit: Math.random().toString(36).substring(2, 9),
        phone: Math.random().toPrecision(15).substring(2, 12),
        legalRepresentative: 'Representante Legal ' + i,
        planId: 3,
        balance: Number(Math.random().toPrecision(15).substring(2, 7)),
        lowBalanceThreshold: Number(
          Math.random().toPrecision(15).substring(2, 5),
        ),
        lowBalanceAlertEnabled: true,
        status: i % 2 === 0 ? RenterStatus.ACTIVE : RenterStatus.SUSPENDED,
      });
    }

    // 3. Insertar todos los renters en una sola query
    const savedRenters = await RenterRepository.save(rentersData);

    // 4. Crear todos los usuarios en batch usando los IDs guardados
    const usersData = savedRenters.map((renter: Renter, i) => ({
      name: renter.name,
      email: `renter${i}@gmail.com`,
      password: hashedPassword,
      roleId: role.id,
      renterId: renter.id,
    }));

    // 5. Insertar todos los usuarios en una sola query
    await UserRepository.insert(usersData);

    console.timeEnd('Renters Seeder');
    console.log(
      `Fake Renters and their Users Seeded: ${savedRenters.length} records`,
    );
  }
}
