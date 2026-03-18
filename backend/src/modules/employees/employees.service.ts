import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { ILike, Repository } from 'typeorm';
import { RolesEnum } from '../../core/enums/roles.enum';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async create(
  //   createEmployeeDto: CreateEmployeeDto,
  //   user: UserActiveInterface,
  // ) {
  //   const role = await this.roleService.findOneByName(RolesEnum.EMPLOYEE);

  //   const employeeExists = await this.employeeRepository.findOne({
  //     where: {
  //       identityNumber: createEmployeeDto.identityNumber,
  //       branchId: user.branchId,
  //     },
  //   });

  //   if (employeeExists) throw new ConflictException('Employee already exists');

  //   const employee = this.employeeRepository.create({
  //     ...createEmployeeDto,
  //     branchId: user.branchId,
  //   });
  //   const savedEmployee = await this.employeeRepository.save(employee);

  //   await this.userService.create({
  //     name: createEmployeeDto.name,
  //     email: createEmployeeDto.email,
  //     password: await bcrypt.hash(createEmployeeDto.password, 10),
  //     roleId: role.id || 3,
  //     employeeId: savedEmployee.id,
  //   });

  //   return savedEmployee;
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'DESC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Employee>> {
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
    try {
      const employee = await this.employeeRepository.findOne({
        where: [{ id }, { branchId: user.branchId }],
        relations: ['user'],
      });

      if (!employee) throw new NotFoundException('employee not found');

      return employee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    user: UserActiveInterface,
  ) {
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

    return await this.employeeRepository.update(id, {
      name: updateEmployeeDto.name,
      identityType: updateEmployeeDto.identityType,
      identityNumber: updateEmployeeDto.identityNumber,
      branchId: updateEmployeeDto.branchId,
    });
  }

  async remove(id: string, user: UserActiveInterface) {
    await this.findOne(id, user);

    await this.update(id, { status: UserStatus.SUSPENDED }, user);

    return await this.employeeRepository.softDelete(id);
  }
}
