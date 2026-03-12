import { Repository } from 'typeorm';
import { BiometryRequest } from '../modules/biometry-requests/entities/biometry-request.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { User } from '../modules/users/entities/user.entity';

export async function fakeBiometryRequestsSeeder(
  BiometryRequestRepository: Repository<BiometryRequest>,
  CustomerRepository: Repository<Customer>,
  UserRepository: Repository<User>,
) {
  const count = await BiometryRequestRepository.count();
  if (count > 0) return;

  const customers = await CustomerRepository.find();
  const users = await UserRepository.find({
    relations: ['employee', 'employee.branch', 'employee.branch.renter'],
  });

  const biometryData = [];

  for (const customer of customers) {
    // Tomamos el usuario que registró originalmente al cliente para coherencia
    const user =
      users.find((e) => e.id === customer.registeredByUserId) || users[0];

    // Creamos una biometría por cada cliente
    const statusRand = Math.random();
    let status: 'pending' | 'completed' | 'expired' = 'completed';
    let result: 'approved' | 'rejected' | null = 'approved';

    if (statusRand < 0.2) {
      status = 'pending';
      result = null;
    } else if (statusRand < 0.4) {
      status = 'expired';
      result = null;
    } else if (statusRand < 0.5) {
      status = 'completed';
      result = 'rejected'; // Simular un caso de alerta
    }

    biometryData.push({
      renterId: user.employee?.branch?.renterId,
      customerId: customer.id,
      employeeId: user.employeeId,
      status: status,
      result: result,
      providerReference: `become_ref_${Math.random().toString(36).substring(7)}`,
    });
  }

  // Insertamos en bloques para evitar saturar la conexión
  await BiometryRequestRepository.insert(biometryData);
  console.log('✅ Biometrías sembradas exitosamente');
}
