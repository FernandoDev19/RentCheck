import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from '../../modules/roles/dto/create-role.dto';
import { CreateUserDto } from '../../modules/users/dto/create-user.dto';
import { User } from '../../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreatePlanDto } from '../../modules/plans/dto/create-plan.dto';
import { Plan } from '../../modules/plans/entities/plan.entity';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { RolesEnum } from '../../core/enums/roles.enum';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { IdentityTypeEnum } from '../../core/enums/identity-type.enum';
import { CustomerStatusEnum } from '../../core/enums/customer-status.enum';
import { Rental } from '../../modules/rentals/entities/rental.entity';
import { RentalFeedback } from '../../modules/rental-feedbacks/entities/rental-feedback.entity';
import {
  CreateRentalFeedbackDto,
  Score,
} from '../../modules/rental-feedbacks/dto/create-rental-feedback.dto';
import { BiometryRequest } from '../../modules/biometry-requests/entities/biometry-request.entity';
import { RentalStatusEnum } from '../../modules/rentals/enums/rental-status.enum';

@Injectable()
export class MvpDataService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Role) private readonly RoleRepository: Repository<Role>,
    @InjectRepository(User) private readonly UserRepository: Repository<User>,
    @InjectRepository(Plan) private readonly PlanRepository: Repository<Plan>,
    @InjectRepository(Renter)
    private readonly RenterRepository: Repository<Renter>,
    @InjectRepository(Branch)
    private readonly BranchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly EmployeeRepository: Repository<Employee>,
    @InjectRepository(Customer)
    private readonly CustomerRepository: Repository<Customer>,
    @InjectRepository(Rental)
    private readonly RentalRepository: Repository<Rental>,
    @InjectRepository(RentalFeedback)
    private readonly RentalFeedbackRepository: Repository<RentalFeedback>,
    @InjectRepository(BiometryRequest)
    private readonly BiometryRequestRepository: Repository<BiometryRequest>,
  ) {}

  async run() {
    // if (
    //   this.config.get<'development' | 'production'>('NODE_ENV') ===
    //   'development'
    // ) {
    //   await this.resetDatabase();
    // }

    await this.RolesSeeder();
    await this.PlansSeeder();
    await this.AdminSeeder();

    if (
      this.config.get<'development' | 'production'>('NODE_ENV') ===
      'development'
    ) {
      await this.FakeRentersSeeder();
      await this.FakeBranchesSeeder();
      await this.EmployeesSeeder();
      await this.fakeCustomersSeeder();
      await this.fakeRentalsSeeder();
      await this.fakeBiometryRequestsSeeder();
    }
  }

  private async resetDatabase() {
    console.log('Reiniciando base de datos...');

    const entities = [
      'users',
      'employees',
      'branches',
      'renters',
      'plans',
      'roles',
      'customers',
      'rentals',
      'rental_feedbacks',
    ];

    try {
      for (const table of entities) {
        await this.UserRepository.query(
          `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`,
        );
      }
      console.log('✅ Base de datos limpia y contadores reiniciados');
    } catch (error) {
      console.error(
        '❌ Error al reiniciar la base de datos:',
        (error as Error).message,
      );
    }
  }

  private async RolesSeeder() {
    const roles: CreateRoleDto[] = [
      { name: RolesEnum.ADMIN },
      { name: RolesEnum.OWNER },
      { name: RolesEnum.MANAGER },
      { name: RolesEnum.EMPLOYEE },
    ];

    if ((await this.RoleRepository.count()) === 0) {
      await this.RoleRepository.insert(roles);
    }

    console.log('Roles seeded');
  }

  private async PlansSeeder() {
    const plans: CreatePlanDto[] = [
      {
        name: 'Free',
        max_users: 1,
        max_branches: 1,
        advanced_reports_enabled: false,
        email_alerts_enabled: false,
        priority_support: false,
        price: 0,
      },
      {
        name: 'Basic',
        max_users: 5,
        max_branches: 3,
        advanced_reports_enabled: true,
        email_alerts_enabled: true,
        priority_support: false,
        price: 10000,
      },
      {
        name: 'Premium',
        max_users: 9999,
        max_branches: 9999,
        advanced_reports_enabled: true,
        email_alerts_enabled: true,
        priority_support: true,
        price: 50000,
      },
    ];

    if ((await this.PlanRepository.count()) === 0) {
      await this.PlanRepository.insert(plans);
    }

    console.log('Plans seeded');
  }

  private async AdminSeeder() {
    const role: Role = await this.RoleRepository.findOneBy({
      name: RolesEnum.ADMIN,
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const admin: CreateUserDto = {
      name: this.config.get('ADMIN_USERNAME'),
      email: this.config.get('ADMIN_EMAIL'),
      password: await bcrypt.hash(this.config.get('ADMIN_PASSWORD'), 10),
      roleId: role.id,
    };

    const adminExist = await this.UserRepository.findOneBy({
      email: admin.email,
    });

    if (!adminExist) {
      await this.UserRepository.insert(admin);
    }

    console.log('Admin seeded');
  }

  private async FakeRentersSeeder() {
    const role = await this.RoleRepository.findOneBy({
      name: RolesEnum.OWNER,
    });
    if (!role) throw new Error('Role not found');

    if ((await this.RenterRepository.count()) === 0) {
      for (let i = 0; i < 1000; i++) {
        // 1. Crear y Guardar el Renter primero
        const renter = this.RenterRepository.create({
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
          status: i % 2 === 0 ? 'active' : 'suspended',
        });
        const savedRenter = await this.RenterRepository.save(renter);

        // 2. Crear el Usuario usando el ID del Renter guardado
        const user = this.UserRepository.create({
          name: 'Rentadora ' + i,
          email: `renter${i}@gmail.com`,
          password: await bcrypt.hash('123456', 10),
          roleId: role.id,
          renterId: savedRenter.id, // <--- Vinculación aquí
        });
        await this.UserRepository.save(user);
      }
      console.log('Fake Renters and their Users Seeded');
    }
  }

  private async FakeBranchesSeeder() {
    const renters = await this.RenterRepository.find();

    const role = await this.RoleRepository.findOneBy({
      name: RolesEnum.MANAGER,
    });
    if (!role) throw new Error('Role not found');

    if ((await this.BranchRepository.count()) === 0) {
      for (let i = 0; i < 1100; i++) {
        // 1. Crear y Guardar el Empleado
        const branch = this.BranchRepository.create({
          name: 'Sede ' + i,
          renterId: renters[i % renters.length].id,
          phone: Math.random().toPrecision(15).substring(2, 12),
          responsible: 'Responsable ' + i,
          responsiblePhone: Math.random().toPrecision(15).substring(2, 12),
          email: `branch${i}@gmail.com`,
        });
        const savedBranch = await this.BranchRepository.save(branch);

        // 2. Crear el Usuario usando el ID del Empleado guardado
        const user = this.UserRepository.create({
          name: 'Sede ' + i,
          email: savedBranch.email,
          password: await bcrypt.hash('123456', 10),
          roleId: role.id,
          branchId: savedBranch.id, // <--- Vinculación aquí
        });
        await this.UserRepository.save(user);
      }
      console.log('Fake Branches and their Users Seeded');
    }
  }

  private async EmployeesSeeder() {
    const branches = await this.BranchRepository.find();
    const role = await this.RoleRepository.findOneBy({
      name: RolesEnum.EMPLOYEE,
    });
    if (!role) throw new Error('Role not found');

    if ((await this.EmployeeRepository.count()) === 0) {
      for (let i = 0; i < 1200; i++) {
        // 1. Crear y Guardar el Empleado
        const employee = this.EmployeeRepository.create({
          name: 'Empleado ' + i,
          branchId: branches[i % branches.length].id,
          identityType: IdentityTypeEnum.CC,
          identityNumber: Math.random().toString(36).substring(2, 12),
        });
        const savedEmployee = await this.EmployeeRepository.save(employee);

        // 2. Crear el Usuario usando el ID del Empleado guardado
        const user = this.UserRepository.create({
          name: 'Empleado ' + i,
          email: `employee${i}@gmail.com`,
          password: await bcrypt.hash('123456', 10),
          roleId: role.id,
          employeeId: savedEmployee.id, // <--- Vinculación aquí
        });
        await this.UserRepository.save(user);
      }
      console.log('Fake Employees and their Users Seeded');
    }
  }

  private async fakeCustomersSeeder() {
    const customersCount = await this.CustomerRepository.count();
    if (customersCount > 0) return; // Si ya hay, no hacer nada

    const users = await this.UserRepository.find({
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
    await this.CustomerRepository.insert(customersData);
    console.log('✅ 50 Clientes creados con trazabilidad');
  }

  private async fakeRentalsSeeder() {
    const rentalsCount = await this.RentalRepository.count();
    if (rentalsCount > 0) return;

    const customers = await this.CustomerRepository.find();
    const employees = await this.EmployeeRepository.find({
      relations: ['branch', 'branch.renter'],
    });

    if (customers.length === 0 || employees.length === 0) {
      console.log('Faltan clientes o empleados para sembrar rentas');
      return;
    }

    for (const customer of customers) {
      // Vamos a crear 2 rentas por cada cliente para tener historial
      for (let i = 0; i < 4; i++) {
        const randomEmployee =
          employees[Math.floor(Math.random() * employees.length)];
        const isFirstRenta = i === 0;

        // La primera renta será antigua y ya finalizada (con feedback)
        // La segunda renta será reciente y todavía "active"
        const status = isFirstRenta
          ? RentalStatusEnum.RETURNED
          : RentalStatusEnum.ACTIVE;

        const rental: Rental = this.RentalRepository.create({
          customerId: customer.id,
          employeeId: randomEmployee.id,
          branchId: randomEmployee.branch.id,
          renterId: randomEmployee.branch.renter.id,
          startDate: new Date(2025, 0, 1 + i), // Fechas escalonadas
          expectedReturnDate: new Date(2025, 0, 5 + i),
          actualReturnDate: isFirstRenta ? new Date(2025, 0, 5 + i) : null,
          rentalStatus: status,
        });

        const savedRental = await this.RentalRepository.save(rental);

        // Si la renta está "returned", le creamos un feedback
        if (status === RentalStatusEnum.RETURNED) {
          const score: Score = {
            damageToCar: Math.floor(Math.random() * 6),
            unpaidFines: Math.floor(Math.random() * 6),
            arrears: Math.floor(Math.random() * 6),
            carAbuse: Math.floor(Math.random() * 6),
            badAttitude: Math.floor(Math.random() * 6),
          };
          const promedio =
            (score.damageToCar +
              score.unpaidFines +
              score.arrears +
              score.carAbuse +
              score.badAttitude) /
            5;
          const feedback: CreateRentalFeedbackDto = {
            rentalId: savedRental.id,
            score: score,
            criticalFlags: {
              impersonation: Boolean(Math.floor(Math.random() * 2)),
              vehicleTheft: Boolean(Math.floor(Math.random() * 2)),
            },
            comments: [
              'Cliente muy puntual, entregó el vehículo en perfectas condiciones.',
              'Mal cliente',
            ][promedio > 3 ? 0 : 1],
          };
          const savedFeedback = this.RentalFeedbackRepository.create(feedback);
          await this.RentalFeedbackRepository.save(savedFeedback);
          await this.recalculateCustomerScore(customer.id);
        }
      }
    }
    console.log('✅ Rentas y Feedbacks creados exitosamente');
  }

  private async fakeBiometryRequestsSeeder() {
    const count = await this.BiometryRequestRepository.count();
    if (count > 0) return;

    const customers = await this.CustomerRepository.find();
    const users = await this.UserRepository.find({
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
    await this.BiometryRequestRepository.insert(biometryData);
    console.log('✅ Biometrías sembradas exitosamente');
  }

  private async recalculateCustomerScore(customerId: string): Promise<number> {
    // Obtener todos los feedbacks del cliente
    const feedbacks = await this.RentalFeedbackRepository.createQueryBuilder(
      'feedback',
    )
      .innerJoin('feedback.rental', 'rental')
      .where('rental.customerId = :customerId', { customerId })
      .getMany();

    if (feedbacks.length === 0) {
      // Sin feedbacks, score es 0 y status normal
      await this.CustomerRepository.update(customerId, {
        generalScore: 5,
        status: CustomerStatusEnum.NORMAL,
      });
      return 5;
    }

    // Verificar si tiene critical flags
    const hasCriticalFlags = feedbacks.some(
      (feedback) =>
        feedback.criticalFlags.impersonation ||
        feedback.criticalFlags.vehicleTheft,
    );

    // Calcular promedio de los scores de cada feedback
    const totalScore = feedbacks.reduce((sum, feedback) => {
      const feedbackScore = (
        (5 - feedback.score.damageToCar) +
        (5 - feedback.score.unpaidFines) +
        (5 - feedback.score.arrears) +
        (5 - feedback.score.carAbuse) +
        (5 - feedback.score.badAttitude)
      ) / 5;

      return sum + feedbackScore;
    }, 0);

    const averageScore = totalScore / feedbacks.length;
    const roundedScore = Math.round(averageScore * 100) / 100; // 2 decimales

    // Determinar el status basado en las reglas
    let status: CustomerStatusEnum;

    if (hasCriticalFlags) {
      // Prioridad 1: Critical flags = red_alert
      status = CustomerStatusEnum.RED_ALERT;
    } else if (roundedScore < 3) {
      // Prioridad 2: Score bajo = yellow_alert
      status = CustomerStatusEnum.YELLOW_ALERT;
    } else {
      // Todo bien = normal
      status = CustomerStatusEnum.NORMAL;
    }

    // Actualizar el cliente con score y status
    await this.CustomerRepository.update(customerId, {
      generalScore: roundedScore,
      status: status,
    });

    return roundedScore;
  }
}
