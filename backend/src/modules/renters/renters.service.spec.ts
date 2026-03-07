import { Test } from '@nestjs/testing';
import { RentersService } from './renters.service';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { Repository } from 'typeorm';
import { Renter } from './entities/renter.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesEnum } from '../../core/enums/roles.enum';

describe('RentersService', () => {
  let rentersService: RentersService;
  let usersService: UsersService;
  let rolesService: RolesService;

  let renterRepository: Repository<Renter>;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RentersService,
        UsersService,
        RolesService,
        {
          provide: getRepositoryToken(Renter),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMockRepository(),
        },
      ],
    }).compile();
    rentersService = module.get<RentersService>(RentersService);
    usersService = module.get<UsersService>(UsersService);
    rolesService = module.get<RolesService>(RolesService);

    renterRepository = module.get<Repository<Renter>>(
      getRepositoryToken(Renter),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(rentersService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(rolesService).toBeDefined();
    expect(renterRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(roleRepository).toBeDefined();
  });

  it('should create a renter', () => {
    const mockRenter: Renter = {
      id: '1',
      name: 'Test User',
      nit: '123456789',
      address: 'Test Address',
      city: 'Test City',
      phone: '123456789',
      status: 'active',
      legalRepresentative: 'Test Legal Representative',
      planId: 1,
      balance: 0,
      lowBalanceThreshold: 0,
      lowBalanceAlertEnabled: false,
      branches: [],
      rentals: [],
      plan: {
        id: 1,
        name: 'Test Plan',
        price: 0,
        max_users: 0,
        max_branches: 0,
        advanced_reports_enabled: false,
        email_alerts_enabled: false,
        priority_support: false,
        renters: [],
      },
      planExpiresAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        role: {
          id: 1,
          name: RolesEnum.OWNER,
          users: [],
        },
        roleId: 2,
        renterId: null,
        renter: null,
        employeeId: null,
        employee: null,
        branchId: null,
        branch: null,
        status: 'active',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  });
});
