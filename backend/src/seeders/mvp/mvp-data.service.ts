import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Plan } from '../../modules/plans/entities/plan.entity';
import { Renter } from '../../modules/renters/entities/renter.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Rental } from '../../modules/rentals/entities/rental.entity';
import { RentalFeedback } from '../../modules/rental-feedbacks/entities/rental-feedback.entity';
import { BiometryRequest } from '../../modules/biometry-requests/entities/biometry-request.entity';
import { RolesSeeder } from './roles.seeder';
import { PlansSeeder } from './plans.seeder';
import { AdminSeeder } from './admin-user.seeder';
import { FakeRentersSeeder } from './renters.seeder';
import { FakeBranchesSeeder } from './branches.seeder';
import { EmployeesSeeder } from './employees.seeder';
import { fakeCustomersSeeder } from './customers.seeder';
import { fakeRentalsSeeder } from './rentals.seeder';
import { fakeBiometryRequestsSeeder } from './biometry-requests.seeder';
import { EnvVars } from '../../core/config/env.config';

@Injectable()
export class MvpDataService {
  constructor(
    private readonly config: ConfigService<EnvVars>,
    @InjectRepository(Role) private readonly RoleRepository: Repository<Role>,
    @InjectRepository(User) private readonly UserRepository: Repository<User>,
  ) {}

  async run() {
    console.time('Total Seeding Time');

    if (
      this.config.get<'development' | 'production'>('NODE_ENV') ===
      'development'
    ) {
      await this.resetDatabase();
    }

    // Usar transacción para consistencia
    await this.RoleRepository.manager.transaction(
      async (transactionManager) => {
        console.log('Starting base seeders...');

        await RolesSeeder(transactionManager.getRepository(Role));
        await PlansSeeder(transactionManager.getRepository(Plan));
        await AdminSeeder(
          transactionManager.getRepository(Role),
          transactionManager.getRepository(User),
          this.config,
          bcrypt,
        );
      },
    );

    if (this.config.get('NODE_ENV', { infer: true }) === 'development') {
      console.log('Starting development seeders...');

      await this.processSeedersInBatches();
    }

    console.timeEnd('Total Seeding Time');
    console.log('All seeders completed successfully!');
  }

  private async processSeedersInBatches() {
    // Batch 1: Core entities (renters, branches, employees)
    await this.RoleRepository.manager.transaction(async (tm) => {
      // Ejecutar en orden secuencial debido a dependencias
      await FakeRentersSeeder(
        tm.getRepository(Role),
        tm.getRepository(Renter),
        tm.getRepository(User),
        bcrypt,
      );

      await FakeBranchesSeeder(
        tm.getRepository(Renter),
        tm.getRepository(Role),
        tm.getRepository(Branch),
        tm.getRepository(User),
        bcrypt,
      );

      await EmployeesSeeder(
        tm.getRepository(Branch),
        tm.getRepository(Role),
        tm.getRepository(Employee),
        tm.getRepository(User),
        bcrypt,
      );
    });

    // Batch 2: Business entities (customers, rentals, biometry)
    await this.RoleRepository.manager.transaction(async (tm) => {
      await fakeCustomersSeeder(
        tm.getRepository(Customer),
        tm.getRepository(User),
      );

      await Promise.all([
        fakeRentalsSeeder(
          tm.getRepository(Rental),
          tm.getRepository(Customer),
          tm.getRepository(Employee),
          tm.getRepository(RentalFeedback),
        ),
        fakeBiometryRequestsSeeder(
          tm.getRepository(BiometryRequest),
          tm.getRepository(Customer),
          tm.getRepository(Employee),
        ),
      ]);
    });
  }

  private async resetDatabase() {
    console.log('Reiniciando base de datos...');

    const entities = [
      'rental_feedbacks',
      'rentals',
      'biometry_requests',
      'customers',
      'employees',
      'branches',
      'renters',
      'users',
      'plans',
      'roles',
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
