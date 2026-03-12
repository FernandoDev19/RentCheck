import { Repository } from 'typeorm';
import { Branch } from '../modules/branches/entities/branch.entity';
import { Employee } from '../modules/employees/entities/employee.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { RolesEnum } from '../core/enums/roles.enum';
import { IdentityTypeEnum } from '../core/enums/identity-type.enum';

export async function EmployeesSeeder(
  BranchRepository: Repository<Branch>,
  RoleRepository: Repository<Role>,
  EmployeeRepository: Repository<Employee>,
  UserRepository: Repository<User>,
  bcrypt: typeof import('bcrypt'),
) {
  const branches = await BranchRepository.find();
  const role = await RoleRepository.findOneBy({
    name: RolesEnum.EMPLOYEE,
  });
  if (!role) throw new Error('Role not found');

  if ((await EmployeeRepository.count()) === 0) {
    for (let i = 0; i < 1200; i++) {
      // 1. Crear y Guardar el Empleado
      const employee = EmployeeRepository.create({
        name: 'Empleado ' + i,
        branchId: branches[i % branches.length].id,
        identityType: IdentityTypeEnum.CC,
        identityNumber: Math.random().toString(36).substring(2, 12),
      });
      const savedEmployee = await EmployeeRepository.save(employee);

      // 2. Crear el Usuario usando el ID del Empleado guardado
      const user = UserRepository.create({
        name: 'Empleado ' + i,
        email: `employee${i}@gmail.com`,
        password: await bcrypt.hash('123456', 10),
        roleId: role.id,
        employeeId: savedEmployee.id, // <--- Vinculación aquí
      });
      await UserRepository.save(user);
    }
    console.log('Fake Employees and their Users Seeded');
  }
}
