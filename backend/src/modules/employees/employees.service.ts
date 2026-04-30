import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { ILike, Repository } from 'typeorm';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../shared/interfaces/list-response';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { Role } from '../roles/entities/role.entity';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { Branch } from '../branches/entities/branch.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

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
      branchId = userExist.branchId;
    } else if (userExist.renterId) {
      if (!registerEmployeeDto.branchId) {
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'DESC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Employee>> {
    this.logger.log(`FindAll: ${user.email}`);

    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Employee>([
      'name',
      'identityNumber',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Employee)
      ? (orderBy as keyof Employee)
      : 'createdAt';

    let where: any[] = [];
    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        where = [
          { branch: { renterId: user.renterId }, name: ILike(`%${search}%`) },
          {
            branch: { renterId: user.renterId },
            identityNumber: ILike(`%${search}%`),
          },
        ];
        break;
      case RolesEnum.MANAGER:
        where = [
          { branchId: user.branchId, name: ILike(`%${search}%`) },
          { branchId: user.branchId, identityNumber: ILike(`%${search}%`) },
        ];
        break;
    }

    const [data, total] = await this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.branch', 'branch')
      .select([
        'employee.id',
        'branch.id',
        'branch.name',
        'employee.name',
        'user.id',
        'user.email',
        'employee.identityType',
        'employee.identityNumber',
        'employee.createdAt',
        'user.status',
      ])
      .orderBy(`employee.${safeOrderBy}`, safeOrderDir)
      .take(limit)
      .skip((page - 1) * limit)
      .where(where)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: UserActiveInterface) {
    this.logger.log(`FindOne: ${user.email} - ${id}`);

    let employee: Employee;

    try {
      employee = await this.employeeRepository.findOne({
        where: [{ id }, { branchId: user.branchId }],
        relations: ['user'],
      });
    } catch (error) {
      this.logger.error('Error al obtener el empleado', error);
      throw new BadRequestException('Error trying to find employee');
    }

    if (!employee) throw new NotFoundException('employee not found');

    this.logger.log(`FindOne: ${user.email} - ${id} - Empleado encontrado`);

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    user: UserActiveInterface,
  ) {
    this.logger.log(`Update: ${user.email} - ${id}`);

    await this.findOne(id, user);

    if (updateEmployeeDto.name || updateEmployeeDto.email) {
      await this.userRepository.update(
        {
          employee: { id },
        },
        {
          name: updateEmployeeDto.name,
          email: updateEmployeeDto.email,
          status: updateEmployeeDto.status,
        },
      );
    }

    const employeeUpdate = await this.employeeRepository.update(id, {
      name: updateEmployeeDto.name,
      identityType: updateEmployeeDto.identityType,
      identityNumber: updateEmployeeDto.identityNumber,
      branchId: updateEmployeeDto.branchId,
    });

    this.logger.log(`Update: ${user.email} - ${id} - Empleado actualizado`);

    return employeeUpdate;
  }

  async remove(id: string, user: UserActiveInterface) {
    this.logger.log(`Remove: ${user.email} - ${id}`);

    await this.findOne(id, user);

    await this.update(id, { status: UserStatus.SUSPENDED }, user);

    const employeeDelete = await this.employeeRepository.softDelete(id);

    this.logger.log(`Remove: ${user.email} - ${id} - Empleado eliminado`);

    return employeeDelete;
  }
}
