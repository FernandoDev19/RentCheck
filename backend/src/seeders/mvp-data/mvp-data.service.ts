import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Plan } from '../../modules/plans/entities/plan.entity';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Rental } from '../../modules/rentals/entities/rental.entity';
import { RentalFeedback } from '../../modules/rental-feedbacks/entities/rental-feedback.entity';
import { BiometryRequest } from '../../modules/biometry-requests/entities/biometry-request.entity';
import { RolesSeeder } from '../roles.seeder';
import { PlansSeeder } from '../plans.seeder';
import { AdminSeeder } from '../admin-user.seeder';
import { FakeRentersSeeder } from '../renters.seeder';
import { FakeBranchesSeeder } from '../branches.seeder';
import { EmployeesSeeder } from '../employees.seeder';
import { fakeCustomersSeeder } from '../customers.seeder';
import { fakeRentalsSeeder } from '../rentals.seeder';
import { fakeBiometryRequestsSeeder } from '../biometry-requests.seeder';

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

    await RolesSeeder(this.RoleRepository);
    await PlansSeeder(this.PlanRepository);
    await AdminSeeder(
      this.RoleRepository,
      this.UserRepository,
      this.config,
      bcrypt,
    );

    if (
      this.config.get<'development' | 'production'>('NODE_ENV') ===
      'development'
    ) {
      await FakeRentersSeeder(
        this.RoleRepository,
        this.RenterRepository,
        this.UserRepository,
        bcrypt,
      );
      await FakeBranchesSeeder(
        this.RenterRepository,
        this.RoleRepository,
        this.BranchRepository,
        this.UserRepository,
        bcrypt,
      );
      await EmployeesSeeder(
        this.BranchRepository,
        this.RoleRepository,
        this.EmployeeRepository,
        this.UserRepository,
        bcrypt,
      );
      await fakeCustomersSeeder(this.CustomerRepository, this.UserRepository);
      await fakeRentalsSeeder(
        this.RentalRepository,
        this.CustomerRepository,
        this.EmployeeRepository,
        this.RentalFeedbackRepository,
      );
      await fakeBiometryRequestsSeeder(
        this.BiometryRequestRepository,
        this.CustomerRepository,
        this.EmployeeRepository,
      );
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
}
