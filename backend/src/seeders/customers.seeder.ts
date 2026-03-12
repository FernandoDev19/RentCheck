import { Repository } from 'typeorm';
import { Customer } from '../modules/customers/entities/customer.entity';
import { User } from '../modules/users/entities/user.entity';
import { RolesEnum } from '../core/enums/roles.enum';
import { IdentityTypeEnum } from '../core/enums/identity-type.enum';
import { CustomerStatusEnum } from '../modules/customers/enums/customer-status.enum';

export async function fakeCustomersSeeder(
  CustomerRepository: Repository<Customer>,
  UserRepository: Repository<User>,
) {
  const customersCount = await CustomerRepository.count();

  if (customersCount > 0) return;

  const users = await UserRepository.find({
    where: {
      role: {
        name: RolesEnum.EMPLOYEE,
      },
    },
    relations: ['role'],
  });

  if (users.length === 0) {
    console.log('No hay usuarios para asignar registros');
    return;
  }

  const customersData = [];

  for (let i = 0; i < 7000; i++) {
    // Escogemos un empleado al azar para la trazabilidad
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // fakeCustomersSeeder — corregido
    customersData.push({
      identityType: i % 3 === 0 ? IdentityTypeEnum.CE : IdentityTypeEnum.CC,
      identityNumber: `ID-${1000 + i}`,
      name: `NombreCliente${i}`,
      lastName: `ApellidoCliente${i}`,
      phone: `300${100000 + i}`,
      email: `cliente${i}@test.com`,
      registeredByUserId: randomUser.id,
      status: CustomerStatusEnum.NORMAL,
    });
  }

  // Insertar todo de un solo golpe (Mucho más rápido)
  await CustomerRepository.insert(customersData);
  console.log('✅ Clientes creados con trazabilidad');
}
