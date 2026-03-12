import { Repository } from 'typeorm';
import { Role } from '../modules/roles/entities/role.entity';
import { RolesEnum } from '../core/enums/roles.enum';
import { Renter } from '../modules/renters/entities/renter.entity';
import { User } from '../modules/users/entities/user.entity';
import { RenterStatus } from '../modules/renters/enums/renter-status.enum';

export async function FakeRentersSeeder(
  RoleRepository: Repository<Role>,
  RenterRepository: Repository<Renter>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcrypt'),
) {
  const role = await RoleRepository.findOneBy({
    name: RolesEnum.OWNER,
  });
  if (!role) throw new Error('Role not found');

  if ((await RenterRepository.count()) === 0) {
    for (let i = 0; i < 1000; i++) {
      // 1. Crear y Guardar el Renter primero
      const renter = RenterRepository.create({
        name: 'Rentadora ' + i,
        nit: Math.random().toString(36).substring(2, 9),
        phone: Math.random().toPrecision(15).substring(2, 12),
        legalRepresentative: 'Representante Legal ' + i,
        planId: Number((Math.random() * 2 + 1).toFixed()),
        balance: Number(Math.random().toPrecision(15).substring(2, 7)),
        lowBalanceThreshold: Number(
          Math.random().toPrecision(15).substring(2, 5),
        ),
        lowBalanceAlertEnabled: true,
        status: i % 2 === 0 ? RenterStatus.ACTIVE : RenterStatus.SUSPENDED,
      });
      const savedRenter = await RenterRepository.save(renter);

      // 2. Crear el Usuario usando el ID del Renter guardado
      const user = UserRepository.create({
        name: 'Rentadora ' + i,
        email: `renter${i}@gmail.com`,
        password: await bcrypt.hash('123456', 10),
        roleId: role.id,
        renterId: savedRenter.id, // <--- Vinculación aquí
      });
      await UserRepository.save(user);
    }
    console.log('Fake Renters and their Users Seeded');
  }
}
