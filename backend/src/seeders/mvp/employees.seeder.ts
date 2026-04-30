import { Repository } from 'typeorm';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { IdentityTypeEnum } from '../../shared/enums/identity-type.enum';
import { RolesEnum } from '../../shared/enums/roles.enum';

export async function EmployeesSeeder(
  BranchRepository: Repository<Branch>,
  RoleRepository: Repository<Role>,
  EmployeeRepository: Repository<Employee>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcryptjs'),
) {
  const branches = await BranchRepository.find();
  const role = await RoleRepository.findOneBy({
    name: RolesEnum.EMPLOYEE,
  });
  if (!role) throw new Error('Role not found');

  if ((await EmployeeRepository.count()) === 0) {
    console.time('Employees Seeder');

    // 1. Pre-hash password una sola vez
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 2. Crear todos los employees en batch
    const employeesData = [];
    for (let i = 0; i < 100; i++) {
      employeesData.push({
        name: 'Empleado ' + i,
        branchId: branches[i % branches.length].id,
        identityType: IdentityTypeEnum.CC,
        identityNumber: Math.random().toString(36).substring(2, 12),
      });
    }

    // 3. Insertar todos los employees en una sola query
    const savedEmployees = await EmployeeRepository.save(employeesData);

    // 4. Crear todos los usuarios en batch usando los IDs guardados
    const usersData = savedEmployees.map((employee: Employee, i) => ({
      name: employee.name,
      email: `employee${i}@gmail.com`,
      password: hashedPassword,
      roleId: role.id,
      employeeId: employee.id,
    }));

    // 5. Insertar todos los usuarios en una sola query
    await UserRepository.insert(usersData);

    console.timeEnd('Employees Seeder');
    console.log(
      `Fake Employees and their Users Seeded: ${savedEmployees.length} records`,
    );
  }
}
