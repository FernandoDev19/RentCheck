import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserActiveInterface } from './interfaces/active-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Repository } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { Renter } from '../renters/entities/renter.entity';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login: ${email}`);

    const normalizedEmail = email.toLowerCase().trim();

    const userExist =
      await this.userService.findOneByEmailWithPassword(normalizedEmail);

    const isPasswordValid = await bcrypt.compare(password, userExist.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Contraseña incorrecta');

    let renterId: string;

    switch (userExist.role.name as RolesEnum) {
      case RolesEnum.OWNER: {
        this.logger.log(`Login: ${email} - Owner`);
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
        this.logger.log(`Login: ${email} - Manager`);
        const branch: Branch = await this.branchRepository
          .createQueryBuilder('b')
          .innerJoinAndSelect('b.renter', 'renter')
          .where('b.id = :branchId', { branchId: userExist.branchId })
          .select(['renter.id', 'renter.status', 'b.status', 'b.id'])
          .getOne();

        if (!branch || !branch.renter.id) {
          this.logger.error(
            `Login: ${email} - Manager - Sede no encontrada o no tiene rentadora vinculada`,
          );
          throw new UnauthorizedException(
            'Sede no encontrada o no tiene rentadora vinculada',
          );
        }

        renterId = branch.renter.id;
        userExist.branchId = branch.id;

        if (branch.renter.status === RenterStatus.SUSPENDED)
          throw new UnauthorizedException('La rentadora está suspendida');

        if (!branch.status)
          throw new UnauthorizedException('La Sede está suspendida');

        break;
      }
      case RolesEnum.EMPLOYEE: {
        this.logger.log(`Login: ${email} - Employee`);
        const employee: Employee = await this.employeeRepository
          .createQueryBuilder('e')
          .innerJoinAndSelect('e.branch', 'branch')
          .innerJoinAndSelect('branch.renter', 'renter')
          .where('e.id = :employeeId', { employeeId: userExist.employeeId })
          .select([
            'renter.id',
            'renter.status',
            'branch.id',
            'branch.status',
            'e.id',
          ])
          .getOne();

        if (!employee)
          throw new UnauthorizedException('Empleado no encontrado');

        renterId = employee.branch.renter.id;
        userExist.branchId = employee.branch.id;
        userExist.employeeId = employee.id;

        if (employee.branch.renter.status === RenterStatus.SUSPENDED)
          throw new UnauthorizedException('La rentadora está suspendida');

        if (!employee.branch.status)
          throw new UnauthorizedException('La Sede está suspendida');

        break;
      }
    }

    if (
      userExist.status === UserStatus.SUSPENDED ||
      userExist.status === UserStatus.INACTIVE
    ) {
      this.logger.error(`Login: ${email} - Usuario suspendido o eliminado`);
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

    this.logger.log(`Login: ${email} - Usuario autenticado`);

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async registerAdmin(registerDto: RegisterDto) {
    this.logger.log(`Register: ${registerDto.email}`);

    const role = await this.roleService.findOneByName(RolesEnum.ADMIN);

    const user = this.userService.create({
      ...registerDto,
      roleId: role.id,
    });

    this.logger.log(`Register: ${registerDto.email} - Usuario registrado`);

    return user;
  }
}
