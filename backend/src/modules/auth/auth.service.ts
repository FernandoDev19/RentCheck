import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserActiveInterface } from './interfaces/active-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Repository } from 'typeorm';
import { RegisterBranchDto } from './dto/register-branch.dto';
import { Role } from '../roles/entities/role.entity';
import { RolesEnum } from '../../core/enums/roles.enum';
import { User } from '../users/entities/user.entity';
import { Employee } from '../employees/entities/employee.entity';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { Renter } from '../renters/entities/renter.entity';
import { RegisterRenterDto } from './dto/register-renter.dto';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { UserStatus } from '../users/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResponseDto> {
    const userExist = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'password',
        'roleId',
        'renterId',
        'branchId',
        'employeeId',
      ],
      relations: ['role'],
    });

    if (!userExist)
      throw new UnauthorizedException('Email o usuario no existe');

    const isPasswordValid = await bcrypt.compare(password, userExist.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Contraseña incorrecta');

    let renterId: string;

    switch (userExist.role.name as RolesEnum) {
      case RolesEnum.OWNER: {
        const renter = await this.renterRepository.findOne({
          where: { id: userExist.renterId },
          select: ['status'],
        });
        renterId = userExist.renterId;

        if (renter?.status === RenterStatus.SUSPENDED)
          throw new UnauthorizedException('La rentadora está suspendida');
        break;
      }
      case RolesEnum.MANAGER: {
        const branch = await this.branchRepository.findOne({
          where: { id: userExist.branchId },
          select: ['renterId'],
        });

        if (!branch || !branch.renterId) {
          throw new UnauthorizedException(
            'Sede no encontrada o no tiene rentadora vinculada',
          );
        }

        const renter = await this.renterRepository.findOne({
          where: { id: branch.renterId },
          select: ['status'],
        });
        renterId = branch.renterId;

        if (renter?.status === RenterStatus.SUSPENDED) {
          throw new UnauthorizedException('La rentadora está suspendida');
        }
        break;
      }
      case RolesEnum.EMPLOYEE: {
        const employee = await this.employeeRepository.findOne({
          where: { id: userExist.employeeId },
          relations: ['branch', 'branch.renter'],
        });

        if (!employee)
          throw new UnauthorizedException('Empleado no encontrado');

        renterId = employee.branch.renter.id;
        // IMPORTANTE: Asegúrate de sobreescribir el branchId del userExist
        // por si el User no lo tiene pero el Employee sí.
        userExist.branchId = employee.branch.id;

        if (employee.branch.renter.status === RenterStatus.SUSPENDED)
          throw new UnauthorizedException('La rentadora está suspendida');
        break;
      }
    }

    if (
      userExist.status === UserStatus.SUSPENDED ||
      userExist.status === UserStatus.INACTIVE
    ) {
      throw new UnauthorizedException(
        'Este usuario ha sido suspendido o eliminado, por favor contacta con el administrador',
      );
    }

    const payload: UserActiveInterface = {
      sub: userExist.id,
      email: userExist.email,
      role: userExist.role.name,
      renterId,
      branchId: userExist.branchId,
      employeeId: userExist.employeeId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async registerAdmin(registerDto: RegisterDto) {
    const role = await this.roleRepository.findOne({
      where: { name: RolesEnum.ADMIN },
    });

    const userExist = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (userExist) throw new ConflictException('User already exists');

    const user = this.userRepository.create({
      ...registerDto,
      roleId: role.id,
    });
    return await this.userRepository.save(user);
  }

  async registerRenter(createRenterDto: RegisterRenterDto) {
    const role = await this.roleRepository.findOne({
      where: { name: RolesEnum.OWNER },
    });

    const renterExists = await this.renterRepository.findOne({
      where: [{ nit: createRenterDto.nit }, { name: createRenterDto.name }],
    });

    if (renterExists) throw new ConflictException('Renter already exists');

    const renter = this.renterRepository.create({
      ...createRenterDto,
      status: RenterStatus.SUSPENDED,
    });
    const savedRenter = await this.renterRepository.save(renter);

    const user = this.userRepository.create({
      name: createRenterDto.name,
      email: createRenterDto.email,
      password: await bcrypt.hash(createRenterDto.password, 10),
      roleId: role.id,
      renterId: savedRenter.id,
    });
    await this.userRepository.save(user);

    return savedRenter;
  }

  async registerBranch(
    registerBranchDto: RegisterBranchDto,
    user: UserActiveInterface,
  ) {
    const role = await this.roleRepository.findOne({
      where: { name: RolesEnum.MANAGER },
    });

    const userExist = await this.userRepository.findOne({
      where: { email: user.email },
      select: ['id', 'name', 'email', 'renterId'],
      relations: ['renter', 'renter.plan'],
    });

    const branchesCount = await this.branchRepository.count({
      where: { renterId: userExist.renterId },
    });

    if (!userExist) {
      throw new NotFoundException('User not found');
    }

    if (!userExist.renter) {
      throw new NotFoundException('Renter not found');
    }

    if (userExist.renter.status === RenterStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended');
    }

    if (branchesCount >= userExist.renter.plan.max_branches) {
      throw new ForbiddenException(
        'Has alcanzado el límite de sedes de tu plan ' +
          userExist.renter.plan.name,
      );
    }

    const branchExists = await this.branchRepository.findOne({
      where: [
        { name: registerBranchDto.name, renterId: userExist.renterId },
        { phone: registerBranchDto.phone },
        { email: registerBranchDto.email },
      ],
    });

    if (branchExists) {
      if (
        branchExists.name === registerBranchDto.name &&
        branchExists.renterId === userExist.renterId
      )
        throw new ConflictException(
          'Branch name already exists in your company',
        );
      if (branchExists.phone === registerBranchDto.phone)
        throw new ConflictException('Phone already in use');
      if (branchExists.email === registerBranchDto.email)
        throw new ConflictException('Email already in use');
    }

    const branch = this.branchRepository.create({
      ...registerBranchDto,
      renterId: userExist.renterId,
    });
    const savedBranch = await this.branchRepository.save(branch);

    const userCreate = this.userRepository.create({
      name: registerBranchDto.name,
      email: registerBranchDto.email,
      password: await bcrypt.hash(registerBranchDto.password, 10),
      roleId: role.id,
      branchId: savedBranch.id,
    });

    await this.userRepository.save(userCreate);

    return savedBranch;
  }

  async registerEmployee(
    registerEmployeeDto: RegisterEmployeeDto,
    user: UserActiveInterface,
  ) {
    const role = await this.roleRepository.findOne({
      where: { name: RolesEnum.EMPLOYEE },
    });

    const userExist = await this.userRepository.findOne({
      where: { email: user.email },
      select: ['id', 'name', 'email', 'renterId', 'branchId'],
      relations: [
        'renter',
        'renter.plan',
        'branch',
        'branch.renter',
        'branch.renter.plan',
      ],
    });

    if (!userExist) {
      throw new NotFoundException('User not found');
    }

    const renter = userExist.renter || userExist.branch?.renter;
    const plan = renter.plan;

    if (!renter)
      throw new NotFoundException(
        'No se encontró una rentadora asociada a tu usuario',
      );

    if (renter.status === RenterStatus.SUSPENDED)
      throw new ForbiddenException('This renter is suspended');

    if (!plan) throw new ForbiddenException('No se pudo verificar el plan');

    let branchId: string;

    if (userExist.branchId) {
      // Es Manager: ya tiene sede asignada
      branchId = userExist.branchId;
    } else if (userExist.renterId) {
      // Es Owner: DEBE enviar la sede en el DTO
      if (!registerEmployeeDto.branchId) {
        // ESTO es lo que querías probar
        throw new BadRequestException('Debes especificar la sede del empleado');
      }
      branchId = registerEmployeeDto.branchId;

      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
      });

      if (!branch) {
        throw new BadRequestException(`La sede con ID ${branchId} no existe.`);
      }
    } else {
      throw new ForbiddenException(
        'No tienes permisos para registrar empleados',
      );
    }
    // Validar plan
    const employeesCount = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoin('employee.branch', 'branch')
      .where('branch.renterId = :renterId', { renterId: renter.id })
      .getCount();

    if (employeesCount >= plan.max_users) {
      throw new ForbiddenException(
        `Has alcanzado el límite de empleados de tu plan ${plan.name}`,
      );
    }

    const employeeExist = await this.employeeRepository.findOne({
      where: {
        identityNumber: registerEmployeeDto.identityNumber,
        identityType: registerEmployeeDto.identityType,
        branch: {
          renterId: renter.id,
        },
      },
      relations: ['branch'],
    });

    if (employeeExist) {
      throw new ConflictException(
        `El empleado con identificación ${registerEmployeeDto.identityNumber} ya está registrado en la sede: ${employeeExist.branch.name}`,
      );
    }

    const userEmployeeExist = await this.userRepository.findOne({
      where: { email: registerEmployeeDto.email },
    });

    if (userEmployeeExist) {
      throw new ConflictException(
        `El correo ${registerEmployeeDto.email} ya está registrado. Usa uno distinto.`,
      );
    }

    const employee = this.employeeRepository.create({
      branchId,
      name: registerEmployeeDto.name,
      identityType: registerEmployeeDto.identityType,
      identityNumber: registerEmployeeDto.identityNumber,
    });
    const savedEmployee = await this.employeeRepository.save(employee);

    // Crear usuario y empleado
    const newUser = this.userRepository.create({
      name: registerEmployeeDto.name,
      email: registerEmployeeDto.email,
      password: await bcrypt.hash(registerEmployeeDto.password, 10),
      roleId: role.id,
      employeeId: savedEmployee.id,
    });
    await this.userRepository.save(newUser);

    return savedEmployee;
  }

  async profile({ email, role }: UserActiveInterface) {
    switch (role as RolesEnum) {
      case RolesEnum.OWNER:
        return await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'renter'],
          relations: ['renter', 'renter.plan'],
        });
      case RolesEnum.MANAGER:
        return await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'branch'],
          relations: ['branch', 'branch.renter', 'branch.renter.plan'],
        });
      case RolesEnum.EMPLOYEE:
        return await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'employee'],
          relations: [
            'employee',
            'employee.branch',
            'employee.branch.renter',
            'employee.branch.renter.plan',
          ],
        });
      case RolesEnum.ADMIN:
        return await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role'],
        });
      default:
        return await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role'],
        });
    }
  }
}
