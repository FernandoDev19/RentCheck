// ─── fakeBiometryRequests.seeder.ts ──────────────────────────────────────────

import { Repository } from 'typeorm';
import { BiometryRequest } from '../modules/biometry-requests/entities/biometry-request.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Employee } from '../modules/employees/entities/employee.entity';

export async function fakeBiometryRequestsSeeder(
  BiometryRequestRepository: Repository<BiometryRequest>,
  CustomerRepository: Repository<Customer>,
  EmployeeRepository: Repository<Employee>, // 👈 Employee directo, no User
) {
  const count = await BiometryRequestRepository.count();
  if (count > 0) return;

  const customers = await CustomerRepository.find();
  const employees = await EmployeeRepository.find({
    relations: ['branch', 'branch.renter'],
  });

  // Solo empleados con renterId resolvible
  const validEmployees = employees.filter((e) => e.branch?.renter?.id != null);

  if (validEmployees.length === 0) {
    console.log('No hay empleados válidos para sembrar biometrías');
    return;
  }

  const biometryData = [];

  for (const customer of customers) {
    // Usamos un empleado random válido (coherente con cómo se crean las rentas)
    const randomEmployee =
      validEmployees[Math.floor(Math.random() * validEmployees.length)];

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
      result = 'rejected';
    }

    biometryData.push({
      renterId: randomEmployee.branch.renter.id, // ✅ siempre válido
      customerId: customer.id,
      employeeId: randomEmployee.id, // ✅ siempre válido
      status,
      result,
      providerReference: `SIM-${Math.random().toString(36).substring(2, 9)}`,
    });
  }

  await BiometryRequestRepository.insert(biometryData);
  console.log('✅ Biometrías sembradas exitosamente');
}
