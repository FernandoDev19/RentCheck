import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Role } from '../roles/entities/role.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Renter } from '../renters/entities/renter.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let branchRepository: Repository<any>;
  let roleRepository: Repository<any>;
  let employeeRepository: Repository<any>;
  let renterRepository: Repository<any>;
  let jwtService: JwtService;

  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  });

  const mockJwt = {
    signAsync: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Renter),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwt,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    branchRepository = module.get<Repository<Branch>>(
      getRepositoryToken(Branch),
    );
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    renterRepository = module.get<Repository<Renter>>(
      getRepositoryToken(Renter),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('Should to be defined', () => {
    expect(service).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(branchRepository).toBeDefined();
    expect(roleRepository).toBeDefined();
    expect(employeeRepository).toBeDefined();
    expect(renterRepository).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('Login por Roles', () => {
    it('Should login with admin role', async () => {
      const role: Role = {
        id: 1,
        name: 'Admin Rentcheck',
        users: [],
      };

      const loginDto: LoginDto = {
        email: 'admin@rentcheck.com',
        password: '123456',
      };

      const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Admin User',
        email: 'admin@rentcheck.com',
        password: 'hashed-password',
        role: role,
        roleId: 1,
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
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('accessToken');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });
});
